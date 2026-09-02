import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { ExecutionLanguage, TestResult, SubmissionStatus } from '@taskflow/shared';

export interface ExecutionOptions {
  code: string;
  language: ExecutionLanguage;
  testCases: Array<{ id: string; input: string; expectedOutput: string }>;
  timeLimitMs: number;
  memoryLimitMb: number;
}

@Injectable()
export class SandboxRunnerService {
  private readonly logger = new Logger(SandboxRunnerService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp_submissions');

  async executeCode(options: ExecutionOptions): Promise<{
    status: SubmissionStatus;
    score: number;
    testResults: TestResult[];
    executionLogs: string;
  }> {
    const runId = crypto.randomUUID();
    const workDir = path.join(this.tempDir, runId);
    await fs.mkdir(workDir, { recursive: true });

    const codeFilePath = this.getFilePath(workDir, options.language);
    await fs.writeFile(codeFilePath, options.code);

    const testResults: TestResult[] = [];
    let passedCount = 0;
    let globalLogs = '';

    try {
      for (const tc of options.testCases || []) {
        const inputFilePath = path.join(workDir, `input_${tc.id}.txt`);
        await fs.writeFile(inputFilePath, tc.input || '');

        const runCmd = this.getDockerCommand(
          workDir,
          options.language,
          path.basename(codeFilePath),
          path.basename(inputFilePath),
          options.timeLimitMs,
          options.memoryLimitMb,
        );

        const startTime = Date.now();
        const { stdout, stderr, isTimeout } = await this.execWithTimeout(
          runCmd,
          options.timeLimitMs + 1000,
        );
        const executionTimeMs = Date.now() - startTime;

        if (isTimeout) {
          testResults.push({
            testCaseId: tc.id,
            passed: false,
            error: 'Time Limit Exceeded',
            executionTimeMs,
          });
          continue;
        }

        const actualOutput = stdout.trim();
        const expectedOutput = (tc.expectedOutput || '').trim();
        const passed = actualOutput === expectedOutput;

        if (passed) passedCount++;

        testResults.push({
          testCaseId: tc.id,
          passed,
          actualOutput,
          expectedOutput,
          executionTimeMs,
          error: stderr ? stderr.trim() : undefined,
        });

        if (stderr) globalLogs += `[TC ${tc.id} Stderr]: ${stderr}\n`;
      }
    } finally {
      // Clean up isolated directory
      await fs.rm(workDir, { recursive: true, force: true }).catch((err) =>
        this.logger.error(`Failed to clean temp directory: ${workDir}`, err),
      );
    }

    const total = options.testCases?.length || 1;
    const score = Math.round((passedCount / total) * 100);
    const status =
      passedCount === total ? SubmissionStatus.PASSED : SubmissionStatus.FAILED;

    return { status, score, testResults, executionLogs: globalLogs };
  }

  private getFilePath(dir: string, language: ExecutionLanguage): string {
    switch (language) {
      case ExecutionLanguage.PYTHON:
        return path.join(dir, 'solution.py');
      case ExecutionLanguage.JAVASCRIPT:
      case ExecutionLanguage.TYPESCRIPT:
      case ExecutionLanguage.NODEJS:
        return path.join(dir, 'solution.js');
      case ExecutionLanguage.CPP:
        return path.join(dir, 'solution.cpp');
      default:
        return path.join(dir, 'solution.js');
    }
  }

  private getDockerCommand(
    workDir: string,
    language: ExecutionLanguage,
    codeFileName: string,
    inputFileName: string,
    timeLimitMs: number,
    memoryLimitMb: number,
  ): string {
    const runScript =
      language === ExecutionLanguage.PYTHON
        ? `python3 /sandbox/${codeFileName} < /sandbox/${inputFileName}`
        : `node /sandbox/${codeFileName} < /sandbox/${inputFileName}`;

    // Security Constraints:
    // --network none         : No outbound internet access
    // --memory & --memory-swap: Strict RAM quota
    // --cpus 0.5             : Restrict CPU consumption
    // --read-only            : Prevent filesystem tampering
    // --user 1000:1000       : Unprivileged container user
    return `docker run --rm \
      --network none \
      --memory="${memoryLimitMb}m" \
      --memory-swap="${memoryLimitMb}m" \
      --cpus="0.5" \
      --volume="${workDir}:/sandbox:ro" \
      --user 1000:1000 \
      node:20-alpine \
      sh -c "timeout ${Math.ceil(timeLimitMs / 1000)}s ${runScript}"`;
  }

  private execWithTimeout(
    cmd: string,
    timeoutMs: number,
  ): Promise<{ stdout: string; stderr: string; isTimeout: boolean }> {
    return new Promise((resolve) => {
      exec(cmd, { timeout: timeoutMs }, (error, stdout, stderr) => {
        const isTimeout: boolean = Boolean(error && error.killed);
        resolve({ stdout: stdout || '', stderr: stderr || '', isTimeout });
      });
    });
  }
}
