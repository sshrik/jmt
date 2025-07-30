import { test as base, expect } from "@playwright/test";
import { DashboardPage, ProjectEditPage } from "./types";

// 커스텀 픽스처 정의
type TestFixtures = {
  dashboardPage: DashboardPage;
  projectEditPage: ProjectEditPage;
};

// 확장된 테스트 객체
export const test = base.extend<TestFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  projectEditPage: async ({ page }, use) => {
    const projectEditPage = new ProjectEditPage(page);
    await use(projectEditPage);
  },
});

export { expect };
