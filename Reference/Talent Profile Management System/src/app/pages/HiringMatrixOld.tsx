import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { mockHiringMatrix } from '../data/mockData';
import { HiringMatrix as HiringMatrixType } from '../types';
import { toast } from 'sonner';

export function HiringMatrix() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('Hiring Matrix Approval', 'write');
  const [requests, setRequests] = useState<HiringMatrixType[]>(mockHiringMatrix);

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const rejectedRequests = requests.filter(r => r.status === 'Rejected');

  const handleApprove = (id: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'Approved' as const } : req
      )
    );
    toast.success('Hiring request approved');
  };

  const handleReject = (id: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'Rejected' as const } : req
      )
    );
    toast.error('Hiring request rejected');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const RequestTable = ({ data, showActions }: { data: HiringMatrixType[], showActions: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Position</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Headcount</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Date</TableHead>
          {showActions && canWrite && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">{request.position}</TableCell>
            <TableCell>{request.department}</TableCell>
            <TableCell>{request.headcount}</TableCell>
            <TableCell>{request.budget}</TableCell>
            <TableCell>
              <Badge className={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
            </TableCell>
            <TableCell>{request.requestedBy}</TableCell>
            <TableCell>{request.requestedDate}</TableCell>
            {showActions && canWrite && (
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(request.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (!hasPermission('Hiring Matrix Approval', 'read')) {
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
          <h1 className="text-3xl font-bold">Hiring Matrix Approval</h1>
          <p className="text-muted-foreground">Review and approve hiring requests</p>
        </div>
        {canWrite && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {canWrite ? 'Require your action' : 'Awaiting approval'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Requests
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for recruitment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Headcount
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedRequests.reduce((sum, req) => sum + req.headcount, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approved positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingRequests.length > 0 ? (
                <RequestTable data={pendingRequests} showActions={true} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No pending requests
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {approvedRequests.length > 0 ? (
                <RequestTable data={approvedRequests} showActions={false} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No approved requests
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedRequests.length > 0 ? (
                <RequestTable data={rejectedRequests} showActions={false} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No rejected requests
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
