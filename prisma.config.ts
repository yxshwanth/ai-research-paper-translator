// Load .env.local first (Next.js convention), then .env
import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";

const root = path.resolve(process.cwd());
dotenv.config({ path: path.join(root, ".env.local"), override: true });
dotenv.config({ path: path.join(root, ".env"), override: true });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
