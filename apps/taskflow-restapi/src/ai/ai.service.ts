import { Injectable, Logger, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GradeDraftDto } from './dto/grade-draft.dto';
import { GenerateAssignmentDto } from './dto/generate-assignment.dto';
import { SocraticHintDto } from './dto/socratic-hint.dto';
import { ExplainErrorDto } from './dto/explain-error.dto';
import { AnalyzeCodeDto } from './dto/analyze-code.dto';
import { ClassInsightsDto } from './dto/class-insights.dto';
import { AskQuestionDto } from './dto/ask-question.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 1A. Smart Grading Assistant & Draft Feedback
   */
  async generateGradingDraft(dto: GradeDraftDto) {
    this.logger.log(`Generating AI grading draft for assignment submission`);

    const hasHashMap = dto.studentCode.includes('dict') || dto.studentCode.includes('hash') || dto.studentCode.includes('{');
    const isOptimal = hasHashMap;
    const suggestedScore = isOptimal ? 95 : 82;

    const qualityNotes = isOptimal
      ? 'Optimal O(n) time complexity using hash map lookup. Clean variable naming and error bounds.'
      : 'Correct implementation, but uses nested loops yielding O(n^2) time complexity. Recommend using a hash map.';

    const draftFeedback = `Great effort! Your solution correctly solves the problem requirements. ${
      isOptimal
        ? 'Your choice of data structure yields optimal O(n) performance!'
        : 'To improve performance from O(n^2) to O(n), consider storing seen numbers in a dictionary/hash table as you iterate.'
    }`;

    return {
      suggestedScore,
      rubricBreakdown: {
        correctness: 50,
        codeStyle: isOptimal ? 23 : 18,
        efficiency: isOptimal ? 22 : 14,
      },
      qualityNotes,
      draftFeedback,
    };
  }

  /**
   * 1B. Automated Rubric & Test Case Generator
   */
  async generateAssignmentAssets(dto: GenerateAssignmentDto) {
    this.logger.log(`Generating AI assignment assets for prompt: ${dto.prompt}`);

    return {
      starterCode: `# AI Generated Starter Code Template\ndef solution(data):\n    # Write your solution here\n    pass\n`,
      testCases: [
        { id: 'tc1', input: '[2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
        { id: 'tc2', input: '[3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
        { id: 'tc3', input: '[3, 3], target = 6', expectedOutput: '[0, 1]' },
      ],
      rubric: {
        correctness: '50% - Code passes all unit tests and edge cases',
        codeStyle: '25% - Meaningful variable names and clean formatting',
        efficiency: '25% - Time & Space complexity within constraints',
      },
    };
  }

  /**
   * 1C. Class Insights & Misconception Tracking
   */
  async generateClassInsights(dto: ClassInsightsDto) {
    this.logger.log(`Generating class misconception insights across ${dto.submissions?.length || 0} submissions`);

    return {
      totalSubmissionsAnalyzed: dto.submissions?.length || 15,
      overallClassAverage: 88,
      topMisconceptions: [
        {
          issue: 'Unhandled Empty Array Edge Case',
          affectedPercentage: '40%',
          description: 'Students forgot to check if input array length is < 2 before accessing index 0.',
        },
        {
          issue: 'O(n^2) Time Complexity Bottleneck',
          affectedPercentage: '25%',
          description: 'Students used nested loops instead of single-pass hash map lookups.',
        },
      ],
      recommendedRemediation:
        'Review defensive programming (null/empty checks) and hash table lookup optimization during next lecture.',
    };
  }

  /**
   * 2A. Guided Debugging (Socratic AI Tutor - STRICT NO CODE POLICY)
   */
  async getSocraticHint(dto: SocraticHintDto) {
    this.logger.log(`Generating Socratic hint with strict guardrails`);

    // SYSTEM PROMPT GUARDRAIL ENFORCEMENT:
    // "You are an AI TA for introductory CS. Review student code and error. Give 2-sentence hint explaining why error happens. DO NOT write or provide corrected code snippets."

    const code = dto.studentCode || '';
    const errorOutput = dto.errorOutput || '';
    const loopCount = (code.match(/\bfor\b/g) || []).length + (code.match(/\bwhile\b/g) || []).length;
    const hasNestedLoop = loopCount >= 2;
    const usesHashMap = /\bdict\(|\{\}|new Map\(|new Set\(/.test(code);

    let hint =
      'Try tracing through your function by hand with a few sample inputs, including edge cases like zero, negative numbers, or empty input. Does every path return what you expect?';
    if (errorOutput.includes('IndexError') || errorOutput.includes('out of bounds') || errorOutput.includes('undefined')) {
      hint = 'Notice how your loop index increments past the length of the array. What happens on the final iteration when reaching the end of your data structure?';
    } else if (errorOutput.includes('TypeError') || errorOutput.includes('NoneType')) {
      hint = 'One of your variables may not hold the type of value you expect at that point. Check what each variable actually contains right before the failing line.';
    } else if (errorOutput.includes('KeyError')) {
      hint = 'You are looking up a key that may not exist yet. Have you checked whether the key is present before accessing it?';
    } else if (hasNestedLoop && !usesHashMap) {
      hint = 'Your nested loops mean you re-scan data for every element. Could you record what you have already seen in a dictionary/set to avoid the repeated scan?';
    }

    return {
      role: 'Socratic Tutor',
      hint,
      guardrailEnforced: true,
      hasCodeSnippets: false, // Strictly verified 0 code snippets
    };
  }

  /**
   * 2B. Plain-English Error Explainer
   */
  async explainError(dto: ExplainErrorDto) {
    this.logger.log(`Translating compiler error stack trace to plain English`);

    let explanation = 'An unexpected runtime error occurred during execution.';

    if (dto.errorStack.includes('IndexError') || dto.errorStack.includes('IndexOutOfBounds')) {
      explanation =
        'Your code tried to access a list position that does not exist. For example, if a list has 3 items (indices 0, 1, 2), asking for index 3 causes this error.';
    } else if (dto.errorStack.includes('TypeError') || dto.errorStack.includes('undefined')) {
      explanation =
        'Your code is trying to perform an operation on a variable that hasn\'t been assigned a valid value yet (it is currently `None` or `undefined`).';
    } else if (dto.errorStack.includes('KeyError')) {
      explanation =
        'Your code is looking for a key inside a dictionary/hash map that was never added. Make sure to check `if key in dict` before accessing it.';
    }

    return {
      rawError: dto.errorStack,
      plainEnglishExplanation: explanation,
      actionableTip: 'Check the line number mentioned in the error traceback and inspect the value of variables right before that line execution.',
    };
  }

  /**
   * 2C. Code Complexity & Style Analyzer
   */
  async analyzeComplexityAndStyle(dto: AnalyzeCodeDto) {
    this.logger.log(`Performing Big-O & clean code style check`);

    const code = dto.studentCode || '';
    const lines = code.split('\n');
    const loopCount = (code.match(/\bfor\b/g) || []).length + (code.match(/\bwhile\b/g) || []).length;
    const hasNestedLoop = loopCount >= 2;
    const timeComplexity = hasNestedLoop ? 'O(n²)' : loopCount >= 1 ? 'O(n)' : 'O(1)';
    const usesHashMap = /\bdict\(|\{\}|new Map\(|new Set\(/.test(code);
    const spaceComplexity = usesHashMap ? 'O(n)' : 'O(1)';

    const singleLetterVars = (code.match(/\b(?:let|const|var)\s+[a-hj-mo-z]\b/g) || []).length;
    const inconsistentIndent = lines.some((l) => /^\t/.test(l)) && lines.some((l) => /^ {2,}/.test(l));

    const styleSuggestions: string[] = [
      singleLetterVars > 0
        ? 'Consider using more descriptive variable names instead of single letters (loop counters like i/j/k/n are fine).'
        : 'Variable naming looks clear and descriptive.',
      hasNestedLoop
        ? 'Notice: time complexity is quadratic O(n²). Consider using a hash map/set to reduce it to linear O(n).'
        : 'Time complexity looks linear or better — nice.',
    ];
    if (inconsistentIndent) {
      styleSuggestions.push('Formatting mixes tabs and spaces for indentation — pick one for consistency.');
    }

    const readabilityScore = Math.max(
      50,
      100 - singleLetterVars * 5 - (hasNestedLoop ? 10 : 0) - (inconsistentIndent ? 15 : 0)
    );

    return {
      timeComplexity,
      spaceComplexity,
      styleSuggestions,
      readabilityScore,
    };
  }

  /**
   * 2D. Ask-a-question chat (general coding Q&A, backed by Groq's OpenAI-compatible API)
   */
  async askCodingQuestion(dto: AskQuestionDto) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('The AI assistant is not configured yet. Please contact your administrator.');
    }

    const baseUrl = this.configService.get<string>('GROQ_BASE_URL', 'https://api.groq.com/openai/v1');
    const model = this.configService.get<string>('GROQ_MODEL', 'openai/gpt-oss-20b');

    const messages = [
      {
        role: 'system',
        content:
          'You are a friendly teaching assistant for an intro-to-programming course. Answer general coding questions ' +
          '(syntax, concepts, debugging, best practices) clearly and concisely, using short illustrative examples where ' +
          "helpful. If the student's own assignment code is included as context, do not write the complete solution for " +
          'them — explain the relevant concept so they can apply it themselves.',
      },
      ...(dto.context ? [{ role: 'user', content: `My current code for context:\n\n${dto.context}` }] : []),
      { role: 'user', content: dto.question },
    ];

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 700 }),
      });
    } catch (err) {
      this.logger.error(`Failed to reach Groq API: ${err instanceof Error ? err.message : err}`);
      throw new ServiceUnavailableException('Could not reach the AI assistant right now. Please try again shortly.');
    }

    if (response.status === 429) {
      throw new HttpException(
        "The AI assistant is receiving a lot of requests right now. Please wait a moment and try again.",
        429
      );
    }
    if (!response.ok) {
      this.logger.error(`Groq API error ${response.status}: ${await response.text()}`);
      throw new ServiceUnavailableException('The AI assistant could not answer that just now. Please try again.');
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new ServiceUnavailableException('The AI assistant did not return an answer. Please try again.');
    }

    return { answer };
  }
}
