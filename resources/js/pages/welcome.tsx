import React, {JSX} from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';

export default function Welcome(): JSX.Element {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex flex-col">
                <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-600 flex items-center justify-center text-white font-semibold">
                            C
                        </div>
                        <span className="font-medium text-slate-800">Campous</span>
                    </div>
                    <nav>
                        {auth?.user ? (
                            <Link
                                href={dashboard()}
                                className="text-sm px-4 py-2 rounded-md border border-transparent bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={login()}
                                    className="text-sm text-slate-700 hover:underline"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="text-sm px-4 py-2 rounded-md bg-amber-600 text-white shadow-sm hover:bg-amber-500"
                                >
                                    Get started
                                </Link>
                            </div>
                        )}
                    </nav>
                </header>

                <main className="flex-1 flex items-center">
                    <div className="max-w-6xl mx-auto w-full px-6 py-16">
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                                    Simple fund management. Minimal design.
                                </h1>
                                <p className="mt-4 text-lg text-slate-600 max-w-xl">
                                    Track funds, accept payments and keep a reliable balance — all with a clean, minimal interface
                                    built for speed and clarity.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href={auth?.user ? dashboard() : register()}
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-lg shadow-sm hover:bg-amber-500"
                                    >
                                        Get started
                                    </Link>

                                    <a
                                        href="#features"
                                        className="inline-flex items-center gap-2 px-5 py-3 border rounded-lg text-slate-700 hover:bg-slate-100"
                                    >
                                        Learn more
                                    </a>
                                </div>

                                <div className="mt-8 flex gap-6 text-sm text-slate-500">
                                    <div>
                                        <div className="font-medium text-slate-900">Reliable</div>
                                        <div>ACID-safe balance updates</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">Fast</div>
                                        <div>Lightweight UI & SQLite backend</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="w-full max-w-md bg-white border border-slate-100 rounded-xl p-6 shadow-md">
                                    <div className="text-xs text-slate-500 mb-3">Preview</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-500">Account balance</div>
                                            <div className="mt-1 text-2xl font-semibold text-slate-900">N4,128.50</div>
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">+ N320</div>
                                    </div>

                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center justify-between text-sm">
                                            <div className="text-slate-700">Donation — Church</div>
                                            <div className="text-slate-900">+N200.00</div>
                                        </li>
                                        <li className="flex items-center justify-between text-sm">
                                            <div className="text-slate-700">Event costs</div>
                                            <div className="text-slate-900">-N45.00</div>
                                        </li>
                                        <li className="flex items-center justify-between text-sm">
                                            <div className="text-slate-700">Memberships</div>
                                            <div className="text-slate-900">+N165.00</div>
                                        </li>
                                    </ul>

                                    <div className="mt-6">
                                        <button className="w-full px-4 py-2 rounded-lg bg-slate-50 border text-slate-700">
                                            Open fund manager
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="features" className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Atomic</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Balance updates are atomic and idempotent.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Payments</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Integrates with Interswitch or other gateways.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Minimal</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Clean UI focused on clarity and speed.
                                </p>
                            </div>
                        </section>
                    </div>
                </main>

                <footer className="border-t border-slate-100">
                    <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500">
                        <div>© {new Date().getFullYear()} Campous — Simple fund manager</div>
                        <div className="flex gap-4 mt-3 sm:mt-0">
                            <a href="#" className="hover:underline">
                                Privacy
                            </a>
                            <a href="#" className="hover:underline">
                                Terms
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
