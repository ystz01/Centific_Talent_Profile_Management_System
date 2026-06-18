import { useState } from 'react';
import { Calendar, Clock, User, Video, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { mockInterviews } from '../data/mockData';
import { Interview } from '../types';

export function Interviews() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('Interview Management', 'write');
  const [interviews] = useState<Interview[]>(mockInterviews);

  const scheduledInterviews = interviews.filter(i => i.status === 'Scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'Completed');
  const cancelledInterviews = interviews.filter(i => i.status === 'Cancelled');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HR': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Final': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const InterviewCard = ({ interview }: { interview: Interview }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{interview.candidateName}</h3>
              <p className="text-sm text-muted-foreground">{interview.position}</p>
            </div>
            <Badge className={getTypeColor(interview.type)}>
              {interview.type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {interview.date}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {interview.time}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <User className="h-4 w-4" />
              Interviewer: {interview.interviewer}
            </div>
          </div>

          {interview.feedback && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-1">Feedback:</p>
              <p className="text-sm text-muted-foreground">{interview.feedback}</p>
            </div>
          )}

          {interview.notes && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-1">Notes:</p>
              <p className="text-sm text-muted-foreground">{interview.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            {interview.status === 'Scheduled' && (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
                {canWrite && (
                  <>
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </>
                )}
              </>
            )}
            {interview.status === 'Completed' && canWrite && (
              <Button variant="outline" size="sm" className="flex-1">
                Add Feedback
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!hasPermission('Interview Management', 'read')) {
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
          <h1 className="text-3xl font-bold">Interview Management</h1>
          <p className="text-muted-foreground">Schedule and track candidate interviews</p>
        </div>
        {canWrite && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        )}
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledInterviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {scheduledInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scheduled interviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInterviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed interviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No cancelled interviews</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
