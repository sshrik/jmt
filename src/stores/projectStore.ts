import type {
  Project,
  Version,
  ProjectSummary,
  VersionSummary,
  BacktestResult,
} from "../types/project";

const STORAGE_KEY = "jmt_projects";

// 유틸리티 함수들
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

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
      versions: project.versions.map((version) => ({
        ...version,
        createdAt: new Date(version.createdAt),
        backtestResults: version.backtestResults
          ? {
              ...version.backtestResults,
              executedAt: new Date(version.backtestResults.executedAt),
              backtestPeriod: {
                startDate: new Date(
                  version.backtestResults.backtestPeriod.startDate
                ),
                endDate: new Date(
                  version.backtestResults.backtestPeriod.endDate
                ),
              },
              transactions: version.backtestResults.transactions.map((t) => ({
                ...t,
                date: new Date(t.date),
              })),
              portfolioHistory: version.backtestResults.portfolioHistory.map(
                (p) => ({
                  ...p,
                  date: new Date(p.date),
                })
              ),
            }
          : undefined,
      })),
    }));
  } catch (error) {
    console.error("Error loading projects from storage:", error);
    return [];
  }
};

const saveProjectsToStorage = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error saving projects to storage:", error);
    throw new Error("프로젝트 저장 중 오류가 발생했습니다.");
  }
};

// 메인 스토어 클래스
export class ProjectStore {
  // 프로젝트 CRUD
  static getAllProjects(): Project[] {
    return getProjectsFromStorage();
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
        latestReturn: latestVersion?.backtestResults?.totalReturn,
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
      strategy: [], // 빈 전략으로 시작
    };

    newProject.versions.push(initialVersion);
    projects.push(newProject);
    saveProjectsToStorage(projects);

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
    saveProjectsToStorage(projects);

    return updatedProject;
  }

  static deleteProject(projectId: string): void {
    const projects = this.getAllProjects();
    const filteredProjects = projects.filter((p) => p.id !== projectId);

    if (filteredProjects.length === projects.length) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    saveProjectsToStorage(filteredProjects);
  }

  // 개발용 Mock 데이터 생성
  static generateMockData(): void {
    const mockProjects: Project[] = [
      {
        id: "mock-1",
        name: "삼성전자 단순매매 전략",
        description: "가격 상승/하락에 따른 단순 매매 전략",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-15"),
        versions: [
          {
            id: "version-1",
            projectId: "mock-1",
            versionName: "v1.0",
            description: "초기 버전",
            createdAt: new Date("2024-01-10"),
            strategy: [],
          },
          {
            id: "version-2",
            projectId: "mock-1",
            versionName: "v1.1",
            description: "수익률 개선 버전",
            createdAt: new Date("2024-01-15"),
            strategy: [],
            backtestResults: {
              id: "backtest-1",
              versionId: "version-2",
              executedAt: new Date("2024-01-15"),
              totalReturn: 12.5,
              maxDrawdown: -8.2,
              tradeCount: 24,
              winRate: 62.5,
              transactions: [],
              portfolioHistory: [],
              initialCash: 1000000,
              backtestPeriod: {
                startDate: new Date("2023-01-01"),
                endDate: new Date("2023-12-31"),
              },
            },
          },
        ],
      },
      {
        id: "mock-2",
        name: "비트코인 모멘텀 전략",
        description: "모멘텀 기반 암호화폐 투자 전략",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-10"),
        versions: [
          {
            id: "version-3",
            projectId: "mock-2",
            versionName: "v1.0",
            description: "초기 버전",
            createdAt: new Date("2024-01-05"),
            strategy: [],
            backtestResults: {
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
            },
          },
        ],
      },
    ];

    saveProjectsToStorage(mockProjects);
  }
}
