import React, { useState, JSX } from 'react';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, UserCircle, CheckCircle } from 'lucide-react';
import OnboardingController from '@/actions/App/Http/Controllers/OnboardingController';

const STEPS = ['Profile', 'Role', 'Done'];

const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Business', 'Economics', 'Psychology', 'English',
  'History', 'Political Science', 'Art', 'Music', 'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year', 'Graduate'];

type OnboardingForm = {
  department: string;
  year_of_study: string;
  tier: string;
};

export default function Onboarding(): JSX.Element {
  const [step, setStep] = useState(0);
  const { data, setData, post, processing, errors } = useForm<OnboardingForm>({
    department: '',
    year_of_study: '',
    tier: 'student',
  });

  function next() {
    if (step === 0 && !data.department) return;
    if (step === 1 && !data.year_of_study) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function prev() {
    if (step > 0) setStep(s => s - 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(OnboardingController.complete().url);
  }

  return (
    <AuthLayout title="Welcome to Campus" description="Let's get you set up in a few steps">
      <Head title="Onboarding" />

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              i <= step ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i <= step ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-amber-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-semibold">Tell us about yourself</h2>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Select value={data.department} onValueChange={v => setData('department', v)}>
                <SelectTrigger id="department"><SelectValue placeholder="Select your department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year_of_study">Year of Study</Label>
              <Select value={data.year_of_study} onValueChange={v => setData('year_of_study', v)}>
                <SelectTrigger id="year_of_study"><SelectValue placeholder="Select your year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.year_of_study && <p className="text-xs text-red-500">{errors.year_of_study}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-semibold">Select your access tier</h2>
            </div>
            <p className="text-xs text-gray-500">Choose the tier that best fits your role on campus.</p>

            <div className="grid gap-3">
              {[
                { value: 'student', label: 'Student', desc: 'Access to classes, activities, chat, and fund tracking' },
                { value: 'staff', label: 'Staff', desc: 'All student features plus staff-level access' },
                { value: 'admin', label: 'Admin', desc: 'Full access to all system features and management' },
              ].map(t => (
                <label
                  key={t.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    data.tier === t.value ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={t.value}
                    checked={data.tier === t.value}
                    onChange={e => setData('tier', e.target.value)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold">You're all set!</h2>
            <p className="text-sm text-gray-500">Your profile is ready. Let's head to your dashboard.</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={prev} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={processing}>
              {processing ? 'Saving…' : 'Go to Dashboard'}
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
