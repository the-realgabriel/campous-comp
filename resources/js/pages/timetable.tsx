import React, {JSX, useState} from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types';
import {timetable} from '@/routes'

const breadcrumbs:BreadcrumbItem[] =[
    {
        title: 'Tometable',
        href: timetable().url,
    }
]

export default function Timetable(): JSX.Element {
    const [date, setDate] = useState(new Date());
    const day = date.getDate();
    const [course, setCourse] = useState('');
    const [lecturer, setLecturer] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    
   
    return (
        <AppLayout>
            <Head title="Timetable" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Page Content */}
                            Timetable page is under construction.
                        </div> 
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}