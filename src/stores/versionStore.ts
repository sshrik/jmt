import type {
  Project,
  Version,
  VersionCreationOptions,
  VersionComparisonResult,
  StrategyChange,
} from "../types/project";
import type { Strategy } from "../types/strategy";

// 유틸리티 함수들
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateVersionName = (existingVersions: Version[]): string => {
  if (!existingVersions || !Array.isArray(existingVersions)) {
    return "v1.0";
  }

  const versionNumbers = existingVersions
    .map((v) => v.versionName.replace("v", ""))
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .sort((a, b) => b - a);

  const latestVersion = versionNumbers[0] || 0;
  const newVersion = (latestVersion + 0.1).toFixed(1);
  return `v${newVersion}`;
};

// 기본 전략 객체 생성
const createEmptyStrategy = (
  projectId: string,
  versionId: string
): Strategy => {
  const now = new Date();
  return {
    id: generateId(),
    projectId,
    versionId,
    name: "새 전략",
    description: "새로 생성된 전략입니다.",
    blocks: [],
    blockOrder: [],
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };
};

// 전략 비교 함수
const compareStrategies = (
  strategy1: Strategy,
  strategy2: Strategy
): VersionComparisonResult => {
  try {
    const strategyChanges: StrategyChange[] = [];

    // 안전하게 블록 배열 가져오기
    const blocks1 = strategy1?.blocks || [];
    const blocks2 = strategy2?.blocks || [];

    // blocks가 배열인지 확인
    if (!Array.isArray(blocks1) || !Array.isArray(blocks2)) {
      return {
        hasChanges: true,
        strategyChanges: [
          {
            type: "modified",
            blockType: "condition",
            blockId: "structure",
            description: "전략 구조가 변경되었습니다.",
          },
        ],
        metadataChanges: [],
      };
    }

    // 블록 비교
    const blocks1Map = new Map(blocks1.map((block) => [block.id, block]));
    const blocks2Map = new Map(blocks2.map((block) => [block.id, block]));

    // 추가된 블록들
    blocks2.forEach((block) => {
      if (!blocks1Map.has(block.id)) {
        strategyChanges.push({
          type: "added",
          blockType: block.type,
          blockId: block.id,
          description: `${block.type} 블록이 추가되었습니다: ${block.name || block.id}`,
          after: block,
        });
      }
    });

    // 제거된 블록들
    blocks1.forEach((block) => {
      if (!blocks2Map.has(block.id)) {
        strategyChanges.push({
          type: "removed",
          blockType: block.type,
          blockId: block.id,
          description: `${block.type} 블록이 제거되었습니다: ${block.name || block.id}`,
          before: block,
        });
      }
    });

    // 수정된 블록들
    blocks1.forEach((block1) => {
      const block2 = blocks2Map.get(block1.id);
      if (block2) {
        // 깊은 비교를 위해 JSON 문자열 비교
        if (JSON.stringify(block1) !== JSON.stringify(block2)) {
          strategyChanges.push({
            type: "modified",
            blockType: block1.type,
            blockId: block1.id,
            description: `${block1.type} 블록이 수정되었습니다: ${block1.name || block1.id}`,
            before: block1,
            after: block2,
          });
        }
      }
    });

    return {
      hasChanges: strategyChanges.length > 0,
      strategyChanges,
      metadataChanges: [], // 필요시 추가 구현
    };
  } catch (error) {
    console.warn("전략 비교 중 오류:", error);
    return {
      hasChanges: true,
      strategyChanges: [
        {
          type: "modified",
          blockType: "condition",
          blockId: "error",
          description: "전략 비교 중 오류가 발생했습니다.",
        },
      ],
      metadataChanges: [],
    };
  }
};

// 버전 관리 스토어
export class VersionStore {
  /**
   * 새 버전 이름 생성
   */
  static generateVersionName(existingVersions: Version[]): string {
    return generateVersionName(existingVersions);
  }
  /**
   * 새 버전 생성
   */
  static createVersion(
    project: Project,
    strategy: Strategy,
    options: VersionCreationOptions
  ): Version {
    const now = new Date();
    const versionId = generateId();

    const newVersion: Version = {
      id: versionId,
      projectId: project.id,
      versionName: generateVersionName(project.versions),
      description: options.description,
      createdAt: now,
      strategy: {
        ...strategy,
        versionId,
        updatedAt: now,
      },
    };

    return newVersion;
  }

  /**
   * 전략에서 자동 버전 생성 (변경사항이 있을 때만)
   */
  static createAutoVersionIfChanged(
    project: Project,
    newStrategy: Strategy,
    description = "자동 저장"
  ): Version | null {
    const latestVersion = this.getLatestVersion(project);

    if (!latestVersion) {
      // 첫 버전인 경우
      return this.createVersion(project, newStrategy, {
        description: "초기 버전",
      });
    }

    const comparison = compareStrategies(latestVersion.strategy, newStrategy);

    if (comparison.hasChanges) {
      return this.createVersion(project, newStrategy, {
        description,
      });
    }

    return null; // 변경사항이 없음
  }

  /**
   * 특정 버전의 전략을 복사해서 새 버전 생성
   */
  static duplicateVersion(
    project: Project,
    sourceVersionId: string,
    options: VersionCreationOptions
  ): Version | null {
    if (!project.versions || !Array.isArray(project.versions)) {
      return null;
    }

    const sourceVersion = project.versions.find(
      (v) => v.id === sourceVersionId
    );
    if (!sourceVersion) return null;

    // 전략 복사 (딥 클론)
    const copiedStrategy: Strategy = JSON.parse(
      JSON.stringify(sourceVersion.strategy)
    );

    return this.createVersion(project, copiedStrategy, options);
  }

  /**
   * 최신 버전 가져오기
   */
  static getLatestVersion(project: Project): Version | null {
    if (
      !project.versions ||
      !Array.isArray(project.versions) ||
      project.versions.length === 0
    ) {
      return null;
    }

    return project.versions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  /**
   * 두 버전 비교
   */
  static compareVersions(
    version1: Version,
    version2: Version
  ): VersionComparisonResult {
    return compareStrategies(version1.strategy, version2.strategy);
  }

  /**
   * 버전을 특정 시점으로 되돌리기
   */
  static revertToVersion(
    project: Project,
    targetVersionId: string,
    description = "버전 되돌리기"
  ): Version | null {
    if (!project.versions || !Array.isArray(project.versions)) {
      return null;
    }

    const targetVersion = project.versions.find(
      (v) => v.id === targetVersionId
    );
    if (!targetVersion) return null;

    // 타겟 버전의 전략을 복사해서 새 버전으로 생성
    return this.duplicateVersion(project, targetVersionId, {
      description: `${description} (${targetVersion.versionName}로 되돌리기)`,
    });
  }

  /**
   * 버전 목록을 시간순으로 정렬해서 가져오기
   */
  static getVersionsOrderedByDate(
    project: Project,
    ascending = false
  ): Version[] {
    if (!project.versions || !Array.isArray(project.versions)) {
      return [];
    }
    return [...project.versions].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    });
  }

  /**
   * 백테스트 결과가 있는 버전들만 가져오기
   */
  static getVersionsWithBacktest(project: Project): Version[] {
    if (!project.versions || !Array.isArray(project.versions)) {
      return [];
    }
    return project.versions.filter((v) => v.backtestResults);
  }

  /**
   * 자동 저장 버전들 정리 (더 이상 사용하지 않음)
   */
  static cleanupAutoSavedVersions(
    project: Project,
    _keepCount = 10
  ): Version[] {
    if (!project.versions || !Array.isArray(project.versions)) {
      return [];
    }

    // 자동 저장 기능을 제거했으므로 모든 버전을 그대로 반환
    return project.versions;
  }

  /**
   * 빈 전략으로 새 버전 생성
   */
  static createEmptyVersion(
    project: Project,
    options: VersionCreationOptions
  ): Version {
    const emptyStrategy = createEmptyStrategy(project.id, generateId());
    return this.createVersion(project, emptyStrategy, options);
  }
}

// 버전 관리 이벤트
export const VERSION_EVENTS = {
  VERSION_CREATED: "version-created",
  VERSION_UPDATED: "version-updated",
  VERSION_DELETED: "version-deleted",
  VERSION_REVERTED: "version-reverted",
} as const;
