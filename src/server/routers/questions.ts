import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";

export const questionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        area: z.string().optional(),
        activePP: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.question.findMany({
        where: {
          ...(input?.area ? { area: input.area } : {}),
          ...(input?.activePP !== undefined ? { activePP: input.activePP } : {}),
        },
        orderBy: [{ area: "asc" }, { order: "asc" }],
      });
    }),

  areas: protectedProcedure.query(async ({ ctx }) => {
    const questions = await ctx.prisma.question.findMany({
      select: { area: true },
      distinct: ["area" as const],
      orderBy: { area: "asc" },
    });
    return questions.map((q: { area: string }) => q.area);
  }),

  create: adminProcedure
    .input(
      z.object({
        area: z.string().min(1),
        subArea: z.string().optional(),
        module: z.string().optional(),
        order: z.number().int().min(1),
        text: z.string().min(1),
        suggestedParam: z.string().optional(),
        activePP: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.question.create({ data: input });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        area: z.string().min(1).optional(),
        subArea: z.string().optional(),
        module: z.string().optional(),
        order: z.number().int().min(1).optional(),
        text: z.string().min(1).optional(),
        suggestedParam: z.string().optional(),
        activePP: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.question.update({ where: { id }, data });
    }),
});
