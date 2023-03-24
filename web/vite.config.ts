import { UserConfigFn, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const configFactory: UserConfigFn = ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: parseInt(env.DEV_SERVER_PORT) || 4100,
    },
    plugins: [react()],
  };
};

export default configFactory;
