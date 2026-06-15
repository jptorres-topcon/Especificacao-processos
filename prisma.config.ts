import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL is used for migrations (bypasses the connection pooler).
// DATABASE_URL is the pooler URL used at runtime by PrismaClient.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
