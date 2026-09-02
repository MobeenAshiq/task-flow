'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StudentSubmission {
  id: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  isLate: boolean;
  code: string;
  grade?: number;
  feedback?: string;
  status: 'Pending' | 'Graded';
}

export default function TeacherGradingDashboardPage() {
  const assignment = {
    id: 'a1',
    title: 'Assignment 1: Two Sum & Hash Maps',
    language: 'python',
    dueDate: '2026-09-15',
  };

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 'sub_1',
      studentName: 'Alice Smith',
      studentEmail: 'alice@student.dev',
      submittedAt: '2026-09-14 14:32',
      isLate: false,
      code: `def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []`,
      grade: 95,
      feedback: 'Excellent optimal O(n) solution using hash map!',
      status: 'Graded',
    },
    {
      id: 'sub_2',
      studentName: 'Bob Johnson',
      studentEmail: 'bob@student.dev',
      submittedAt: '2026-09-16 09:15',
      isLate: true,
      code: `def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]`,
      status: 'Pending',
    },
  ]);

  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [inputGrade, setInputGrade] = useState<number>(0);
  const [inputFeedback, setInputFeedback] = useState<string>('');

  const handleOpenGrade = (sub: StudentSubmission) => {
    setSelectedSubmission(sub);
    setInputGrade(sub.grade || 85);
    setInputFeedback(sub.feedback || '');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === selectedSubmission.id
          ? { ...s, grade: inputGrade, feedback: inputFeedback, status: 'Graded' }
          : s
      )
    );

    setSelectedSubmission(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/courses/c1" className="hover:text-indigo-400 transition-colors">
            ← Back to Course
          </Link>
          <span>/</span>
          <span className="text-slate-200">Teacher Review & Grading Dashboard</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">{assignment.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Review student code submissions, verify submission timestamps, and provide grades & feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-lg font-mono">
              Total Submissions: {submissions.length}
            </span>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Timing Status</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">
                      <div>{sub.studentName}</div>
                      <div className="text-xs text-slate-500 font-normal">{sub.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{sub.submittedAt}</td>
                    <td className="px-6 py-4">
                      {sub.isLate ? (
                        <span className="bg-red-950/80 text-red-400 border border-red-800/80 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          ⏰ Late Submission
                        </span>
                      ) : (
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          ✓ On Time
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {sub.status === 'Graded' ? (
                        <span className="text-emerald-400">{sub.grade} / 100</span>
                      ) : (
                        <span className="text-amber-400 text-xs font-normal">Not Graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenGrade(sub)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                      >
                        {sub.status === 'Graded' ? 'Edit Grade' : 'Review & Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Split Screen Grading Modal / Drawer */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Modal Top Bar */}
              <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Grading Code: <span className="text-indigo-400">{selectedSubmission.studentName}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Submitted: {selectedSubmission.submittedAt} {selectedSubmission.isLate && '(Late)'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Split Content Body */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
                {/* Code Viewer (2 Columns) */}
                <div className="lg:col-span-2 p-6 overflow-y-auto bg-slate-950 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Submitted Code ({assignment.language.toUpperCase()})
                  </h3>
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-indigo-300 overflow-x-auto">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>

                {/* Grading Controls (1 Column) */}
                <form onSubmit={handleSaveGrade} className="p-6 bg-slate-900 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
                      Score & Feedback
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Numerical Grade (0 - 100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={inputGrade}
                        onChange={(e) => setInputGrade(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Teacher Feedback
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Provide detailed feedback on algorithm complexity, code style, and correctness..."
                        value={inputFeedback}
                        onChange={(e) => setInputFeedback(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                      Save Grade & Feedback
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
