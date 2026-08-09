import React from "react";
import { renderToString } from "react-dom/server";
import MainSite from "./components/MainSite";

export function renderHome() {
  return renderToString(
    <React.StrictMode>
      <MainSite />
    </React.StrictMode>
  );
}
