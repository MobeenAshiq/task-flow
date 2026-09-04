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

  async runLive(options: {
    code: string;
    language: ExecutionLanguage;
    testCases?: Array<{ id: string; input: string; expectedOutput: string }>;
    timeLimitMs?: number;
  }): Promise<{
    status: SubmissionStatus;
    score: number;
    stdout: string;
    stderr: string;
    executionTimeMs: number;
    testResults: TestResult[];
    executionLogs: string;
  }> {
    const runId = crypto.randomUUID();
    const workDir = path.join(this.tempDir, runId);
    await fs.mkdir(workDir, { recursive: true });

    const codeFilePath = this.getFilePath(workDir, options.language);
    await fs.writeFile(codeFilePath, options.code);

    const timeLimit = options.timeLimitMs || 3000;
    let stdout = '';
    let stderr = '';
    let executionTimeMs = 0;
    const testResults: TestResult[] = [];
    let passedCount = 0;

    const startTime = Date.now();

    try {
      if (
        options.language === ExecutionLanguage.PYTHON
      ) {
        const cmd = `python3 "${codeFilePath}"`;
        const res = await this.execWithTimeout(cmd, timeLimit);
        stdout = res.stdout;
        stderr = res.stderr;
        if (res.isTimeout) stderr += '\n[Error]: Execution Timed Out';
      } else if (
        options.language === ExecutionLanguage.CPP
      ) {
        const binPath = path.join(workDir, 'solution.out');
        const compileRes = await this.execWithTimeout(`g++ "${codeFilePath}" -o "${binPath}"`, 5000);
        if (compileRes.stderr && !compileRes.stdout) {
          stderr = compileRes.stderr;
        } else {
          const res = await this.execWithTimeout(`"${binPath}"`, timeLimit);
          stdout = res.stdout;
          stderr = res.stderr;
        }
      } else {
        // Node.js / JavaScript / TypeScript default runner
        const cmd = `node "${codeFilePath}"`;
        const res = await this.execWithTimeout(cmd, timeLimit);
        stdout = res.stdout;
        stderr = res.stderr;
        if (res.isTimeout) stderr += '\n[Error]: Execution Timed Out';
      }

      executionTimeMs = Date.now() - startTime;

      // Evaluate against test cases if available
      const tcs = options.testCases || [];
      if (tcs.length > 0) {
        for (const tc of tcs) {
          const actualOutput = stdout.trim();
          const expectedOutput = (tc.expectedOutput || '').trim();
          const passed = actualOutput.includes(expectedOutput) || actualOutput === expectedOutput;
          if (passed) passedCount++;
          testResults.push({
            testCaseId: tc.id,
            passed,
            actualOutput,
            expectedOutput,
            executionTimeMs,
            error: stderr || undefined,
          });
        }
      } else {
        // If no explicit test cases, pass if no severe error
        passedCount = stderr ? 0 : 1;
        testResults.push({
          testCaseId: 'default',
          passed: !stderr,
          actualOutput: stdout,
          expectedOutput: stdout,
          executionTimeMs,
          error: stderr || undefined,
        });
      }
    } catch (err: any) {
      stderr += `\nRuntime error: ${err?.message || err}`;
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }

    const total = options.testCases?.length || 1;
    const score = Math.round((passedCount / total) * 100);
    const status = score === 100 ? SubmissionStatus.PASSED : SubmissionStatus.FAILED;

    const executionLogs = `[Console Standard Output]\n${stdout || '(No printed output)'}\n\n[Console Errors / Stderr]\n${
      stderr || 'None'
    }`;

    return {
      status,
      score,
      stdout: stdout || '(No printed output)',
      stderr: stderr || '',
      executionTimeMs,
      testResults,
      executionLogs,
    };
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

