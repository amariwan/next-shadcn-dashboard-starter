import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending';
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'Platform Deployment v1.4',
    description: 'Automated CI/CD pipeline finished with 0 errors.',
    timestamp: '10m ago',
    status: 'completed'
  },
  {
    id: 'evt-2',
    title: 'Data Migration Batch 3',
    description: 'Indexing 45,000 user records into vector store.',
    timestamp: '45m ago',
    status: 'in-progress'
  },
  {
    id: 'evt-3',
    title: 'Security Scan & Vulnerability Check',
    description: 'Scheduled weekly agentic surface inspection.',
    timestamp: '2h ago',
    status: 'completed'
  },
  {
    id: 'evt-4',
    title: 'Backup Snapshot Execution',
    description: 'Hourly snapshot of SQLite state.',
    timestamp: '4h ago',
    status: 'completed'
  }
];

export function RecentEventsCard({
  events = DEFAULT_EVENTS,
  isDemo = true,
  className
}: {
  events?: TimelineEvent[];
  isDemo?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Recent Events</CardTitle>
            <CardDescription>System pipelines and operational status</CardDescription>
          </div>
          {isDemo && (
            <Badge variant='outline' className='text-muted-foreground text-[10px] uppercase'>
              Demo Data
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-3.5'>
        {events.map((evt) => (
          <div key={evt.id} className='flex items-start justify-between gap-3 text-xs'>
            <div className='space-y-0.5'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-foreground'>{evt.title}</span>
                <Badge
                  variant={evt.status === 'completed' ? 'secondary' : 'outline'}
                  className='text-[10px] capitalize'
                >
                  {evt.status}
                </Badge>
              </div>
              <p className='text-muted-foreground line-clamp-1'>{evt.description}</p>
            </div>
            <span className='text-muted-foreground shrink-0 text-[10px]'>{evt.timestamp}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
