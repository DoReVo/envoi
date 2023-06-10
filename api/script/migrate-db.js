import { execSync } from "child_process";

import "dotenv/config";

async function applyMigration() {
  console.log(execSync("prisma migrate deploy").toString());
}

await applyMigration();
