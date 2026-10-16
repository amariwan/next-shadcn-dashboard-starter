'use client';

import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { orgsEnabled } from '@/lib/orgs';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { activeOrgQueryOptions, organizationKeys } from '@/features/organizations/api/queries';
import { switchActiveOrg } from '@/features/organizations/api/service';

function OrgAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={cn(
        'bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-medium',
        className
      )}
    >
      {initials}
    </div>
  );
}

/** Workspace switcher for the sidebar header. Renders nothing when orgs are disabled. */
export function OrgSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    ...activeOrgQueryOptions(),
    enabled: orgsEnabled
  });

  const switchMutation = useMutation({
    mutationFn: (orgId: string) => switchActiveOrg(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      router.refresh();
    }
  });

  if (!orgsEnabled) return null;
  if (isPending) {
    return (
      <div className='flex items-center gap-2 px-2 py-1.5'>
        <Skeleton className='size-8 rounded-lg' />
        <div className='grid flex-1 gap-1'>
          <Skeleton className='h-3.5 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
      </div>
    );
  }

  const organizations = data?.organizations ?? [];
  const active = organizations.find((o) => o.id === data?.activeOrgId) ?? organizations[0];

  if (!active) {
    return (
      <SidebarMenuButton size='lg' asChild>
        <Link href='/dashboard/workspaces'>
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <Icons.add className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>No workspace</span>
            <span className='text-muted-foreground truncate text-xs'>Create one to begin</span>
          </div>
        </Link>
      </SidebarMenuButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <OrgAvatar name={active.name} />
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>{active.name}</span>
            <span className='text-muted-foreground truncate text-xs capitalize'>{active.role}</span>
          </div>
          <Icons.chevronsDown className='ml-auto size-4' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        align='start'
        side='bottom'
        sideOffset={4}
      >
        <DropdownMenuLabel className='text-muted-foreground text-xs'>Workspaces</DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchMutation.mutate(org.id)}
            className={cn(org.id === active.id && 'bg-accent')}
          >
            <OrgAvatar name={org.name} className='size-6 text-[10px]' />
            <span className='truncate'>{org.name}</span>
            {org.id === active.id && <Icons.check className='ml-auto size-4' />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/workspaces')}>
          <Icons.add className='mr-2 h-4 w-4' />
          New workspace
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => active && router.push(`/dashboard/workspaces/${active.id}`)}
        >
          <Icons.settings className='mr-2 h-4 w-4' />
          Manage workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
