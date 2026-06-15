import { type DefaultSession } from "next-auth";

type UserRole = "ADMIN" | "CONSULTANT" | "VIEWER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}
