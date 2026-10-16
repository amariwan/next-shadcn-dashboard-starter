'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { auditLogsQueryOptions } from '@/features/organizations/api/queries';

export interface ActivityItem {
  id: string;
  action: string;
  user: string;
  time: string;
  description: string;
  icon?: React.ReactNode;
}

const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: 'demo-1',
    action: 'Workspace Updated',
    user: 'Sarah Connor',
    time: '5m ago',
    description: 'Renamed workspace to Global Engineering'
  },
  {
    id: 'demo-2',
    action: 'Member Invited',
    user: 'Alex Rivera',
    time: '25m ago',
    description: 'Invited john.doe@company.com with Admin role'
  },
  {
    id: 'demo-3',
    action: 'Role Modified',
    user: 'Marcus Vance',
    time: '1h ago',
    description: 'Promoted Elena Fisher to Admin'
  },
  {
    id: 'demo-4',
    action: 'Settings Saved',
    user: 'System',
    time: '3h ago',
    description: 'Automated compliance checkpoint succeeded'
  }
];

export function ActivityFeedCard({ className }: { className?: string }) {
  const { data: auditData, isSuccess } = useQuery({
    ...auditLogsQueryOptions({ limit: 5 }),
    retry: false
  });

  const hasLiveLogs = isSuccess && (auditData?.logs?.length ?? 0) > 0;

  const activities: ActivityItem[] = React.useMemo(() => {
    if (hasLiveLogs && auditData) {
      return auditData.logs.slice(0, 5).map((l) => ({
        id: l.id,
        action: l.action.replace(':', ' ').toUpperCase(),
        user: l.userName || l.userEmail || 'System',
        time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `Entity: ${l.entityType} (${l.entityId.slice(0, 12)})`
      }));
    }
    return DEMO_ACTIVITIES;
  }, [hasLiveLogs, auditData]);

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Activity Feed</CardTitle>
            <CardDescription>Recent audit logs and workspace operations</CardDescription>
          </div>
          <Badge variant='outline' className='text-[10px] uppercase'>
            {hasLiveLogs ? (
              <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400'>
                <span className='size-1.5 rounded-full bg-emerald-500' /> Live
              </span>
            ) : (
              'Demo Data'
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {activities.map((item) => (
          <div key={item.id} className='flex items-start gap-3 text-xs'>
            <div className='bg-primary/10 text-primary mt-0.5 rounded-md p-1.5'>
              <Icons.clock className='size-3.5' />
            </div>
            <div className='flex-1 space-y-0.5'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold text-foreground'>{item.action}</span>
                <span className='text-muted-foreground text-[10px]'>{item.time}</span>
              </div>
              <p className='text-muted-foreground line-clamp-1'>{item.description}</p>
              <div className='text-muted-foreground text-[10px]'>by {item.user}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
