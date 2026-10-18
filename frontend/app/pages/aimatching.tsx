'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { addToShortlistedPool, subscribeToCandidatesCollection, subscribeToOpenJobPositions, type FirestoreCandidate, type FirestoreJobPosition } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  experience: string;
  skills: string[];
  matchScore?: number;
  source: FirestoreCandidate & { id: string };
}

interface MatchResult {
  rank: number;
  candidate: Candidate;
  strengths: string;
  gaps: string;
  selectedJob: string;
  fitScore: number;
}

export default function AIMatching() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('AI Matching', 'write');
  const [prompt, setPrompt] = useState('');
  const [matching, setMatching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobPositions, setJobPositions] = useState<Array<FirestoreJobPosition & { id: string }>>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [matchingMessage, setMatchingMessage] = useState('');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

  useEffect(() => {
    return subscribeToCandidatesCollection(
      (records) => {
        setCandidates(records.map((candidate) => ({
          id: candidate.id,
          name: candidate.name ?? 'Unnamed candidate',
          email: candidate.email ?? '',
          position: candidate.location ?? '',
          experience: String(candidate.years_of_experience ?? 0),
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          source: candidate,
        })));
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load candidates from Firebase.');
      }
    );
  }, []);

  useEffect(() => {
    return subscribeToOpenJobPositions(
      setJobPositions,
      (error) => {
        console.error(error);
        toast.error('Unable to load open job positions.');
      }
    );
  }, []);

  const handleMatch = async () => {
    if (!prompt.trim()) return;

    setMatching(true);
    setResults([]);
    setMatchingMessage('');

    try {
      if (!apiBaseUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured.');
      const activeCandidates = candidates.filter(
        ({ source }) => source.status?.trim().toLowerCase() === 'active',
      );
      if (activeCandidates.length === 0) {
        throw new Error('No active candidates are available for matching.');
      }

      const response = await fetch(`${apiBaseUrl}/api/find-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          candidate_pool: activeCandidates.map(({ source }) => source),
        }),
      });
      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) as {
        evaluations?: Array<{
          name: string;
          fit_score: number;
          key_strengths: string[];
          gaps_or_risks: string[];
        }>;
        detail?: string;
      } : {};
      if (!response.ok) throw new Error(result.detail || `Matching failed with status ${response.status}.`);

      const evaluations = result.evaluations ?? [];
      const matchedResults = evaluations
        .map((evaluation) => {
          const candidate = activeCandidates.find((item) => item.name.toLowerCase() === evaluation.name.toLowerCase());
          return candidate ? {
            rank: 0,
            candidate,
            strengths: evaluation.key_strengths?.join('. ') || 'No specific strengths identified.',
            gaps: evaluation.gaps_or_risks?.join('. ') || 'No specific gaps identified.',
            selectedJob: '-',
            fitScore: evaluation.fit_score ?? 0,
          } : null;
        })
        .filter((item): item is MatchResult => item !== null)
        .sort((a, b) => b.fitScore - a.fitScore)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      setResults(matchedResults);
      if (matchedResults.length === 0) {
        setMatchingMessage('No candidates matched your requirements. Try adjusting your search criteria.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Unable to match candidates.');
    } finally {
      setMatching(false);
    }
  };

  const handleJobSelection = async (rank: number, jobId: string) => {
    setResults(prev =>
      prev.map(result =>
        result.rank === rank ? { ...result, selectedJob: jobId } : result
      )
    );

    if (jobId !== '-') {
      const job = jobPositions.find((j) => j.id === jobId);
      const result = results.find((item) => item.rank === rank);
      if (!job || !result) return;

      try {
        await addToShortlistedPool({
          candidate: result.candidate.source,
          jobId: job.id,
          jobName: job.Position,
          fitScore: result.fitScore,
          strengths: result.strengths.split('. '),
          gaps: result.gaps.split('. '),
        });
        toast.success(`${result.candidate.name} added to shortlisted pool for ${job.Position}`);
      } catch (error) {
        console.error(error);
        toast.error('Unable to save candidate to the shortlisted pool.');
      }
    }
  };

  if (!hasPermission('AI Matching', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Matching</h1>
      </div>

      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Agent Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: I'm looking for a senior full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Must have experience leading teams and working in agile environments..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            disabled={!canWrite}
            rows={6}
            className="resize-none"
          />

          <div className="flex items-center justify-end">
            <Button
              onClick={handleMatch}
              disabled={!canWrite || !prompt.trim() || matching}
            >
              {matching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Find Matches
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {(results.length > 0 || matchingMessage) && (
        <Card>
          <CardHeader>
            <CardTitle>AI Matching Results</CardTitle>
            <CardDescription>
              {matchingMessage || 'Candidates ranked by AI analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchingMessage ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {matchingMessage}
              </p>
            ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table className="w-full table-fixed text-black">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black font-bold">#</TableHead>
                    <TableHead className="text-black font-bold">Candidate</TableHead>
                    <TableHead className="w-[16%] text-black font-bold">Email</TableHead>
                    <TableHead className="w-[26%] text-black font-bold">Strengths</TableHead>
                    <TableHead className="w-[26%] text-black font-bold">Gaps</TableHead>
                    {canWrite && (
                      <TableHead className="text-black font-bold min-w-[200px]">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.rank}>
                      <TableCell className="font-bold text-black">
                        {result.rank}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-black">{result.candidate.name}</p>
                      </TableCell>
                      <TableCell className="align-top text-sm text-black whitespace-normal break-all">
                        {result.candidate.email}
                      </TableCell>
                      <TableCell className="align-top text-sm text-black whitespace-normal break-words">
                        {result.strengths}
                      </TableCell>
                      <TableCell className="align-top text-sm text-black whitespace-normal break-words">
                        {result.gaps}
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <Select
                            value={result.selectedJob}
                            onValueChange={(value: string) => handleJobSelection(result.rank, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select job" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-">-</SelectItem>
                              {jobPositions.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.Position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
