import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "virtual:uno.css";
import "./index.css";
import "@unocss/reset/tailwind-compat.css";

const queryClient = new QueryClient();

import { GlobalToastRegion } from "./components/Toast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
      <GlobalToastRegion />
    </QueryClientProvider>
  </React.StrictMode>
);
