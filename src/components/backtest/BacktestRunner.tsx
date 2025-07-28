import { useState, useCallback } from "react";
import { Stack, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { BacktestConfig } from "./BacktestConfig";
import { BacktestResults } from "./BacktestResults";
import { BacktestProgress } from "./BacktestProgress";
import { runBacktest } from "../../utils/backtestEngine";
import { getStockData } from "../../utils/stockDataLoader";
import type {
  BacktestConfig as BacktestConfigType,
  BacktestResult,
  BacktestProgress as BacktestProgressType,
} from "../../types/backtest";
import type { Strategy } from "../../types/strategy";

interface BacktestRunnerProps {
  strategy: Strategy;
}

export const BacktestRunner = ({ strategy }: BacktestRunnerProps) => {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [progress, setProgress] = useState<BacktestProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // 백테스트 실행
  const handleRunBacktest = useCallback(
    async (backtestConfig: BacktestConfigType) => {
      setResult(null);
      setError(null);
      setIsRunning(true);
      setShowProgress(true);

      try {
        // 준비 단계
        setProgress({
          current: 0,
          total: 100,
          currentDate: "",
          status: "preparing",
          message: "주식 데이터를 로드하고 있습니다...",
        });

        // 주식 데이터 로드
        const stockData = await getStockData(backtestConfig.symbol);

        // 실행 단계 시작
        setProgress({
          current: 0,
          total: stockData.prices.length,
          currentDate: stockData.prices[0]?.date || "",
          status: "running",
          message: "백테스트를 실행하고 있습니다...",
        });

        // 진행 상황 콜백
        const progressCallback = (progressData: BacktestProgressType) => {
          setProgress(progressData);
        };

        // 백테스트 실행
        const backtestResult = await runBacktest(
          backtestConfig,
          strategy,
          stockData,
          progressCallback
        );

        // 완료
        setProgress({
          current: stockData.prices.length,
          total: stockData.prices.length,
          currentDate:
            stockData.prices[stockData.prices.length - 1]?.date || "",
          status: "completed",
          message: "백테스트가 성공적으로 완료되었습니다!",
        });

        setResult(backtestResult);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";

        setProgress({
          current: 0,
          total: 100,
          currentDate: "",
          status: "error",
          message: errorMessage,
        });

        setError(errorMessage);
      } finally {
        setIsRunning(false);
      }
    },
    [strategy]
  );

  // 백테스트 취소
  const handleCancelBacktest = useCallback(() => {
    setIsRunning(false);
    setShowProgress(false);
    setProgress(null);
  }, []);

  // 진행 상황 모달 닫기
  const handleCloseProgress = useCallback(() => {
    setShowProgress(false);
    if (progress?.status === "error") {
      setProgress(null);
    }
  }, [progress]);

  // 설정 변경
  const handleConfigChange = useCallback(
    (_newConfig: BacktestConfigType) => {
      // 설정이 변경되면 기존 결과와 오류 초기화
      if (result) {
        setResult(null);
      }
      if (error) {
        setError(null);
      }
    },
    [result, error]
  );

  return (
    <Stack gap="xl">
      {/* 백테스트 설정 */}
      <BacktestConfig
        onConfigChange={handleConfigChange}
        onRunBacktest={handleRunBacktest}
        isRunning={isRunning}
      />

      {/* 오류 표시 */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          title="백테스트 실행 오류"
        >
          {error}
        </Alert>
      )}

      {/* 백테스트 결과 */}
      {result && !isRunning && <BacktestResults result={result} />}

      {/* 진행 상황 모달 */}
      <BacktestProgress
        progress={progress}
        isOpen={showProgress}
        onClose={handleCloseProgress}
        onCancel={isRunning ? handleCancelBacktest : undefined}
      />

      {/* 전략 정보가 없는 경우 */}
      {!strategy.blocks ||
        (strategy.blocks.length === 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="yellow"
            variant="light"
            title="전략이 설정되지 않았습니다"
          >
            백테스트를 실행하려면 먼저 투자 전략을 설정해야 합니다. '전략 설정'
            탭에서 조건과 액션을 추가해주세요.
          </Alert>
        ))}
    </Stack>
  );
};
