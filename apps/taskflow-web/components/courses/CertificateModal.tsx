'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Award, CheckCircle2, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import { formatDateOnly } from '@/lib/status';

export function CertificateModal({
  open,
  onClose,
  studentName,
  courseTitle,
  teacherName,
  completionDate,
}: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  teacherName?: string;
  completionDate?: string;
}) {
  const certId = `TF-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const dateStr = formatDateOnly(completionDate || new Date().toISOString());

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title="Course Certificate" widthClassName="max-w-2xl">
      <div className="space-y-6">
        {/* Certificate Card Container */}
        <div
          id="certificate-print-area"
          className="relative overflow-hidden rounded-2xl border-4 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-2xl text-fg"
        >
          {/* Background Decorative Graphic Seals */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 size-44 rounded-full bg-indigo-500/10 blur-2xl" />

          {/* Border Frame */}
          <div className="relative rounded-xl border border-amber-500/40 p-6 space-y-5">
            {/* Certificate Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-14 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/20 text-amber-400 shadow-md">
                <Award className="size-8" />
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
                TaskFlow Academy • Verified Credential
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-fg tracking-tight">
                Certificate of Completion
              </h2>
            </div>

            {/* Recipient Notice */}
            <div className="space-y-1 py-2">
              <p className="text-xs text-fg-muted uppercase tracking-wider">This is to certify that</p>
              <h3 className="text-xl md:text-2xl font-black text-amber-300 underline decoration-amber-500/40 underline-offset-4">
                {studentName || 'Student Learner'}
              </h3>
            </div>

            {/* Course Details */}
            <p className="mx-auto max-w-lg text-xs md:text-sm text-fg-muted leading-relaxed">
              has successfully completed all required coursework, live code execution challenges, and assignments for the course:
            </p>

            <div className="inline-block rounded-xl border border-accent/30 bg-accent/10 px-5 py-2 text-base font-extrabold text-accent">
              {courseTitle}
            </div>

            {/* Verification Footer */}
            <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-5 text-left text-xs">
              <div>
                <span className="block text-[10px] text-fg-subtle uppercase">Authorized Instructor</span>
                <span className="font-semibold text-fg">{teacherName || 'TaskFlow Engineering Faculty'}</span>
                <span className="block text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="size-3" /> Verified Signature
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-fg-subtle uppercase">Date Issued</span>
                <span className="font-mono font-semibold text-fg">{dateStr}</span>
                <span className="block font-mono text-[10px] text-fg-subtle mt-0.5">ID: {certId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-fg-subtle flex items-center gap-1">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Verified &amp; Shareable Certificate
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
              <Printer className="size-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
