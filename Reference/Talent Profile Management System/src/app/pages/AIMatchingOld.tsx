import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { mockCandidates } from '../data/mockData';
import { Candidate } from '../types';
import { Badge } from '../components/ui/badge';

export function AIMatching() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('AI Matching', 'write');
  const [prompt, setPrompt] = useState('');
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);

  const handleMatch = async () => {
    if (!prompt.trim()) return;

    setMatching(true);
    setResults([]);

    // Simulate AI matching
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock results - return candidates sorted by match score
    const matchedCandidates = [...mockCandidates]
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 3);

    setResults(matchedCandidates);
    setMatching(false);
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Matching</h1>
        <p className="text-muted-foreground">Use AI to find the best candidates for your requirements</p>
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
            onChange={(e) => setPrompt(e.target.value)}
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

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Matches</CardTitle>
            <CardDescription>Candidates ranked by AI match score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.position}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{candidate.matchScore}%</div>
                        <p className="text-xs text-muted-foreground">Match Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{candidate.experience} experience</span>
                      <span>•</span>
                      <span>{candidate.email}</span>
                      <span>•</span>
                      <span>{candidate.phone}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Education: </span>
                      <span>{candidate.education}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
