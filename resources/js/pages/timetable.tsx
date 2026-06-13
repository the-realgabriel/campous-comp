import React, { JSX } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import PlannerCalendar from '@/components/planner-calendar';

export default function Timetable(): JSX.Element {
  return (
    <AppLayout>
      <Head title="Planner" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-4 rounded-xl shadow-md h-full relative flex flex-col min-h-[80vh]">
            <PlannerCalendar />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
