'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { auditLogsQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { Icons } from '@/components/icons';

export function AuditLogTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    action: parseAsString,
    search: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.action && { action: params.action }),
    ...(params.search && { search: params.search })
  };

  const { data } = useSuspenseQuery(auditLogsQueryOptions(filters));

  const pageCount = data.pageCount || Math.ceil(data.total / params.perPage) || 1;

  const { table } = useDataTable({
    data: data.logs,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 400
  });

  if (data.total === 0 && !params.search && !params.action) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <Icons.clock className='h-6 w-6 text-muted-foreground' />
        </div>
        <h3 className='mt-4 text-base font-semibold'>No activity recorded</h3>
        <p className='mt-1 text-sm text-muted-foreground max-w-sm'>
          Actions performed in this workspace (invitations, role changes, settings updates) will be automatically audited and displayed here.
        </p>
      </div>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function AuditLogTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={6}
      rowCount={10}
      filterCount={1}
      cellWidths={['140px', '180px', '140px', '160px', '140px', '200px']}
    />
  );
}
