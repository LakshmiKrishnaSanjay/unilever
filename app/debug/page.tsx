'use client';

import { useWorkflow } from '@/lib/use-workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugPage() {
  const state = useWorkflow();

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Debug Information</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            {state.currentUser ? (
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Username:</span> {state.currentUser.username}
                </p>
                <p>
                  <span className="font-semibold">Name:</span> {state.currentUser.name}
                </p>
                <p>
                  <span className="font-semibold">Role:</span>{' '}
                  <Badge>{state.currentUser.role}</Badge>
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {state.currentUser.email}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No user logged in</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Counts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold">MOCs:</span>
              <Badge variant="secondary">{state.mocs?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">PTWs:</span>
              <Badge variant="secondary">{state.ptws?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Users:</span>
              <Badge variant="secondary">{state.users?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Activity Logs:</span>
              <Badge variant="secondary">{state.activityLog?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Security Logs:</span>
              <Badge variant="secondary">{state.securityLogs?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Contractor Documents:</span>
              <Badge variant="secondary">{state.contractorDocuments?.length ?? 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Notifications:</span>
              <Badge variant="secondary">{state.notifications?.length ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Raw State JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-muted p-4 text-xs">
            {JSON.stringify(
              {
                currentUser: state.currentUser,
                counts: {
                  mocs: state.mocs?.length,
                  ptws: state.ptws?.length,
                  users: state.users?.length,
                  activityLog: state.activityLog?.length,
                  securityLogs: state.securityLogs?.length,
                  contractorDocuments: state.contractorDocuments?.length,
                  notifications: state.notifications?.length,
                },
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
