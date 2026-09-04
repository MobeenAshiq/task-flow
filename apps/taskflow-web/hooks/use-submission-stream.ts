'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

export function useSubmissionStream(submissionId: string) {
  const [submission, setSubmission] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    const restUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
    const socket: Socket = io(`${restUrl}/submissions`, {
      transports: ['websocket'],
    });

    socket.emit('join_submission', { submissionId });

    socket.on('submission_updated', (data: Record<string, unknown>) => {
      setSubmission(data);
    });

    return () => {
      socket.emit('leave_submission', { submissionId });
      socket.disconnect();
    };
  }, [submissionId]);

  return submission;
}
