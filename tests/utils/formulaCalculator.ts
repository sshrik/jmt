// 테스트용 수식 계산기

export interface FormulaResult {
  value: number;
  isValid: boolean;
  error?: string;
}

/**
 * 테스트용 간단한 수식 계산기
 * 실제 프로덕션 코드의 formulaCalculator.ts와 동일한 결과를 제공
 */
export function calculateFormula(formula: string, N: number): number {
  if (!formula) return 0;

  try {
    // 미리 정의된 수식 패턴들 처리
    switch (formula) {
      case "10000 * N + 2000":
        return 10000 * N + 2000;
      case "2 * N":
        return 2 * N;
      case "abs(N) * 1000":
        return Math.abs(N) * 1000;
      case "abs(N) * 0.5":
        return Math.abs(N) * 0.5;
      case "abs(N)":
        return Math.abs(N);
      case "N * 0.5":
        return N * 0.5;
      case "N / 2":
        return N / 2;
      case "100 - abs(N)":
        return 100 - Math.abs(N);
      default:
        return 0;
    }
  } catch (_error) {
    return 0;
  }
}

/**
 * 수식 유효성 검증
 */
export function validateFormula(formula: string): {
  isValid: boolean;
  error?: string;
} {
  if (!formula || formula.trim() === "") {
    return { isValid: false, error: "수식이 비어있습니다" };
  }

  // 테스트에서 지원하는 수식인지 확인
  const supportedFormulas = [
    "10000 * N + 2000",
    "2 * N",
    "abs(N) * 1000",
    "abs(N) * 0.5",
    "abs(N)",
    "N * 0.5",
    "N / 2",
    "100 - abs(N)",
  ];

  if (supportedFormulas.includes(formula)) {
    return { isValid: true };
  }

  return { isValid: false, error: `지원하지 않는 수식입니다: ${formula}` };
}

/**
 * 수식 테스트 예시들
 */
export const FORMULA_EXAMPLES = [
  {
    formula: "10000 * N + 2000",
    description: "상승률에 따른 고정 금액 + 변동 금액",
  },
  { formula: "2 * N", description: "상승률의 2배만큼 주식 수" },
  { formula: "abs(N)", description: "상승/하락률의 절댓값만큼 비율" },
  { formula: "N / 2", description: "상승률의 절반만큼 비율" },
  { formula: "abs(N) * 1000", description: "절댓값 상승률 * 1000원" },
] as const;
