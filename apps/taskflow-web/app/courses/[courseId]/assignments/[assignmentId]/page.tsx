'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';

export default function StudentWorkspacePage() {
  const assignment = {
    id: 'a1',
    title: 'Assignment 1: Two Sum & Hash Maps',
    language: 'python',
    dueDate: '2026-09-15',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- Only one valid answer exists.

### Example 1:
\`\`\`text
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\``,
    starterCode: `# Solution template
def twoSum(nums: list[int], target: int) -> list[int]:
    hash_map = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in hash_map:
            return [hash_map[diff], i]
        hash_map[num] = i
    return []

# Test run
print(twoSum([2, 7, 11, 15], 9))
`,
  };

  const [code, setCode] = useState(assignment.starterCode);
  const [language, setLanguage] = useState(assignment.language);
  const [autoSaved, setAutoSaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTime, setSubmittedTime] = useState<string | null>(null);

  // Auto-save draft effect
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`draft_${assignment.id}`, code);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, assignment.id]);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setSubmittedTime(new Date().toLocaleTimeString());
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/courses/c1" className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">
            ← Back to Course
          </Link>
          <h1 className="text-base font-bold text-slate-100">{assignment.title}</h1>
          <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
            {language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Draft Auto-Save indicator */}
          <span className="text-xs text-slate-400 font-mono">
            {autoSaved ? '✓ Draft auto-saved' : 'Autosave active'}
          </span>

          {/* Submit Button */}
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Submit Assignment</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-mono">
              <span>🔒 Submitted at {submittedTime}</span>
            </div>
          )}
        </div>
      </header>

      {/* Split Workspace Main View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
        {/* Left Pane: Assignment Instructions & Markdown */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-extrabold text-slate-100">{assignment.title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
              <span>Due Date: <strong className="text-amber-400">{assignment.dueDate}</strong></span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-sm text-slate-300 space-y-4">
            <p className="whitespace-pre-line">{assignment.description}</p>
          </div>

          {isSubmitted && (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-4 space-y-1 text-emerald-300 text-xs">
              <h4 className="font-bold flex items-center gap-1">
                <span>🎉 Solution Locked & Submitted</span>
              </h4>
              <p>Your code has been recorded in the database. Your instructor can now review and grade your work.</p>
            </div>
          )}
        </div>

        {/* Right Pane: Monaco Editor */}
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
          {/* Editor Sub-Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>Editor: Monaco</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isSubmitted}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
              >
                <option value="python">python</option>
                <option value="javascript">javascript</option>
                <option value="cpp">cpp</option>
              </select>
            </div>
            <span>VS Code Dark Theme</span>
          </div>

          {/* Monaco Instance */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                readOnly: isSubmitted,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
