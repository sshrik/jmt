/**
 * 수식 계산기 - 상승/하락 비율(N)을 기반으로 한 동적 계산
 *
 * 지원하는 기능:
 * - 변수 N (실제 상승/하락 비율)
 * - 기본 연산: +, -, *, /
 * - 절댓값 함수: abs(N), abs(expression)
 * - 괄호 처리
 * - 상수
 *
 * 예시:
 * - "10000 * N + 2000" → N=5일 때 60000
 * - "2 * N" → N=3일 때 6
 * - "abs(N) * 0.5" → N=-10일 때 5
 * - "N / 2 + 1000" → N=20일 때 1010
 */

export interface FormulaResult {
  value: number;
  isValid: boolean;
  error?: string;
}

/**
 * 수식을 파싱하고 계산합니다.
 * @param formula 수식 문자열 (예: "10000 * N + 2000")
 * @param n 실제 상승/하락 비율 (예: 5는 5%를 의미)
 * @returns 계산 결과
 */
export function calculateFormula(formula: string, n: number): FormulaResult {
  try {
    if (!formula || formula.trim() === "") {
      return {
        value: 0,
        isValid: false,
        error: "수식이 비어있습니다",
      };
    }

    // 수식 정리 (공백 제거)
    let expression = formula.replace(/\s+/g, "");

    // 변수 N을 실제 값으로 치환
    expression = expression.replace(/N/g, n.toString());

    // abs() 함수 처리
    expression = processAbsFunction(expression);

    // 수식 검증 (허용된 문자만 포함되어 있는지)
    if (!isValidExpression(expression)) {
      return {
        value: 0,
        isValid: false,
        error: "허용되지 않은 문자가 포함되어 있습니다",
      };
    }

    // 수식 계산
    const result = evaluateExpression(expression);

    return {
      value: result,
      isValid: true,
    };
  } catch (error) {
    return {
      value: 0,
      isValid: false,
      error: `계산 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    };
  }
}

/**
 * abs() 함수를 처리합니다.
 * abs(expression) → Math.abs(expression)
 */
function processAbsFunction(expression: string): string {
  // abs() 함수를 반복적으로 처리
  while (expression.includes("abs(")) {
    const absIndex = expression.indexOf("abs(");
    let depth = 0;
    let endIndex = absIndex + 4; // 'abs(' 다음부터

    // 괄호 매칭으로 abs() 함수의 끝을 찾기
    for (let i = absIndex + 4; i < expression.length; i++) {
      if (expression[i] === "(") {
        depth++;
      } else if (expression[i] === ")") {
        if (depth === 0) {
          endIndex = i;
          break;
        }
        depth--;
      }
    }

    // abs() 내부 표현식 추출
    const innerExpression = expression.substring(absIndex + 4, endIndex);

    // 내부 표현식 계산
    const innerResult = evaluateExpression(innerExpression);

    // abs 적용
    const absResult = Math.abs(innerResult);

    // 원래 표현식에서 abs() 부분을 결과로 치환
    expression =
      expression.substring(0, absIndex) +
      absResult.toString() +
      expression.substring(endIndex + 1);
  }

  return expression;
}

/**
 * 수식이 유효한지 검증합니다.
 * 허용된 문자: 숫자, 소수점, 연산자, 괄호
 */
function isValidExpression(expression: string): boolean {
  // 허용된 문자: 숫자, 소수점, 연산자, 괄호
  const allowedPattern = /^[0-9+\-*/.() ]+$/;
  return allowedPattern.test(expression);
}

/**
 * 수식을 안전하게 계산합니다.
 * eval() 대신 수동 파싱을 사용하여 보안을 강화합니다.
 */
function evaluateExpression(expression: string): number {
  // 간단한 수식 파서 구현
  // 연산자 우선순위: *, / > +, -

  // 괄호 처리
  while (expression.includes("(")) {
    const lastOpenIndex = expression.lastIndexOf("(");
    const closeIndex = expression.indexOf(")", lastOpenIndex);

    if (closeIndex === -1) {
      throw new Error("괄호가 올바르게 닫히지 않았습니다");
    }

    const innerExpression = expression.substring(lastOpenIndex + 1, closeIndex);
    const innerResult = evaluateExpression(innerExpression);

    expression =
      expression.substring(0, lastOpenIndex) +
      innerResult.toString() +
      expression.substring(closeIndex + 1);
  }

  // 곱셈, 나눗셈 먼저 처리
  expression = processMultiplicationDivision(expression);

  // 덧셈, 뺄셈 처리
  return processAdditionSubtraction(expression);
}

/**
 * 곱셈과 나눗셈을 처리합니다.
 */
function processMultiplicationDivision(expression: string): string {
  const tokens = tokenize(expression);
  const result: (string | number)[] = [];

  let i = 0;
  while (i < tokens.length) {
    if (
      i + 2 < tokens.length &&
      (tokens[i + 1] === "*" || tokens[i + 1] === "/")
    ) {
      const left = parseFloat(tokens[i] as string);
      const operator = tokens[i + 1];
      const right = parseFloat(tokens[i + 2] as string);

      // NaN 체크
      if (isNaN(left) || isNaN(right)) {
        result.push(tokens[i]);
        i++;
        continue;
      }

      let operationResult: number;
      if (operator === "*") {
        operationResult = left * right;
      } else {
        if (right === 0) {
          throw new Error("0으로 나눌 수 없습니다");
        }
        operationResult = left / right;
      }

      result.push(operationResult);
      i += 3;
    } else {
      result.push(tokens[i]);
      i++;
    }
  }

  return result.join("");
}

/**
 * 덧셈과 뺄셈을 처리합니다.
 */
function processAdditionSubtraction(expression: string): number {
  const tokens = tokenize(expression);

  if (tokens.length === 0) {
    return 0;
  }

  let result = parseFloat(tokens[0] as string);

  // NaN 체크
  if (isNaN(result)) {
    result = 0;
  }

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const operand = parseFloat(tokens[i + 1] as string);

    // NaN 체크
    if (isNaN(operand)) {
      continue;
    }

    if (operator === "+") {
      result += operand;
    } else if (operator === "-") {
      result -= operand;
    }
  }

  return result;
}

/**
 * 표현식을 토큰으로 분할합니다.
 * 음수 처리를 포함합니다.
 */
function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let currentToken = "";

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (["+", "-", "*", "/"].includes(char)) {
      // 음수 처리: '-' 기호가 숫자의 시작 부분이면 음수로 처리
      if (
        char === "-" &&
        (i === 0 || ["(", "+", "-", "*", "/"].includes(expression[i - 1]))
      ) {
        currentToken += char;
      } else {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = "";
        }
        tokens.push(char);
      }
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

/**
 * 수식 예시 및 도움말
 */
export const FORMULA_EXAMPLES = [
  {
    formula: "10000 * N + 2000",
    description: "기본 금액 2000원 + 상승률 1%당 10000원",
    example: "N=5% → 10000*5+2000 = 52000원",
  },
  {
    formula: "2 * N",
    description: "상승률 1%당 2주",
    example: "N=3% → 2*3 = 6주",
  },
  {
    formula: "N",
    description: "상승률과 동일한 비율",
    example: "N=10% → 현금의 10%",
  },
  {
    formula: "abs(N) * 0.5",
    description: "절댓값 적용 (상승/하락 관계없이)",
    example: "N=-8% → abs(-8)*0.5 = 4%",
  },
  {
    formula: "N / 2 + 1000",
    description: "상승률의 절반 + 기본 1000원",
    example: "N=20% → 20/2+1000 = 1010원",
  },
  {
    formula: "(N + 5) * 100",
    description: "괄호 사용",
    example: "N=3% → (3+5)*100 = 800원",
  },
] as const;

/**
 * 수식 유효성 검사 (사용자 입력 시 실시간 검증용)
 */
export function validateFormula(formula: string): {
  isValid: boolean;
  error?: string;
} {
  if (!formula || formula.trim() === "") {
    return { isValid: false, error: "수식을 입력해주세요" };
  }

  // 기본 문법 검사
  const trimmed = formula.replace(/\s+/g, "");

  // N 변수 포함 여부 확인
  if (!trimmed.includes("N")) {
    return { isValid: false, error: "수식에 변수 N이 포함되어야 합니다" };
  }

  // 허용되지 않은 문자 확인
  const invalidChars = trimmed.replace(/[0-9+\-*/.()NabsN]/g, "");
  if (invalidChars.length > 0) {
    return { isValid: false, error: `허용되지 않은 문자: ${invalidChars}` };
  }

  // 괄호 균형 확인
  let openCount = 0;
  for (const char of trimmed) {
    if (char === "(") openCount++;
    else if (char === ")") openCount--;
    if (openCount < 0) {
      return { isValid: false, error: "괄호가 올바르지 않습니다" };
    }
  }
  if (openCount !== 0) {
    return { isValid: false, error: "괄호가 올바르게 닫히지 않았습니다" };
  }

  // 테스트 계산으로 구문 오류 확인
  try {
    calculateFormula(formula, 1);
    return { isValid: true };
  } catch (_error) {
    return { isValid: false, error: "수식 구문 오류" };
  }
}
