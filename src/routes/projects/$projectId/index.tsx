import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();

  console.log("🔍 ProjectDetail 컴포넌트 렌더링됨");
  console.log("📍 현재 projectId:", projectId);

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f0f0",
        minHeight: "400px",
      }}
    >
      <h1 style={{ color: "red" }}>🎯 프로젝트 상세보기 페이지 로드됨!</h1>
      <h2>프로젝트 ID: {projectId}</h2>
      <p>이 페이지가 보인다면 라우팅이 동작하고 있습니다.</p>
    </div>
  );
}
