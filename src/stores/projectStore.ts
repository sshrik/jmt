import type {
  Project,
  Version,
  ProjectSummary,
  BacktestResult,
} from "../types/project";
import type { Strategy, StrategyBlock } from "../types/strategy";
import type { BacktestConfig } from "../types/backtest";

const STORAGE_KEY = "jmt_projects";

// 이벤트 시스템 추가 - 프로젝트 변경사항을 다른 컴포넌트에 알림
const PROJECT_CHANGE_EVENT = "jmt-projects-changed";

const dispatchProjectsChanged = () => {
  window.dispatchEvent(new CustomEvent(PROJECT_CHANGE_EVENT));
};

// 유틸리티 함수들
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 빈 Strategy 객체 생성 헬퍼 함수
const createEmptyStrategy = (
  projectId: string,
  versionId: string
): Strategy => ({
  id: generateId(),
  projectId,
  versionId,
  name: "기본 전략",
  description: "초기 전략",
  blocks: [],
  blockOrder: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

/*
const generateVersionName = (existingVersions: Version[]): string => {
  const versionNumbers = existingVersions
    .map((v) => v.versionName.replace("v", ""))
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .sort((a, b) => b - a);

  const latestVersion = versionNumbers[0] || 0;
  const newVersion = (latestVersion + 0.1).toFixed(1);
  return `v${newVersion}`;
};
*/

// LocalStorage 헬퍼 함수들
const getProjectsFromStorage = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const rawProjects = JSON.parse(data) as Project[];
    // Date 객체로 변환
    return rawProjects.map((project) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      versions: project.versions.map((version) => {
        // 백테스트 결과 호환성 처리
        let backtestResults = version.backtestResults;
        if (backtestResults && !Array.isArray(backtestResults)) {
          // 단일 객체를 배열로 변환
          backtestResults = [backtestResults as BacktestResult];
        }

        return {
          ...version,
          createdAt: new Date(version.createdAt),
          backtestResults: backtestResults
            ? backtestResults.map((result: unknown) => {
                const resultData = result as Record<string, unknown>;
                return {
                  id: resultData.id as string,
                  versionId: resultData.versionId as string,
                  executedAt: new Date(resultData.executedAt as string),
                  totalReturn: resultData.totalReturn as number,
                  maxDrawdown: resultData.maxDrawdown as number,
                  tradeCount: resultData.tradeCount as number,
                  winRate: resultData.winRate as number,
                  transactions: (
                    (resultData.transactions as unknown[]) || []
                  ).map((t: unknown) => {
                    const transactionData = t as Record<string, unknown>;
                    return {
                      id: transactionData.id as string,
                      date: new Date(transactionData.date as string),
                      type: transactionData.type as "buy" | "sell",
                      price: transactionData.price as number,
                      quantity: transactionData.quantity as number,
                      amount: transactionData.total as number, // total -> amount 매핑
                      fee: transactionData.commission as number, // commission -> fee 매핑
                      reason:
                        (transactionData.reason as string) || "전략 조건 충족",
                    };
                  }),
                  portfolioHistory: (
                    (resultData.portfolioHistory as unknown[]) || []
                  ).map((p: unknown) => {
                    const portfolioData = p as Record<string, unknown>;
                    return {
                      date: new Date(portfolioData.date as string),
                      cash: portfolioData.cash as number,
                      stockQuantity: 0, // 기본값 설정
                      stockValue: 0, // 기본값 설정
                      totalValue: portfolioData.totalValue as number,
                      dailyReturn: 0, // 기본값 설정
                    };
                  }),
                  initialCash: resultData.initialCash as number,
                  backtestPeriod: {
                    startDate: new Date(
                      (resultData.backtestPeriod as Record<string, unknown>)
                        .startDate as string
                    ),
                    endDate: new Date(
                      (resultData.backtestPeriod as Record<string, unknown>)
                        .endDate as string
                    ),
                  },
                  config: resultData.config as BacktestConfig,
                };
              })
            : [],
        };
      }),
    }));
  } catch (error) {
    console.error("Error loading projects from storage:", error);
    return [];
  }
};

const saveProjectsToStorage = (projects: Project[]): void => {
  try {
    const serializedData = JSON.stringify(projects, null, 2);
    localStorage.setItem(STORAGE_KEY, serializedData);
    dispatchProjectsChanged();
  } catch (error) {
    console.error("프로젝트 저장 실패:", error);
    throw error;
  }
};

// 메인 스토어 클래스
export class ProjectStore {
  // 프로젝트 CRUD
  static getAllProjects(): Project[] {
    const projects = getProjectsFromStorage();
    if (projects.length === 0) {
      this.generateMockData();
      return getProjectsFromStorage();
    }
    return projects;
  }

  static getProjectSummaries(): ProjectSummary[] {
    const projects = this.getAllProjects();
    return projects.map((project) => {
      const latestVersion = project.versions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        lastModified: project.updatedAt,
        totalVersions: project.versions.length,
        latestReturn:
          latestVersion?.backtestResults &&
          Array.isArray(latestVersion.backtestResults) &&
          latestVersion.backtestResults.length > 0
            ? latestVersion.backtestResults[
                latestVersion.backtestResults.length - 1
              ].totalReturn
            : undefined,
      };
    });
  }

  static getProjectById(projectId: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find((p) => p.id === projectId) || null;
  }

  static createProject(name: string, description: string): Project {
    const projects = this.getAllProjects();
    const now = new Date();

    const newProject: Project = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
      versions: [],
    };

    // 기본 버전 1.0 생성
    const initialVersion: Version = {
      id: generateId(),
      projectId: newProject.id,
      versionName: "v1.0",
      description: "초기 버전",
      createdAt: now,
      strategy: createEmptyStrategy(newProject.id, generateId()),
    };

    newProject.versions.push(initialVersion);
    projects.push(newProject);
    saveProjectsToStorage(projects); // 이 함수가 이벤트를 발생시킴

    return newProject;
  }

  static updateProject(
    projectId: string,
    updates: Partial<Pick<Project, "name" | "description">>
  ): Project {
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...updates,
      updatedAt: new Date(),
    };

    projects[projectIndex] = updatedProject;
    saveProjectsToStorage(projects); // 이 함수가 이벤트를 발생시킴

    return updatedProject;
  }

  // TODO: 타입 시스템 재설계 필요 (strategy.ts와 project.ts 타입 통합)
  static updateProjectStrategy(
    projectId: string,
    strategyBlocks: unknown[]
  ): void {
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    // 항상 가장 최신 버전(첫 번째 버전)에 저장
    if (projects[projectIndex].versions.length === 0) {
      throw new Error("프로젝트에 버전이 없습니다.");
    }

    // 전략 데이터를 가장 최신 버전에 저장
    const currentStrategy = projects[projectIndex].versions[0].strategy;
    const updatedStrategy: Strategy = {
      ...currentStrategy,
      blocks: strategyBlocks as unknown as StrategyBlock[],
      updatedAt: new Date(),
    };
    projects[projectIndex].versions[0].strategy = updatedStrategy;
    projects[projectIndex].updatedAt = new Date();

    saveProjectsToStorage(projects);
  }

  static deleteProject(projectId: string): void {
    const projects = this.getAllProjects();
    const filteredProjects = projects.filter((p) => p.id !== projectId);

    saveProjectsToStorage(filteredProjects); // 이 함수가 이벤트를 발생시킴
  }

  static addVersionToProject(projectId: string, version: Version): void {
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    // 새 버전을 배열의 맨 앞에 추가 (최신 버전이 먼저 오도록)
    projects[projectIndex].versions.unshift(version);
    projects[projectIndex].updatedAt = new Date();

    saveProjectsToStorage(projects);
  }

  // 개발용: localStorage 초기화 후 고속도로 매매법 생성
  static resetWithHighwayTradingStrategy(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.generateMockData();
  }

  static saveBacktestResult(
    projectId: string,
    backtestResult: unknown,
    versionId?: string
  ): void {
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    // 버전 찾기 (versionId가 제공된 경우 해당 버전, 아니면 최신 버전)
    if (projects[projectIndex].versions.length === 0) {
      throw new Error("프로젝트에 버전이 없습니다.");
    }

    let targetVersionIndex = 0; // 기본값: 최신 버전 (첫 번째)

    if (versionId) {
      const foundIndex = projects[projectIndex].versions.findIndex(
        (v) => v.id === versionId
      );
      if (foundIndex === -1) {
        console.warn(
          `버전 ID ${versionId}를 찾을 수 없습니다. 최신 버전에 저장합니다.`
        );
      } else {
        targetVersionIndex = foundIndex;
      }
    }

    const result = backtestResult as {
      stats?: {
        totalReturn?: number;
        totalReturnPct?: number;
        maxDrawdown?: number;
        totalTrades?: number;
        winRate?: number;
      };
      trades?: Array<Record<string, unknown>>;
      portfolioHistory?: Array<Record<string, unknown>>;
      config?: {
        initialCash?: number;
        startDate?: string;
        endDate?: string;
        symbol?: string;
        commission?: number;
        slippage?: number;
      };
      startDate?: string;
      endDate?: string;
    };

    // 백테스트 결과를 프로젝트용 형식으로 변환
    const targetVersion = projects[projectIndex].versions[targetVersionIndex];
    const convertedResult = {
      id: generateId(),
      versionId: targetVersion.id,
      executedAt: new Date(),
      totalReturn:
        result.stats?.totalReturnPct || result.stats?.totalReturn || 0, // 퍼센트 수익률 사용
      maxDrawdown: result.stats?.maxDrawdown || 0,
      tradeCount: result.stats?.totalTrades || result.trades?.length || 0,
      winRate: result.stats?.winRate || 0,
      transactions: result.trades || [],
      portfolioHistory: result.portfolioHistory || [],
      initialCash: result.config?.initialCash || 1000000,
      backtestPeriod: {
        startDate: new Date(
          result.startDate || result.config?.startDate || "2024-01-01"
        ),
        endDate: new Date(
          result.endDate || result.config?.endDate || "2024-12-31"
        ),
      },
      config: {
        symbol: result.config?.symbol || "",
        commission: result.config?.commission || 0.001,
        slippage: result.config?.slippage || 0.001,
      },
    };

    // 지정된 버전에 백테스트 결과 추가 (배열로 저장)
    // 기존 데이터 호환성 처리: 단일 객체를 배열로 변환
    const existingResults =
      projects[projectIndex].versions[targetVersionIndex].backtestResults;
    let currentResults: BacktestResult[] = [];

    if (existingResults) {
      if (Array.isArray(existingResults)) {
        // 이미 배열인 경우
        currentResults = existingResults;
      } else {
        // 기존 단일 객체인 경우 배열로 변환
        currentResults = [existingResults as BacktestResult];
      }
    }

    projects[projectIndex].versions[targetVersionIndex].backtestResults = [
      ...currentResults,
      convertedResult as unknown as BacktestResult,
    ];
    projects[projectIndex].updatedAt = new Date();

    saveProjectsToStorage(projects);
  }

  // 고속도로 매매법 전략 생성
  private static createHighwayTradingStrategy(
    projectId: string,
    versionId: string
  ): Strategy {
    const now = new Date();
    const strategyId = generateId();

    const strategy: Strategy = {
      id: strategyId,
      projectId,
      versionId,
      name: "고속도로 매매법",
      description: "단계적 하락/상승에 따른 비례 매매 전략",
      blocks: [
        // 🔵 0-2% 하락 시 기본 매수 (현금의 10%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-1`,
          type: "condition",
          name: "0-2% 하락 구간",
          description: "가격이 0%~2% 하락했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 0,
            maxPercent: 2,
            rangeDirection: "down",
            rangeOperator: "left_inclusive", // 0% 이상 2% 미만
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-1`,
          type: "action",
          name: "기본 매수",
          description: "현금의 10% 매수",
          actionType: "buy_percent_cash",
          actionParams: {
            percentCash: 10,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },

        // 🔵 2-4% 하락 시 강화 매수 (현금의 20%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-2`,
          type: "condition",
          name: "2-4% 하락 구간",
          description: "가격이 2%~4% 하락했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 2,
            maxPercent: 4,
            rangeDirection: "down",
            rangeOperator: "left_inclusive", // 2% 이상 4% 미만
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-2`,
          type: "action",
          name: "강화 매수",
          description: "현금의 20% 매수",
          actionType: "buy_percent_cash",
          actionParams: {
            percentCash: 20,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },

        // 🔵 4%+ 하락 시 폭탄 매수 (현금의 50%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-3`,
          type: "condition",
          name: "4%+ 하락 구간",
          description: "가격이 4% 이상 하락했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 4,
            maxPercent: 100, // 상한 제거 (4% 이상이면 모두)
            rangeDirection: "down",
            rangeOperator: "left_inclusive", // 4% 이상
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-3`,
          type: "action",
          name: "폭탄 매수",
          description: "현금의 50% 매수",
          actionType: "buy_percent_cash",
          actionParams: {
            percentCash: 50,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },

        // 🔴 0-2% 상승 시 기본 매도 (주식의 10%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-4`,
          type: "condition",
          name: "0-2% 상승 구간",
          description: "가격이 0%~2% 상승했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 0,
            maxPercent: 2,
            rangeDirection: "up",
            rangeOperator: "left_inclusive", // 0% 이상 2% 미만
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-4`,
          type: "action",
          name: "기본 매도",
          description: "주식의 10% 매도",
          actionType: "sell_percent_stock",
          actionParams: {
            percentStock: 10,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },

        // 🔴 2-4% 상승 시 강화 매도 (주식의 20%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-5`,
          type: "condition",
          name: "2-4% 상승 구간",
          description: "가격이 2%~4% 상승했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 2,
            maxPercent: 4,
            rangeDirection: "up",
            rangeOperator: "left_inclusive", // 2% 이상 4% 미만
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-5`,
          type: "action",
          name: "강화 매도",
          description: "주식의 20% 매도",
          actionType: "sell_percent_stock",
          actionParams: {
            percentStock: 20,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },

        // 🔴 4%+ 상승 시 대량 매도 (주식의 50%) - 더 민감하게 조정
        {
          id: `${strategyId}-condition-6`,
          type: "condition",
          name: "4%+ 상승 구간",
          description: "가격이 4% 이상 상승했을 때",
          conditionType: "close_price_range",
          conditionParams: {
            minPercent: 4,
            maxPercent: 100, // 상한 제거 (4% 이상이면 모두)
            rangeDirection: "up",
            rangeOperator: "left_inclusive", // 4% 이상
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `${strategyId}-action-6`,
          type: "action",
          name: "대량 매도",
          description: "주식의 50% 매도",
          actionType: "sell_percent_stock",
          actionParams: {
            percentStock: 50,
          },
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      blockOrder: [
        `${strategyId}-condition-1`,
        `${strategyId}-action-1`,
        `${strategyId}-condition-2`,
        `${strategyId}-action-2`,
        `${strategyId}-condition-3`,
        `${strategyId}-action-3`,
        `${strategyId}-condition-4`,
        `${strategyId}-action-4`,
        `${strategyId}-condition-5`,
        `${strategyId}-action-5`,
        `${strategyId}-condition-6`,
        `${strategyId}-action-6`,
      ],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    return strategy;
  }

  // 개발용 Mock 데이터 생성 (고속도로 매매법 포함)
  static generateMockData(): void {
    const mockProjects: Project[] = [
      {
        id: "mock-1",
        name: "고속도로 매매법",
        description:
          "단계적 하락/상승에 따른 비례 매매 전략 - 하락폭이 클수록 더 많이 매수, 상승폭이 클수록 더 많이 매도",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-15"),
        versions: [
          {
            id: "version-1",
            projectId: "mock-1",
            versionName: "v1.0",
            description: "고속도로 매매법 기본 전략",
            createdAt: new Date("2024-01-10"),
            strategy: this.createHighwayTradingStrategy("mock-1", "version-1"),
          },
          {
            id: "version-2",
            projectId: "mock-1",
            versionName: "v1.1",
            description: "매매 비율 최적화 버전",
            createdAt: new Date("2024-01-15"),
            strategy: this.createHighwayTradingStrategy("mock-1", "version-2"),
            backtestResults: [
              {
                id: "backtest-1",
                versionId: "version-2",
                executedAt: new Date("2024-01-15"),
                totalReturn: 23.8,
                maxDrawdown: -12.4,
                tradeCount: 45,
                winRate: 68.9,
                transactions: [],
                portfolioHistory: [],
                initialCash: 1000000,
                backtestPeriod: {
                  startDate: new Date("2023-01-01"),
                  endDate: new Date("2023-12-31"),
                },
                config: {
                  symbol: "005930",
                  commission: 0.0015,
                  slippage: 0.001,
                },
              },
            ],
          },
        ],
      },
      {
        id: "mock-2",
        name: "단순 변동성 돌파 전략",
        description: "일일 변동성을 활용한 단순 매매 전략",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-10"),
        versions: [
          {
            id: "version-3",
            projectId: "mock-2",
            versionName: "v1.0",
            description: "초기 버전",
            createdAt: new Date("2024-01-05"),
            strategy: {
              id: generateId(),
              projectId: "sample-project",
              versionId: "sample-version-1",
              name: "샘플 전략",
              description: "기본 전략",
              blocks: [],
              blockOrder: [],
              createdAt: new Date("2024-01-05"),
              updatedAt: new Date("2024-01-10"),
              isActive: true,
            },
            backtestResults: [
              {
                id: "backtest-2",
                versionId: "version-3",
                executedAt: new Date("2024-01-10"),
                totalReturn: -3.2,
                maxDrawdown: -15.8,
                tradeCount: 18,
                winRate: 44.4,
                transactions: [],
                portfolioHistory: [],
                initialCash: 1000000,
                backtestPeriod: {
                  startDate: new Date("2023-01-01"),
                  endDate: new Date("2023-12-31"),
                },
                config: {
                  symbol: "BTC-USD",
                  commission: 0.0015,
                  slippage: 0.001,
                },
              },
            ],
          },
        ],
      },
    ];

    saveProjectsToStorage(mockProjects); // 이 함수가 이벤트를 발생시킴
  }
}

// 다른 컴포넌트에서 프로젝트 변경사항을 감지할 수 있도록 이벤트 이름 export
export { PROJECT_CHANGE_EVENT };
