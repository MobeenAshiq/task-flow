import { ExecutionLanguage } from '@taskflow/shared';

type LanguageFamily = 'python' | 'cpp' | 'c-style';

const FAMILY_LABEL: Record<LanguageFamily, string> = {
  python: 'Python',
  cpp: 'C++',
  'c-style': 'JavaScript/TypeScript',
};

const LANGUAGE_FAMILY: Record<ExecutionLanguage, LanguageFamily> = {
  [ExecutionLanguage.PYTHON]: 'python',
  [ExecutionLanguage.CPP]: 'cpp',
  [ExecutionLanguage.JAVASCRIPT]: 'c-style',
  [ExecutionLanguage.TYPESCRIPT]: 'c-style',
  [ExecutionLanguage.NODEJS]: 'c-style',
};

const LANGUAGE_LABEL: Record<ExecutionLanguage, string> = {
  [ExecutionLanguage.PYTHON]: 'Python',
  [ExecutionLanguage.CPP]: 'C++',
  [ExecutionLanguage.JAVASCRIPT]: 'JavaScript',
  [ExecutionLanguage.TYPESCRIPT]: 'TypeScript',
  [ExecutionLanguage.NODEJS]: 'Node.js',
};

// Only trips on strong, unambiguous cross-family markers — this is a best-effort
// sanity check, not a real parser, so it stays quiet on anything inconclusive.
function detectFamily(code: string): LanguageFamily | null {
  if (/^\s*def\s+\w+\s*\(.*\)\s*:/m.test(code) || /^\s*elif\b/m.test(code) || /^\s*print\(.*\)\s*$/m.test(code)) {
    return 'python';
  }
  if (/#include\s*<[^>]+>/.test(code) || /\bstd::/.test(code) || /\bint\s+main\s*\(/.test(code)) {
    return 'cpp';
  }
  if (/\bconsole\.log\s*\(/.test(code) || /=>\s*\{/.test(code) || /\bfunction\s*\w*\s*\(/.test(code)) {
    return 'c-style';
  }
  return null;
}

export function detectLanguageMismatch(code: string, language: ExecutionLanguage): string | null {
  const trimmed = code.trim();
  if (trimmed.length < 20) return null; // too short to judge reliably

  const detected = detectFamily(trimmed);
  if (!detected) return null; // inconclusive — don't block

  const expected = LANGUAGE_FAMILY[language];
  if (detected !== expected) {
    return `This looks like ${FAMILY_LABEL[detected]} code, but you selected ${LANGUAGE_LABEL[language]}. Please submit code written in ${LANGUAGE_LABEL[language]}.`;
  }
  return null;
}
