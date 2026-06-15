import { createTRPCRouter } from "./trpc";
import { clientsRouter } from "./routers/clients";
import { questionsRouter } from "./routers/questions";
import { sessionsRouter } from "./routers/sessions";

export const appRouter = createTRPCRouter({
  clients: clientsRouter,
  questions: questionsRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;
