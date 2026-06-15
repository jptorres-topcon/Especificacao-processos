import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const sessionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ clientId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.specSession.findMany({
        where: input?.clientId ? { clientId: input.clientId } : undefined,
        include: {
          client: { select: { name: true, size: true } },
          createdBy: { select: { name: true } },
          _count: { select: { answers: true } },
        },
        orderBy: { startedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.specSession.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          createdBy: { select: { name: true, email: true } },
          finalizedBy: { select: { name: true } },
          answers: {
            include: {
              question: true,
              answeredBy: { select: { name: true } },
            },
            orderBy: { answeredAt: "asc" },
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  create: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.specSession.create({
        data: {
          clientId: input.clientId,
          createdById: ctx.session.user.id,
          status: "IN_PROGRESS",
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "CREATE",
          entityType: "SpecSession",
          entityId: session.id,
        },
      });
      return session;
    }),

  finalize: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.specSession.update({
        where: { id: input.id },
        data: {
          status: "FINALIZED",
          finalizedById: ctx.session.user.id,
          finalizedAt: new Date(),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "FINALIZE",
          entityType: "SpecSession",
          entityId: session.id,
        },
      });
      return session;
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        questionId: z.string(),
        asIs: z.string().optional(),
        toBe: z.string().optional(),
        parameters: z.string().optional(),
        observations: z.string().optional(),
        aiSuggestionUsed: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, questionId, ...data } = input;
      return ctx.prisma.answer.upsert({
        where: { sessionId_questionId: { sessionId, questionId } },
        create: {
          sessionId,
          questionId,
          ...data,
          answeredById: ctx.session.user.id,
        },
        update: { ...data, answeredById: ctx.session.user.id },
      });
    }),
});
