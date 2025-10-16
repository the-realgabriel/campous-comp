import React, { JSX } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { activity } from '@/routes';
import { PlusCircle } from 'lucide-react';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity',
        href: activity().url,
    },
];


export default function Activity(): JSX.Element {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className="p-4 bg-white rounded-xl shadow-md mb-6 h-full relative">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Activity Page</h3>
                        <p className="text-2xl font-bold text-gray-800">No Activity Available</p>

                        <div className="mt-4">
                            <p>Add yoo</p>
                        </div>

                        <button
                            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center shadow-lg"
                            aria-label="Add activity"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" />
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}