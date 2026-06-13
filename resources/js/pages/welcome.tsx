import React, {JSX} from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Calendar, Bot, PartyPopper, Wallet, ClipboardList, ShieldCheck, LayoutDashboard } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'At-a-glance overview with upcoming events, assignments, and your calendar planner.',
  },
  {
    icon: Wallet,
    title: 'Fund Manager',
    desc: 'Track transactions, manage accounts, and process payments via Interswitch.',
  },
  {
    icon: ClipboardList,
    title: 'Activity Tracker',
    desc: 'Log, update, and manage activities with a clean minimal interface.',
  },
  {
    icon: Calendar,
    title: 'Calendar Planner',
    desc: 'Interactive monthly calendar for courses, lectures, and personal scheduling.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    desc: 'Groq-powered campus chatbot with chat history and data visualization charts.',
  },
  {
    icon: PartyPopper,
    title: 'Event Space',
    desc: 'Browse, create, and join campus events — filterable by category.',
  },
  {
    icon: ShieldCheck,
    title: 'Access Tiers',
    desc: 'Role-based access with multi-step onboarding for new users.',
  },
];

export default function Welcome(): JSX.Element {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white flex flex-col">
                <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
                            CC
                        </div>
                        <span className="font-semibold text-gray-800">Campous</span>
                    </div>
                    <nav>
                        {auth?.user ? (
                            <Link
                                href={dashboard()}
                                className="text-sm px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href={login()} className="text-sm text-gray-600 hover:text-gray-900 transition">
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="text-sm px-4 py-2 rounded-md bg-amber-600 text-white shadow-sm hover:bg-amber-500 transition"
                                >
                                    Get started
                                </Link>
                            </div>
                        )}
                    </nav>
                </header>

                <main className="flex-1">
                    <div className="max-w-6xl mx-auto px-6 py-20">
                        <section className="text-center max-w-3xl mx-auto">
                            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight">
                                Campus Companion
                            </h1>
                            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                                Manage your campus life — track funds, plan your schedule, log activities,
                                chat with an AI assistant, and discover events. All in one clean, fast dashboard.
                            </p>

                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Link
                                    href={auth?.user ? dashboard() : register()}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg shadow-sm hover:bg-amber-500 transition font-medium"
                                >
                                    {auth?.user ? 'Go to dashboard' : 'Get started free'}
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    See features
                                </a>
                            </div>
                        </section>

                        <section id="features" className="mt-28">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {features.map((f) => (
                                    <div
                                        key={f.title}
                                        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
                                            <f.icon className="w-5 h-5" />
                                        </div>
                c                        <h3 className="font-semibold text-gray-900">{f.title}</h3>
                                        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-28 rounded-2xl bg-gray-900 p-10 sm:p-14 text-center">
                            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
                            <p className="mt-3 text-gray-400 max-w-lg mx-auto">
                                Join your campus community — manage your schedule, finances, and events from one place.
                            </p>
                            <Link
                                href={auth?.user ? dashboard() : register()}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition font-medium"
                            >
                                {auth?.user ? 'Open dashboard' : 'Create your account'}
                            </Link>
                        </section>
                    </div>
                </main>

                <footer className="border-t border-gray-100 bg-white">
                    <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
                        <div>&copy; {new Date().getFullYear()} Campous — Campus Companion</div>
                        <div className="flex gap-4 mt-3 sm:mt-0">
                            <a href="#" className="hover:text-gray-700 transition">Privacy</a>
                            <a href="#" className="hover:text-gray-700 transition">Terms</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
