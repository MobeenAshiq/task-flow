'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  language: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  score?: number;
}

export default function CourseDetailPage() {
  const course = {
    id: 'c1',
    title: 'CS 101: Data Structures & Algorithms',
    description: 'Master binary trees, graphs, dynamic programming, and sorting algorithms in Python & C++.',
    joinCode: 'DS101X',
    teacherName: 'Prof. Alan Turing',
    roster: [
      { id: 's1', name: 'Alice Smith', email: 'alice@student.dev' },
      { id: 's2', name: 'Bob Johnson', email: 'bob@student.dev' },
      { id: 's3', name: 'Charlie Lee', email: 'charlie@student.dev' },
    ],
  };

  const [assignments] = useState<Assignment[]>([
    {
      id: 'a1',
      title: 'Assignment 1: Two Sum & Hash Maps',
      description: 'Implement a function that finds two numbers in an array that sum up to a target value in O(n) time complexity.',
      language: 'PYTHON',
      dueDate: '2026-09-15',
      status: 'Pending',
    },
    {
      id: 'a2',
      title: 'Assignment 2: Binary Search Tree Inorder Traversal',
      description: 'Write a recursive or iterative function to return the inorder traversal of a binary search tree.',
      language: 'CPP',
      dueDate: '2026-09-20',
      status: 'Submitted',
    },
    {
      id: 'a3',
      title: 'Assignment 3: LRU Cache Implementation',
      description: 'Design a Least Recently Used (LRU) cache supporting get and put in O(1) time complexity.',
      language: 'NODEJS',
      dueDate: '2026-09-28',
      status: 'Graded',
      score: 95,
    },
  ]);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(course.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/courses" className="hover:text-indigo-400 transition-colors">
            ← Back to Courses
          </Link>
          <span>/</span>
          <span className="text-slate-200">{course.title}</span>
        </div>

        {/* Course Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-100">{course.title}</h1>
              <p className="text-slate-400 max-w-2xl text-sm">{course.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                <span>Instructor: <strong className="text-slate-200">{course.teacherName}</strong></span>
                <span>•</span>
                <span>Roster: <strong className="text-slate-200">{course.roster.length} Enrolled Students</strong></span>
              </div>
            </div>

            {/* Join Code Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Course Join Code
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 text-2xl font-mono font-black text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>{course.joinCode}</span>
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {copied && <span className="text-[10px] text-emerald-400 font-semibold">✓ Copied!</span>}
            </div>
          </div>
        </div>

        {/* Section Header & Create Action */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>📚 Course Assignments</span>
            <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
              {assignments.length}
            </span>
          </h2>

          <Link
            href={`/courses/${course.id}/assignments/new`}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Assignment
          </Link>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-100">{assignment.title}</h3>

                  {/* Status Badge */}
                  {assignment.status === 'Pending' && (
                    <span className="bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ⏳ Pending Submission
                    </span>
                  )}
                  {assignment.status === 'Submitted' && (
                    <span className="bg-blue-950/80 text-blue-300 border border-blue-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ✓ Submitted (Awaiting Grade)
                    </span>
                  )}
                  {assignment.status === 'Graded' && (
                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ★ Graded: {assignment.score}/100
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-400">{assignment.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Language: <strong className="text-indigo-400">{assignment.language}</strong></span>
                  <span>•</span>
                  <span>Due Date: <strong className="text-slate-300">{assignment.dueDate}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 md:pt-0">
                <Link
                  href={`/courses/${course.id}/assignments/${assignment.id}`}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                >
                  Open Monaco Workspace 💻
                </Link>

                <Link
                  href={`/courses/${course.id}/assignments/${assignment.id}/submissions`}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                >
                  Teacher Grading Dashboard 📊
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
