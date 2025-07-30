import type { Project, Version } from "../src/types/project";
import type { Strategy, StrategyBlock } from "../src/types/strategy";
import { VersionStore } from "../src/stores/versionStore";

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
  const blockId = id || `block-${Date.now()}-${Math.random()}`;
  const now = new Date();

  const baseBlock = {
    id: blockId,
    type,
    name: type === "condition" ? "테스트 조건" : "테스트 액션",
    enabled: true,
    createdAt: now,
    updatedAt: now,
    position: { x: 0, y: 0 },
    connections: [],
  };

  if (type === "condition") {
    return {
      ...baseBlock,
      type: "condition",
      conditionType: "always",
      conditionParams: {},
    };
  } else {
    return {
      ...baseBlock,
      type: "action",
      actionType: "hold",
      actionParams: {},
    };
  }
}

// 테스트용 프로젝트 생성 함수
function createTestProject(versions: Version[] = []): Project {
  const now = new Date();
  return {
    id: `project-${Date.now()}`,
    name: "테스트 프로젝트",
    description: "테스트용 프로젝트입니다",
    createdAt: now,
    updatedAt: now,
    versions,
  };
}

console.log("🧪 버전 관리 테스트 시작");
console.log("=".repeat(50));

function testVersionCreation(): void {
  console.log("\n📝 1. 버전 생성 테스트");
  console.log("-".repeat(30));

  const project = createTestProject();
  const strategy = createTestStrategy(project.id, "v1.0");

  const version = VersionStore.createVersion(project, strategy, {
    description: "첫 번째 버전",
    author: "테스트 사용자",
    isAutoSaved: false,
  });

  console.log(`✅ 버전 생성 성공: ${version.versionName}`);
  console.log(`   설명: ${version.description}`);
  console.log(`   작성자: ${version.author}`);
  console.log(`   자동저장: ${version.isAutoSaved ? "예" : "아니오"}`);

  // 검증
  if (!version.id || !version.versionName || !version.strategy) {
    throw new Error("버전 생성 실패: 필수 필드가 누락됨");
  }

  console.log("✅ 버전 생성 테스트 통과");
}

function testVersionComparison(): void {
  console.log("\n🔍 2. 버전 비교 테스트");
  console.log("-".repeat(30));

  const project = createTestProject();

  // 첫 번째 버전 (빈 전략)
  const strategy1 = createTestStrategy(project.id, "v1.0", []);
  const version1 = VersionStore.createVersion(project, strategy1, {
    description: "빈 전략",
  });

  // 두 번째 버전 (블록 추가)
  const block1 = createTestBlock("condition", "block-1");
  const block2 = createTestBlock("action", "block-2");
  const strategy2 = createTestStrategy(project.id, "v1.1", [block1, block2]);
  const version2 = VersionStore.createVersion(project, strategy2, {
    description: "블록이 추가된 전략",
  });

  const comparison = VersionStore.compareVersions(version1, version2);

  console.log(`변경사항 존재: ${comparison.hasChanges ? "예" : "아니오"}`);
  console.log(`전략 변경사항 수: ${comparison.strategyChanges.length}개`);

  comparison.strategyChanges.forEach((change, index) => {
    console.log(`  ${index + 1}. ${change.type}: ${change.description}`);
  });

  // 검증
  if (!comparison.hasChanges) {
    throw new Error("버전 비교 실패: 변경사항이 감지되지 않음");
  }

  if (comparison.strategyChanges.length !== 2) {
    throw new Error(
      `버전 비교 실패: 예상 변경사항 2개, 실제 ${comparison.strategyChanges.length}개`
    );
  }

  console.log("✅ 버전 비교 테스트 통과");
}

function testAutoVersionCreation(): void {
  console.log("\n🤖 3. 자동 버전 생성 테스트");
  console.log("-".repeat(30));

  const project = createTestProject();

  // 첫 번째 전략
  const strategy1 = createTestStrategy(project.id, "v1.0", []);

  // 첫 버전 자동 생성 (빈 프로젝트이므로 생성되어야 함)
  const autoVersion1 = VersionStore.createAutoVersionIfChanged(
    project,
    strategy1,
    "자동 저장 - 첫 버전"
  );

  if (!autoVersion1) {
    throw new Error("첫 번째 자동 버전 생성 실패");
  }

  console.log(`✅ 첫 번째 자동 버전 생성: ${autoVersion1.versionName}`);

  // 프로젝트에 버전 추가
  project.versions.push(autoVersion1);

  // 동일한 전략으로 다시 시도 (변경사항이 없으므로 null 반환되어야 함)
  const autoVersion2 = VersionStore.createAutoVersionIfChanged(
    project,
    strategy1,
    "자동 저장 - 변경사항 없음"
  );

  if (autoVersion2 !== null) {
    throw new Error("변경사항이 없는데 자동 버전이 생성됨");
  }

  console.log("✅ 변경사항 없는 경우 자동 버전 미생성 확인");

  // 전략 변경 후 자동 버전 생성
  const block = createTestBlock("condition", "block-auto");
  const strategy2 = createTestStrategy(project.id, "v1.1", [block]);

  const autoVersion3 = VersionStore.createAutoVersionIfChanged(
    project,
    strategy2,
    "자동 저장 - 블록 추가"
  );

  if (!autoVersion3) {
    throw new Error("변경된 전략의 자동 버전 생성 실패");
  }

  console.log(`✅ 변경사항 있는 자동 버전 생성: ${autoVersion3.versionName}`);
  console.log("✅ 자동 버전 생성 테스트 통과");
}

function testVersionRevert(): void {
  console.log("\n↩️  4. 버전 되돌리기 테스트");
  console.log("-".repeat(30));

  const project = createTestProject();

  // 여러 버전 생성
  const strategy1 = createTestStrategy(project.id, "v1.0", []);
  const version1 = VersionStore.createVersion(project, strategy1, {
    description: "첫 번째 버전",
  });

  const block = createTestBlock("condition", "block-revert");
  const strategy2 = createTestStrategy(project.id, "v1.1", [block]);
  const version2 = VersionStore.createVersion(project, strategy2, {
    description: "두 번째 버전",
  });

  project.versions.push(version1, version2);

  // 첫 번째 버전으로 되돌리기
  const revertedVersion = VersionStore.revertToVersion(
    project,
    version1.id,
    "첫 번째 버전으로 되돌리기"
  );

  if (!revertedVersion) {
    throw new Error("버전 되돌리기 실패");
  }

  console.log(`✅ 되돌리기 버전 생성: ${revertedVersion.versionName}`);
  console.log(`   설명: ${revertedVersion.description}`);

  // 되돌린 전략이 원본과 동일한지 확인
  const comparison = VersionStore.compareVersions(version1, revertedVersion);

  if (comparison.hasChanges) {
    throw new Error("되돌린 버전이 원본과 다름");
  }

  console.log("✅ 되돌린 버전이 원본과 동일함 확인");
  console.log("✅ 버전 되돌리기 테스트 통과");
}

async function testVersionUtilities(): Promise<void> {
  console.log("\n🛠️  5. 버전 유틸리티 함수 테스트");
  console.log("-".repeat(30));

  const project = createTestProject();

  // 여러 버전 생성 (시간 차이를 두고)
  const strategy1 = createTestStrategy(project.id, "v1.0", []);
  const version1 = VersionStore.createVersion(project, strategy1, {
    description: "첫 번째 버전",
    isAutoSaved: true,
  });

  const strategy2 = createTestStrategy(project.id, "v1.1", []);
  const version2 = VersionStore.createVersion(project, strategy2, {
    description: "두 번째 버전",
    isAutoSaved: false,
  });

  // 백테스트 결과 추가
  version2.backtestResults = {
    id: "backtest-1",
    versionId: version2.id,
    executedAt: new Date(),
    totalReturn: 15.5,
    maxDrawdown: -8.2,
    tradeCount: 12,
    winRate: 75.0,
    transactions: [],
    portfolioHistory: [],
    initialCash: 1000000,
    backtestPeriod: {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
  };

  project.versions.push(version1, version2);

  // 최신 버전 가져오기
  const latestVersion = VersionStore.getLatestVersion(project);
  if (!latestVersion) {
    throw new Error("최신 버전 가져오기 실패 - latestVersion이 null입니다");
  }
  if (latestVersion.id !== version2.id) {
    throw new Error(`최신 버전 가져오기 실패 - 예상: ${version2.id}, 실제: ${latestVersion.id}`);
  }
  console.log(`✅ 최신 버전: ${latestVersion.versionName}`);

  // 시간순 정렬
  const orderedVersions = VersionStore.getVersionsOrderedByDate(project);
  if (orderedVersions[0].id !== version2.id) {
    throw new Error("시간순 정렬 실패");
  }
  console.log(
    `✅ 시간순 정렬: ${orderedVersions.map((v) => v.versionName).join(" → ")}`
  );

  // 백테스트 결과가 있는 버전들
  const backtestVersions = VersionStore.getVersionsWithBacktest(project);
  if (backtestVersions.length !== 1 || backtestVersions[0].id !== version2.id) {
    throw new Error("백테스트 버전 필터링 실패");
  }
  console.log(`✅ 백테스트 버전 수: ${backtestVersions.length}개`);

  // 자동 저장 버전 정리
  const cleanedVersions = VersionStore.cleanupAutoSavedVersions(project, 1);
  const remainingAutoVersions = cleanedVersions.filter((v) => v.isAutoSaved);
  if (remainingAutoVersions.length > 1) {
    throw new Error("자동 저장 버전 정리 실패");
  }
  console.log(
    `✅ 자동 저장 버전 정리 후: ${remainingAutoVersions.length}개 남음`
  );

  console.log("✅ 버전 유틸리티 함수 테스트 통과");
}

function testVersionNameGeneration(): void {
  console.log("\n🏷️  6. 버전 이름 생성 테스트");
  console.log("-".repeat(30));

  // 빈 배열에서 첫 버전 이름
  const firstVersion = VersionStore.generateVersionName([]);
  if (firstVersion !== "v0.1") {
    throw new Error(`첫 버전 이름 오류: 예상 v0.1, 실제 ${firstVersion}`);
  }
  console.log(`✅ 첫 버전 이름: ${firstVersion}`);

  // 기존 버전들이 있을 때
  const project = createTestProject();
  const strategy1 = createTestStrategy(project.id, "v1.0", []);
  const version1 = VersionStore.createVersion(project, strategy1, {
    description: "v1.0",
  });
  version1.versionName = "v1.0";

  const strategy2 = createTestStrategy(project.id, "v1.5", []);
  const version2 = VersionStore.createVersion(project, strategy2, {
    description: "v1.5",
  });
  version2.versionName = "v1.5";

  const nextVersion = VersionStore.generateVersionName([version1, version2]);
  if (nextVersion !== "v1.6") {
    throw new Error(`다음 버전 이름 오류: 예상 v1.6, 실제 ${nextVersion}`);
  }
  console.log(`✅ 다음 버전 이름: ${nextVersion}`);

  console.log("✅ 버전 이름 생성 테스트 통과");
}

// 모든 테스트 실행
async function runAllVersionTests(): Promise<void> {
  try {
    testVersionCreation();
    testVersionComparison();
    testAutoVersionCreation();
    testVersionRevert();
    await testVersionUtilities();
    testVersionNameGeneration();

    console.log("\n🎉 버전 관리 테스트 완료!");
    console.log("=".repeat(50));
    console.log("✅ 테스트 커버리지:");
    console.log("   📝 버전 생성 및 관리");
    console.log("   🔍 버전 간 비교 및 변경사항 추적");
    console.log("   🤖 자동 버전 생성 로직");
    console.log("   ↩️  버전 되돌리기 기능");
    console.log("   🛠️  유틸리티 함수들");
    console.log("   🏷️  버전 이름 생성 알고리즘");
    console.log("");
    console.log("🚀 모든 버전 관리 기능이 정상적으로 동작합니다!");
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    process.exit(1);
  }
}

// 테스트 실행
await runAllVersionTests();
