import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { V6Workspace } from "./V6Workspace";
import "../../../packages/workspace-core/src/design-tokens.css";
import "./v6-workspace.css";

const ClassicApp = lazy(() => import("./ClassicApp"));

function RootApp() {
  const classicMode = new URLSearchParams(window.location.search).get("classic") === "1";

  if (classicMode) {
    return (
      <Suspense fallback={<div className="route-loading" role="status">正在载入经典控制台…</div>}>
        <ClassicApp />
        <a className="classic-return" href={import.meta.env.BASE_URL} aria-label="返回 v6 工作台">返回 v6 工作台</a>
      </Suspense>
    );
  }

  return <V6Workspace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
