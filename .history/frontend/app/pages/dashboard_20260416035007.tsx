"use client";

import { Users, Calendar, FileCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    {
      title: 'Avg Match Score',
      value: '89%',
      icon: TrendingUp,
      change: '+5% improvement',
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
        <p className="text-muted-foreground">Here's what's happening with your recruitment</p>
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'Offer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      candidate.status === 'Interview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      candidate.status === 'Screening' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {candidate.status}
                    </span>
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
