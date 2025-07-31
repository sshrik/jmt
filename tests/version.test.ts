// 버전 관리 테스트 (Vitest 버전)
import { describe, test, expect } from "vitest";
import type { Version } from "../src/types/project";
import type { Strategy, StrategyBlock } from "../src/types/strategy";

// 간단한 버전 스토어 테스트 (실제 API 대신 기본 기능만 테스트)

describe("버전 관리 기본 테스트", () => {
  // 테스트용 전략 생성 함수
  function createTestStrategy(
    projectId: string,
    versionId: string,
    blocks: StrategyBlock[] = []
  ): Strategy {
    const now = new Date();
    return {
      id: `strategy-${Date.now()}`,
      projectId,
      versionId,
      name: "테스트 전략",
      description: "테스트용 전략입니다",
      blocks,
      blockOrder: blocks.map((b) => b.id),
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
  }

  // 테스트용 블록 생성 함수
  function createTestBlock(
    type: "condition" | "action",
    id?: string
  ): StrategyBlock {
    const now = new Date();
    return {
      id:
        id || `block-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type,
      conditionType: type === "condition" ? "always" : undefined,
      actionType: type === "action" ? "hold" : undefined,
      params: {},
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  // 버전 생성 함수
  function createVersion(
    projectId: string,
    name: string,
    description: string,
    strategy: Strategy,
    isAutoSave: boolean = false
  ): Version {
    const now = new Date();
    return {
      id: `version-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      projectId,
      versionName: name,
      description,
      strategy,
      backtestResults: [],
      isAutoSave,
      createdAt: now,
      updatedAt: now,
    };
  }

  // 버전 이름 생성 함수
  function generateVersionName(versions: Version[]): string {
    if (!versions || versions.length === 0) {
      return "v0.1";
    }

    const versionNumbers = versions
      .map((v) => v.versionName.replace("v", ""))
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v))
      .sort((a, b) => b - a);

    const latestVersion = versionNumbers[0] || 0;
    const newVersion = (latestVersion + 0.1).toFixed(1);
    return `v${newVersion}`;
  }

  describe("버전 생성", () => {
    test("새 버전이 올바르게 생성되어야 함", () => {
      const projectId = "test-project";
      const strategy = createTestStrategy(projectId, "");

      const version = createVersion(
        projectId,
        "v0.1",
        "첫 번째 버전",
        strategy,
        false
      );

      expect(version).toBeDefined();
      expect(version.versionName).toBe("v0.1");
      expect(version.description).toBe("첫 번째 버전");
      expect(version.projectId).toBe(projectId);
      expect(version.strategy).toEqual(strategy);
      expect(version.isAutoSave).toBe(false);
    });

    test("자동 저장 버전이 생성되어야 함", () => {
      const projectId = "test-project";
      const strategy = createTestStrategy(projectId, "");

      const version = createVersion(
        projectId,
        "v0.1",
        "자동 저장",
        strategy,
        true
      );

      expect(version.isAutoSave).toBe(true);
    });
  });

  describe("전략 비교", () => {
    test("동일한 전략은 블록 수가 같아야 함", () => {
      const strategy1 = createTestStrategy("project1", "version1", []);
      const strategy2 = createTestStrategy("project1", "version2", []);

      expect(strategy1.blocks.length).toBe(strategy2.blocks.length);
    });

    test("블록 추가 시 블록 수가 증가해야 함", () => {
      const strategy1 = createTestStrategy("project1", "version1", []);
      const newBlock = createTestBlock("condition", "test-condition");
      const strategy2 = createTestStrategy("project1", "version2", [newBlock]);

      expect(strategy2.blocks.length).toBe(strategy1.blocks.length + 1);
      expect(strategy2.blocks[0].id).toBe(newBlock.id);
    });

    test("블록 제거 시 블록 수가 감소해야 함", () => {
      const block = createTestBlock("action", "test-action");
      const strategy1 = createTestStrategy("project1", "version1", [block]);
      const strategy2 = createTestStrategy("project1", "version2", []);

      expect(strategy1.blocks.length).toBe(strategy2.blocks.length + 1);
      expect(strategy1.blocks[0].id).toBe(block.id);
    });
  });

  describe("버전 관리", () => {
    test("버전 목록에서 최신 버전을 찾을 수 있어야 함", () => {
      const version1 = createVersion(
        "project1",
        "v0.1",
        "첫 번째",
        createTestStrategy("project1", ""),
        false
      );

      // 약간의 시간 차이를 두기 위해
      setTimeout(() => {
        const version2 = createVersion(
          "project1",
          "v0.2",
          "두 번째",
          createTestStrategy("project1", ""),
          false
        );

        const versions = [version1, version2];
        const sortedVersions = versions.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        expect(sortedVersions[0].versionName).toBe("v0.2");
      }, 10);
    });

    test("백테스트 결과가 있는 버전만 필터링할 수 있어야 함", () => {
      const version1 = createVersion(
        "project1",
        "v0.1",
        "첫 번째",
        createTestStrategy("project1", ""),
        false
      );

      const version2 = createVersion(
        "project1",
        "v0.2",
        "두 번째",
        createTestStrategy("project1", ""),
        false
      );

      // version1에 백테스트 결과 추가
      version1.backtestResults = [
        {
          id: "test-result",
          totalReturn: 5.5,
          maxDrawdown: -2.0,
          winRate: 65,
          totalTrades: 10,
          config: {
            stockSymbol: "TEST",
            startDate: new Date(),
            endDate: new Date(),
            initialCash: 1000000,
            commission: 0.0025,
          },
          transactions: [],
          portfolioHistory: [],
          createdAt: new Date(),
        },
      ];

      const versions = [version1, version2];
      const backtested = versions.filter((v) =>
        Array.isArray(v.backtestResults)
          ? v.backtestResults.length > 0
          : !!v.backtestResults
      );

      expect(backtested).toHaveLength(1);
      expect(backtested[0].versionName).toBe("v0.1");
    });

    test("자동 저장 버전과 수동 저장 버전을 구분할 수 있어야 함", () => {
      const autoVersion = createVersion(
        "project1",
        "v0.1",
        "자동 저장",
        createTestStrategy("project1", ""),
        true
      );

      const manualVersion = createVersion(
        "project1",
        "v1.0",
        "수동 저장",
        createTestStrategy("project1", ""),
        false
      );

      const versions = [autoVersion, manualVersion];
      const autoVersions = versions.filter((v) => v.isAutoSave);
      const manualVersions = versions.filter((v) => !v.isAutoSave);

      expect(autoVersions).toHaveLength(1);
      expect(manualVersions).toHaveLength(1);
      expect(autoVersions[0].versionName).toBe("v0.1");
      expect(manualVersions[0].versionName).toBe("v1.0");
    });

    test("버전 이름 생성이 올바르게 작동해야 함", () => {
      const firstName = generateVersionName([]);
      expect(firstName).toBe("v0.1");

      const version1 = createVersion(
        "project1",
        "v1.5",
        "테스트",
        createTestStrategy("project1", ""),
        false
      );

      const nextName = generateVersionName([version1]);
      expect(nextName).toBe("v1.6");
    });
  });

  describe("전략 블록 관리", () => {
    test("조건 블록이 올바르게 생성되어야 함", () => {
      const conditionBlock = createTestBlock("condition");

      expect(conditionBlock.type).toBe("condition");
      expect(conditionBlock.conditionType).toBe("always");
      expect(conditionBlock.enabled).toBe(true);
    });

    test("액션 블록이 올바르게 생성되어야 함", () => {
      const actionBlock = createTestBlock("action");

      expect(actionBlock.type).toBe("action");
      expect(actionBlock.actionType).toBe("hold");
      expect(actionBlock.enabled).toBe(true);
    });

    test("전략에 블록을 추가할 수 있어야 함", () => {
      const blocks = [createTestBlock("condition"), createTestBlock("action")];

      const strategy = createTestStrategy("project1", "version1", blocks);

      expect(strategy.blocks).toHaveLength(2);
      expect(strategy.blocks[0].type).toBe("condition");
      expect(strategy.blocks[1].type).toBe("action");
      expect(strategy.blockOrder).toEqual([blocks[0].id, blocks[1].id]);
    });
  });
});
