import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import type { MantineColorScheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "reactflow/dist/style.css";
import "./index.css";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// 테마 설정 함수
const getColorScheme = (): MantineColorScheme => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  if (savedTheme === "system" || !savedTheme) {
    // 시스템 테마 감지
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
};

const theme = createTheme({
  // 필요한 경우 커스텀 테마 설정 추가
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme={getColorScheme()}>
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
);
