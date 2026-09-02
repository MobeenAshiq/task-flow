'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  joinCode: string;
  studentCount?: number;
  assignmentCount?: number;
  teacherName?: string;
}

export default function CoursesPage() {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'c1',
      title: 'CS 101: Data Structures & Algorithms',
      description: 'Master binary trees, graphs, dynamic programming, and sorting algorithms in Python & C++.',
      joinCode: 'DS101X',
      studentCount: 28,
      assignmentCount: 5,
      teacherName: 'Prof. Alan Turing',
    },
    {
      id: 'c2',
      title: 'CS 202: Full-Stack Web Development',
      description: 'Build modern responsive web applications using React, Next.js, Node.js, and PostgreSQL.',
      joinCode: 'WEB202',
      studentCount: 42,
      assignmentCount: 8,
      teacherName: 'Prof. Grace Hopper',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Generate random 6-character uppercase code
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCourse: Course = {
      id: `c_${Date.now()}`,
      title: newTitle,
      description: newDescription || 'No description provided.',
      joinCode: randomCode,
      studentCount: 0,
      assignmentCount: 0,
    };

    setCourses([newCourse, ...courses]);
    setNewTitle('');
    setNewDescription('');
    setShowCreateModal(false);
  };

  const handleJoinCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    const joinedCourse: Course = {
      id: `c_joined_${Date.now()}`,
      title: `Joined Course (${joinCodeInput.toUpperCase()})`,
      description: 'Enrolled via 6-digit Join Code.',
      joinCode: joinCodeInput.toUpperCase(),
      studentCount: 15,
      assignmentCount: 3,
      teacherName: 'Instructor',
    };

    setCourses([joinedCourse, ...courses]);
    setJoinCodeInput('');
    setShowJoinModal(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Classroom & Course Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Manage classrooms, enroll with 6-digit join codes, and create assignments.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center">
              <button
                onClick={() => setRole('TEACHER')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  role === 'TEACHER'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Teacher Mode
              </button>
              <button
                onClick={() => setRole('STUDENT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  role === 'STUDENT'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Mode
              </button>
            </div>

            {role === 'TEACHER' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Course
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Join Course with Code
              </button>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl hover:shadow-indigo-500/5 backdrop-blur"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  {/* Join Code Badge */}
                  <button
                    onClick={() => handleCopyCode(course.joinCode)}
                    title="Click to copy Join Code"
                    className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-indigo-900/80 transition-colors"
                  >
                    <span>{course.joinCode}</span>
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2">{course.description}</p>

                {copiedCode === course.joinCode && (
                  <p className="text-xs text-emerald-400 font-medium">✓ Join code copied to clipboard!</p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    👥 {course.studentCount} Students
                  </span>
                  <span className="flex items-center gap-1">
                    📚 {course.assignmentCount} Assignments
                  </span>
                </div>

                <Link
                  href={`/courses/${course.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-white bg-indigo-950/60 hover:bg-indigo-600 rounded-md border border-indigo-800/60 hover:border-indigo-500 transition-all"
                >
                  View Course →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Create New Course</h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS 301: Algorithms & Data Structures"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief course overview and curriculum goals..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <p className="text-xs text-indigo-400 bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/60">
                  ℹ️ A unique 6-digit Join Code will be automatically generated for your students to enroll.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Course Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Join Course with Code</h2>
              <form onSubmit={handleJoinCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    6-Digit Join Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. DS101X"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest text-cyan-400 uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                  >
                    Join Classroom
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
