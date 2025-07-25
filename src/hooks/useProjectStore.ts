import { useState, useEffect, useCallback } from "react";
import { ProjectStore, PROJECT_CHANGE_EVENT } from "../stores/projectStore";
import type { Project, ProjectSummary } from "../types/project";
import { notifications } from "@mantine/notifications";

export const useProjectStore = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Mock 데이터가 없으면 생성 (첫 실행시)
      let allProjects = ProjectStore.getAllProjects();
      if (allProjects.length === 0) {
        ProjectStore.generateMockData();
        allProjects = ProjectStore.getAllProjects();
      }

      // Project를 ProjectSummary로 변환
      const projectSummaries = allProjects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        lastModified: project.updatedAt,
        totalVersions: project.versions.length,
        latestReturn: project.versions[0]?.backtestResults?.totalReturn,
      }));

      setProjects(projectSummaries);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "프로젝트를 불러오는 중 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (name: string, description: string): Promise<Project> => {
      try {
        if (!name.trim()) {
          throw new Error("프로젝트 이름을 입력해주세요.");
        }

        const newProject = ProjectStore.createProject(name, description);

        notifications.show({
          title: "프로젝트 생성 완료",
          message: `${name} 프로젝트가 성공적으로 생성되었습니다.`,
          color: "green",
        });

        // 이벤트 시스템으로 자동 새로고침되므로 별도 처리 불필요
        return newProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "프로젝트 생성 중 오류가 발생했습니다.";

        notifications.show({
          title: "프로젝트 생성 실패",
          message: errorMessage,
          color: "red",
        });

        throw err;
      }
    },
    []
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      try {
        const project = ProjectStore.getProjectById(projectId);
        const projectName = project?.name || "프로젝트";

        ProjectStore.deleteProject(projectId);

        notifications.show({
          title: "프로젝트 삭제 완료",
          message: `${projectName}이(가) 삭제되었습니다.`,
          color: "orange",
        });

        refreshProjects(); // 목록 새로고침
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "프로젝트 삭제 중 오류가 발생했습니다.";

        notifications.show({
          title: "프로젝트 삭제 실패",
          message: errorMessage,
          color: "red",
        });

        throw err;
      }
    },
    []
  );

  // 컴포넌트 마운트시 프로젝트 목록 로드
  useEffect(() => {
    refreshProjects();
  }, []);

  // 프로젝트 변경사항 감지하여 자동 새로고침
  useEffect(() => {
    const handleProjectsChanged = () => {
      refreshProjects();
    };

    window.addEventListener(PROJECT_CHANGE_EVENT, handleProjectsChanged);

    return () => {
      window.removeEventListener(PROJECT_CHANGE_EVENT, handleProjectsChanged);
    };
  }, []);

  const updateProject = useCallback(
    async (
      projectId: string,
      name: string,
      description: string
    ): Promise<void> => {
      try {
        ProjectStore.updateProject(projectId, { name, description });

        notifications.show({
          title: "프로젝트 수정 완료",
          message: `${name} 프로젝트가 성공적으로 수정되었습니다.`,
          color: "green",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "프로젝트 수정 중 오류가 발생했습니다.";

        notifications.show({
          title: "프로젝트 수정 실패",
          message: errorMessage,
          color: "red",
        });

        throw err;
      }
    },

    []
  );

  return {
    projects,
    loading,
    error,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

// 특정 프로젝트 상세 정보를 위한 훅
export const useProject = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProject = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const projectData = ProjectStore.getProjectById(projectId);
      if (!projectData) {
        throw new Error("프로젝트를 찾을 수 없습니다.");
      }

      setProject(projectData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "프로젝트를 불러오는 중 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      refreshProject();
    }
  }, [projectId, refreshProject]);

  return {
    project,
    loading,
    error,
    refreshProject,
  };
};
