'use client';

import { useState } from 'react';
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

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  experience: string;
  skills: string[];
  matchScore?: number;
}

interface JobPosition {
  id: string;
  positionName: string;
}

const mockCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alicia Reyes',
    email: 'alicia.reyes@example.com',
    position: 'Senior Frontend Engineer',
    experience: '6',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Leadership'],
    matchScore: 94,
  },
  {
    id: 'cand-2',
    name: 'Marcus Lim',
    email: 'marcus.lim@example.com',
    position: 'Full Stack Developer',
    experience: '4',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    matchScore: 89,
  },
  {
    id: 'cand-3',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    position: 'Software Engineer',
    experience: '5',
    skills: ['TypeScript', 'Next.js', 'AWS', 'Testing'],
    matchScore: 92,
  },
  {
    id: 'cand-4',
    name: 'Daniel Cho',
    email: 'daniel.cho@example.com',
    position: 'Frontend Engineer',
    experience: '3',
    skills: ['React', 'Tailwind', 'GraphQL'],
    matchScore: 86,
  },
  {
    id: 'cand-5',
    name: 'Rina Sato',
    email: 'rina.sato@example.com',
    position: 'Tech Lead',
    experience: '8',
    skills: ['Node.js', 'Leadership', 'System Design', 'AWS', 'React'],
    matchScore: 96,
  },
];

const mockJobPositions: JobPosition[] = [
  { id: 'job-1', positionName: 'Senior React Engineer' },
  { id: 'job-2', positionName: 'Full Stack Developer' },
  { id: 'job-3', positionName: 'Engineering Manager' },
];

interface MatchResult {
  rank: number;
  candidate: Candidate;
  strengths: string;
  gaps: string;
  selectedJob: string;
}

export default function AIMatching() {
  const hasPermission = (_feature: string, _action: 'read' | 'write') => true;
  const canWrite = hasPermission('AI Matching', 'write');
  const [prompt, setPrompt] = useState('');
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  const handleMatch = async () => {
    if (!prompt.trim()) return;

    setMatching(true);
    setResults([]);

    // Simulate AI matching
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock results with strengths and gaps
    const mockResults: MatchResult[] = mockCandidates.slice(0, 5).map((candidate: Candidate, index: number) => ({
      rank: index + 1,
      candidate,
      strengths: generateStrengths(candidate),
      gaps: generateGaps(candidate),
      selectedJob: '-',
    }));

    setResults(mockResults);
    setMatching(false);
  };

  const generateStrengths = (candidate: Candidate) => {
    const strengths = [];
    if (candidate.skills.length > 4) strengths.push(`Strong technical skillset with ${candidate.skills.slice(0, 3).join(', ')}`);
    if (parseInt(candidate.experience) >= 5) strengths.push('Extensive industry experience');
    if (candidate.matchScore && candidate.matchScore > 90) strengths.push('Excellent cultural fit');
    return strengths.join('. ') || 'Good communication skills and relevant experience';
  };

  const generateGaps = (candidate: Candidate) => {
    const gaps = [];
    if (!candidate.skills.includes('AWS')) gaps.push('No cloud platform experience');
    if (parseInt(candidate.experience) < 5) gaps.push('Limited years of experience');
    if (!candidate.skills.includes('Leadership')) gaps.push('No leadership experience mentioned');
    return gaps.join('. ') || 'Minor skill gaps that can be addressed through training';
  };

  const handleJobSelection = (rank: number, jobId: string) => {
    setResults(prev =>
      prev.map(result =>
        result.rank === rank ? { ...result, selectedJob: jobId } : result
      )
    );

    if (jobId !== '-') {
      const job = mockJobPositions.find((j: JobPosition) => j.id === jobId);
      const candidate = results.find(r => r.rank === rank)?.candidate;
      toast.success(`${candidate?.name} added to shortlisted pool for ${job?.positionName}`);
    }
  };

  const examplePrompts = [
    'Find senior software engineers with React and TypeScript experience',
    'Looking for data scientists with machine learning background',
    'UX designers with Figma expertise for fintech projects',
  ];

  if (!hasPermission('AI Matching', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don't have permission to access this feature.</p>
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
          <CardDescription>
            {canWrite
              ? 'Describe your ideal candidate and let AI find the best matches'
              : 'You have read-only access to this feature'}
          </CardDescription>
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

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Try example prompts:
            </div>
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

          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => canWrite && setPrompt(example)}
                disabled={!canWrite}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Matching Results</CardTitle>
            <CardDescription>Candidates ranked by AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-100 dark:bg-orange-900/20">
                    <TableHead className="text-orange-700 dark:text-orange-300 font-bold">#</TableHead>
                    <TableHead className="text-orange-700 dark:text-orange-300 font-bold">Candidate</TableHead>
                    <TableHead className="text-orange-700 dark:text-orange-300 font-bold min-w-[300px]">Strengths</TableHead>
                    <TableHead className="text-orange-700 dark:text-orange-300 font-bold min-w-[300px]">Gaps</TableHead>
                    {canWrite && (
                      <TableHead className="text-orange-700 dark:text-orange-300 font-bold min-w-[200px]">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.rank}>
                      <TableCell className="font-bold text-orange-600 dark:text-orange-400">
                        {result.rank}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-blue-600 dark:text-blue-400">{result.candidate.name}</p>
                          <p className="text-sm text-muted-foreground">{result.candidate.position}</p>
                          <p className="text-xs text-muted-foreground">{result.candidate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{result.strengths}</TableCell>
                      <TableCell className="text-sm">{result.gaps}</TableCell>
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
                              {mockJobPositions.map((job: JobPosition) => (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.positionName}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
