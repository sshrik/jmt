import type { Page, Locator } from "@playwright/test";

// E2E 테스트에서 사용할 커스텀 타입들
export interface TestData {
  projectName: string;
  projectDescription: string;
  versionName: string;
}

export interface ProjectCard {
  name: string;
  description: string;
  rank: number;
  returnRate: number;
}

// 페이지 객체 모델용 기본 클래스
export abstract class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = ""): Promise<void> {
    await this.page.goto(path);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png` });
  }
}

// 대시보드 페이지 객체
export class DashboardPage extends BasePage {
  readonly createProjectButton: Locator;
  readonly projectCards: Locator;

  constructor(page: Page) {
    super(page);
    this.createProjectButton = page.locator("text=새 프로젝트 생성");
    this.projectCards = page.locator('[data-testid="project-card"]');
  }

  async clickCreateProject(): Promise<void> {
    await this.createProjectButton.click();
  }

  async getProjectCount(): Promise<number> {
    return await this.projectCards.count();
  }
}

// 프로젝트 편집 페이지 객체
export class ProjectEditPage extends BasePage {
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly strategyTab: Locator;
  readonly backtestTab: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('input[placeholder*="프로젝트 이름"]');
    this.descriptionInput = page.locator(
      'textarea[placeholder*="프로젝트 설명"]'
    );
    this.saveButton = page.locator("text=새 버전으로 저장");
    this.strategyTab = page.locator("text=투자 전략");
    this.backtestTab = page.locator("text=백테스트");
  }

  async fillProjectInfo(name: string, description: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
  }

  async switchToStrategyTab(): Promise<void> {
    await this.strategyTab.click();
  }

  async switchToBacktestTab(): Promise<void> {
    await this.backtestTab.click();
  }
}
