'use client';

import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';
import { useTranslations } from 'next-intl';

export default function KanbanViewPage() {
  const t = useTranslations('kanban');

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard />
    </PageContainer>
  );
}
