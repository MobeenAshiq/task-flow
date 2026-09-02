'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';

interface AiResponseData {
  type: string;
  title: string;
  content: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

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

  // AI Tutor Modal & Panel states
  const [aiActiveTab, setAiActiveTab] = useState<'instructions' | 'ai_tutor'>('instructions');
  const [aiResponse, setAiResponse] = useState<AiResponseData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleAskSocraticHint = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResponse({
        type: 'hint',
        title: 'Socratic Tutor Hint (No Solution Code Revealed)',
        content:
          'Look closely at your dictionary lookup inside the loop. What happens on the first iteration when the dictionary is empty, and how does your index mapping update?',
      });
      setAiLoading(false);
    }, 600);
  };

  const handleExplainError = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResponse({
        type: 'explain',
        title: 'Plain-English Error Breakdown',
        content:
          'KeyError: 9. This error means your code tried to look up number 9 in the hash map before it was added as a key. Always check if the complement exists in the dictionary before accessing it.',
      });
      setAiLoading(false);
    }, 600);
  };

  const handleAnalyzeCode = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResponse({
        type: 'analyze',
        title: 'Big-O & Clean Code Analysis',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        content:
          'Great solution! Your single-pass hash table strategy achieves linear O(n) time complexity and O(n) space complexity. Variable naming is clean and follows Python PEP-8 conventions.',
      });
      setAiLoading(false);
    }, 600);
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
        {/* Left Pane: Instructions & Socratic AI Tutor */}
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Left Pane Navigation Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiActiveTab('instructions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  aiActiveTab === 'instructions'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Problem Instructions
              </button>
              <button
                onClick={() => setAiActiveTab('ai_tutor')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  aiActiveTab === 'ai_tutor'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 border border-indigo-900/60'
                }`}
              >
                <span>Socratic AI Tutor 🤖</span>
              </button>
            </div>

            <span className="text-[10px] text-indigo-400 font-mono">No-Code Policy Enforced</span>
          </div>

          {/* Left Pane Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {aiActiveTab === 'instructions' ? (
              <>
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
              </>
            ) : (
              /* Socratic AI Tutor Tab */
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                    <span>🤖 Socratic Virtual TA</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Get guided debugging hints, plain-English error breakdowns, and Big-O complexity checks without giving away answers.
                  </p>
                </div>

                {/* AI Action Trigger Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleAskSocraticHint}
                    className="p-3 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/80 rounded-xl text-left space-y-1 transition-all group"
                  >
                    <div className="text-xs font-bold text-indigo-300 group-hover:text-white flex items-center gap-1">
                      <span>💡 Socratic Hint</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Guiding questions without solution code.</p>
                  </button>

                  <button
                    onClick={handleExplainError}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition-all group"
                  >
                    <div className="text-xs font-bold text-purple-300 group-hover:text-white flex items-center gap-1">
                      <span>🧩 Explain Error</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Plain-English compiler stack trace breakdown.</p>
                  </button>

                  <button
                    onClick={handleAnalyzeCode}
                    className="p-3 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 rounded-xl text-left space-y-1 transition-all group"
                  >
                    <div className="text-xs font-bold text-cyan-300 group-hover:text-white flex items-center gap-1">
                      <span>⚡ Big-O Check</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Time & space complexity analysis.</p>
                  </button>
                </div>

                {/* AI Response Display Card */}
                {aiLoading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-indigo-400 font-mono animate-pulse">
                    🤖 Socratic AI Tutor is thinking...
                  </div>
                ) : (
                  aiResponse && (
                    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 space-y-3 shadow-xl backdrop-blur">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                          {aiResponse.title}
                        </h4>
                        {aiResponse.timeComplexity && (
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                              Time: {aiResponse.timeComplexity}
                            </span>
                            <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                              Space: {aiResponse.spaceComplexity}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{aiResponse.content}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
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
