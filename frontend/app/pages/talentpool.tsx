"use client";

import { useEffect, useState } from 'react';
import { Search, Filter, Mail, Phone, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToCandidatesCollection, type FirestoreCandidate } from '@/lib/firebase';

type TalentPoolCandidate = FirestoreCandidate & { id: string };

export function TalentPool() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('Searchable Talent Pool', 'write');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [candidates, setCandidates] = useState<TalentPoolCandidate[]>([]);

  useEffect(() => {
    return subscribeToCandidatesCollection(setCandidates);
  }, []);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      (candidate.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.work_history?.[0]?.role ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.skills ?? []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!hasPermission('Searchable Talent Pool', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don't have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Talent Pool</h1>
        </div>
        {canWrite && (
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, position, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Approve to Hire">Approve to Hire</SelectItem>
                <SelectItem value="Hired">Hired</SelectItem>
                <SelectItem value="2nd Interview">2nd Interview</SelectItem>
                <SelectItem value="KIV">KIV</SelectItem>
                <SelectItem value="Reject">Reject</SelectItem>
                <SelectItem value="Recommendation">Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCandidates.length} of {candidates.length} candidates
      </div>

      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{candidate.name}</h3>
                      <p className="text-muted-foreground">{candidate.work_history?.[0]?.role ?? 'Position not specified'}</p>
                    </div>
                    <Badge variant="outline">
                      {candidate.status ?? 'Unknown'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {candidate.email ?? '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {candidate.phone ?? '-'}
                    </div>
                    <div>{candidate.years_of_experience ?? 0} years experience</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(candidate.skills ?? []).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Education: </span>
                    <span>{candidate.highest_education ?? candidate.education_level ?? '-'}</span>
                  </div>

                </div>

                <div className="flex lg:flex-col gap-2">
                  <Button variant="outline" className="flex-1 lg:flex-none">
                    View Profile
                  </Button>
                  {canWrite && (
                    <Button className="flex-1 lg:flex-none">
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No candidates found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
