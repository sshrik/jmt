import { useState, useCallback, useEffect } from "react";
import { Stack, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { BacktestConfig } from "./BacktestConfig";
import { BacktestResults } from "./BacktestResults";
import { BacktestProgress } from "./BacktestProgress";
import { runBacktest } from "../../utils/backtestEngine";
import { getStockData } from "../../utils/stockDataLoader";
import { ProjectStore } from "../../stores/projectStore";
import type {
  BacktestConfig as BacktestConfigType,
  BacktestResult,
  BacktestProgress as BacktestProgressType,
} from "../../types/backtest";
import type { Strategy } from "../../types/strategy";

interface BacktestRunnerProps {
  strategy: Strategy;
  projectId?: string;
  versionId?: string;
  autoStart?: boolean;
  initialConfig?: Partial<BacktestConfigType>;
}

export const BacktestRunner = ({
  strategy,
  projectId,
  versionId,
  autoStart = false,
  initialConfig,
}: BacktestRunnerProps) => {
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

        // 기간에 따른 필터링된 데이터 길이 계산
        const filteredPrices = stockData.prices.filter(
          (price) =>
            price.date >= backtestConfig.startDate &&
            price.date <= backtestConfig.endDate
        );

        // 실행 단계 시작
        setProgress({
          current: 0,
          total: filteredPrices.length, // 필터링된 데이터 길이 사용
          currentDate: filteredPrices[0]?.date || "",
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
          current: filteredPrices.length,
          total: filteredPrices.length,
          currentDate: filteredPrices[filteredPrices.length - 1]?.date || "",
          status: "completed",
          message: "백테스트가 성공적으로 완료되었습니다!",
        });

        setResult(backtestResult);

        // 프로젝트가 있는 경우 백테스트 결과 저장
        if (projectId) {
          try {
            // 백테스트 설정 정보도 함께 포함
            const enrichedResult = {
              ...backtestResult,
              config: backtestConfig, // 백테스트 설정 정보 추가
            };

            ProjectStore.saveBacktestResult(
              projectId,
              enrichedResult,
              versionId
            );
          } catch (saveError) {
            console.error("백테스트 결과 저장 실패:", saveError);
            // 저장 실패해도 결과는 표시
          }
        }
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
    [strategy, projectId, versionId]
  );

  // 자동 시작 처리
  useEffect(() => {
    if (autoStart && !isRunning && !result) {
      // 기본 백테스트 설정으로 자동 시작
      const defaultConfig: BacktestConfigType = {
        symbol: "005930", // 삼성전자
        startDate: "2024-01-01",
        endDate: new Date().toISOString().split("T")[0], // 오늘 날짜
        initialCash: 10000000, // 1천만원
        commission: 0.00015, // 0.015%
        slippage: 0.0001, // 0.01%
      };

      handleRunBacktest(defaultConfig);
    }
  }, [autoStart, isRunning, result, handleRunBacktest]);

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
        initialConfig={initialConfig}
        onConfigChange={handleConfigChange}
        onRunBacktest={handleRunBacktest}
        isRunning={isRunning}
        strategy={strategy}
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
    </Stack>
  );
};
