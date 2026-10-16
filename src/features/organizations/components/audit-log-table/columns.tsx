'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AuditLogItem } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';

function getActionBadgeVariant(
  action: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('delete') || action.includes('revoke') || action.includes('remove')) {
    return 'destructive';
  }
  if (action.includes('create') || action.includes('join')) {
    return 'default';
  }
  if (action.includes('rename') || action.includes('role') || action.includes('update')) {
    return 'secondary';
  }
  return 'outline';
}

export const columns: ColumnDef<AuditLogItem>[] = [
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<AuditLogItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Date & Time' />
    ),
    cell: ({ row }) => {
      const dateStr = row.original.createdAt;
      const formatted = formatDate(dateStr, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const time = new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return (
        <div className='flex flex-col text-xs'>
          <span className='font-medium text-foreground'>{formatted}</span>
          <span className='font-mono text-muted-foreground'>{time}</span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'user',
    accessorKey: 'userName',
    header: 'User',
    cell: ({ row }) => {
      const name = row.original.userName;
      const email = row.original.userEmail;
      const userId = row.original.userId;

      return (
        <div className='flex flex-col text-xs max-w-[200px] truncate'>
          <span className='font-medium text-foreground truncate'>
            {name || 'System / Anonymous'}
          </span>
          <span className='text-muted-foreground truncate'>{email || userId}</span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'action',
    accessorKey: 'action',
    header: ({ column }: { column: Column<AuditLogItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Action' />
    ),
    cell: ({ row }) => {
      const action = row.original.action;
      const variant = getActionBadgeVariant(action);

      return (
        <Badge variant={variant} className='font-mono text-[11px] capitalize'>
          {action}
        </Badge>
      );
    },
    meta: {
      label: 'Action',
      placeholder: 'Search action...',
      variant: 'text',
      icon: Icons.clock
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'entity',
    accessorKey: 'entityType',
    header: 'Entity',
    cell: ({ row }) => {
      const type = row.original.entityType;
      const id = row.original.entityId;

      return (
        <div className='flex items-center gap-1.5 text-xs'>
          <Badge variant='outline' className='text-[10px] uppercase font-semibold'>
            {type}
          </Badge>
          <span
            className='font-mono text-muted-foreground truncate max-w-[120px]'
            title={id}
          >
            {id}
          </span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'organization',
    accessorKey: 'organizationName',
    header: 'Workspace',
    cell: ({ row }) => {
      const orgName = row.original.organizationName;

      return (
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Icons.building className='h-3.5 w-3.5 shrink-0' />
          <span className='truncate max-w-[140px]'>
            {orgName || 'Global'}
          </span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'metadata',
    header: 'Metadata',
    cell: ({ row }) => {
      const metadata = row.original.metadata;
      if (!metadata || Object.keys(metadata).length === 0) {
        return <span className='text-xs text-muted-foreground'>—</span>;
      }

      return (
        <code
          className='text-[11px] bg-muted/60 px-1.5 py-0.5 rounded font-mono text-muted-foreground max-w-[200px] truncate block'
          title={JSON.stringify(metadata, null, 2)}
        >
          {JSON.stringify(metadata)}
        </code>
      );
    },
    enableSorting: false
  }
];
