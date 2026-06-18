"use client";

import { Users, Calendar, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCandidates, mockInterviews, mockHiringMatrix } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Candidates',
      value: mockCandidates.length,
      icon: Users,
      change: '+12% from last month',
    },
    {
      title: 'Upcoming Interviews',
      value: mockInterviews.filter(i => i.status === 'Scheduled').length,
      icon: Calendar,
      change: '3 this week',
    },
    {
      title: 'Pending Approvals',
      value: mockHiringMatrix.filter(h => h.status === 'Pending').length,
      icon: FileCheck,
      change: '2 require action',
    },
  ];

  const recentCandidates = mockCandidates.slice(0, 5);
  const upcomingInterviews = mockInterviews
    .filter(i => i.status === 'Scheduled')
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.position}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {candidate.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{interview.candidateName}</p>
                      <p className="text-sm text-muted-foreground">{interview.type} Interview</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{interview.date}</p>
                      <p className="text-sm text-muted-foreground">{interview.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming interviews</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
