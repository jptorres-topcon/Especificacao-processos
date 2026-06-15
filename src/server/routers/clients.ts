import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  size: z.enum(["PP", "PM", "PG"]),
});

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.client.findMany({
        where: input?.search
          ? { name: { contains: input.search, mode: "insensitive" } }
          : undefined,
        include: { createdBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: { name: true, email: true } },
          specSessions: {
            include: { createdBy: { select: { name: true } } },
            orderBy: { startedAt: "desc" },
          },
        },
      });
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      return client;
    }),

  create: protectedProcedure.input(clientSchema).mutation(async ({ ctx, input }) => {
    const client = await ctx.prisma.client.create({
      data: { ...input, createdById: ctx.session.user.id },
    });
    await ctx.prisma.auditLog.create({
      data: {
        userId: ctx.session.user.id,
        action: "CREATE",
        entityType: "Client",
        entityId: client.id,
        metadata: { name: client.name },
      },
    });
    return client;
  }),

  update: adminProcedure
    .input(clientSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.client.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.client.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
