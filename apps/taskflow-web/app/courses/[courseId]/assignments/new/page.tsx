'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('PYTHON');
  const [dueDate, setDueDate] = useState('');
  const [starterCode, setStarterCode] = useState(
    '# Write your starter code solution template below\ndef solution(nums, target):\n    # Your solution here\n    pass'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Direct redirection back to course detail
    router.push('/courses/c1');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/courses/c1" className="hover:text-indigo-400 transition-colors">
            ← Back to Course
          </Link>
          <span>/</span>
          <span className="text-slate-200">Create New Assignment</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Create New Assignment</h1>
          <p className="text-sm text-slate-400 mt-1">
            Specify assignment instructions, target runtime language, starter code, and due date.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Assignment Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Assignment 4: Binary Tree Depth & Diameter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="PYTHON">Python 3</option>
                <option value="NODEJS">JavaScript (Node.js)</option>
                <option value="TYPESCRIPT">TypeScript</option>
                <option value="CPP">C++ (g++)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Markdown Instructions & Description
            </label>
            <textarea
              rows={5}
              required
              placeholder="Write problem statement, sample inputs/outputs, constraints, and instructions in Markdown..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Starter Code Template (Optional)
            </label>
            <textarea
              rows={6}
              placeholder="Pre-filled code template provided to students when they open the Monaco workspace..."
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            <Link
              href="/courses/c1"
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              Publish Assignment 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
