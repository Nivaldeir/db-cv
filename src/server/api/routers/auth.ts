import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"

export const authRouter = createTRPCRouter({
  users: createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Nome obrigatório"),
          email: z.string().email("Email inválido"),
          password: z.string().min(8, "Mínimo 8 caracteres"),
          role: z.enum(["admin", "recruiter", "viewer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.user.findUnique({ where: { email: input.email } })
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email já em uso" })

        const hashed = await bcrypt.hash(input.password, 12)
        return ctx.db.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashed,
            role: input.role,
            mustChangePassword: true,
          },
          select: { id: true, name: true, email: true, role: true },
        })
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.user.delete({ where: { id: input.id } })
        return { success: true }
      }),
  }),

  changePassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        newPassword: z.string().min(8, "Mínimo 8 caracteres"),
        confirmPassword: z.string(),
      }).refine((d) => d.newPassword === d.confirmPassword, {
        message: "As palavras-passe não coincidem",
        path: ["confirmPassword"],
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { email: input.email } })
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Utilizador não encontrado" })

      const hashed = await bcrypt.hash(input.newPassword, 12)
      await ctx.db.user.update({
        where: { email: input.email },
        data: { password: hashed, mustChangePassword: false },
      })

      return { success: true }
    }),
})
