import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { runGoogleSheetCvSync } from "@/server/jobs/google-sheet-cv-sync"

const teamRoleZod = z.enum(["admin", "recruiter", "viewer"])
const emailTemplateTypeZod = z.enum([
  "confirmation",
  "interview",
  "rejection",
  "offer",
])

const pipelineStageInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  color: z.string().min(1),
  sortOrder: z.number().int(),
})

export const settingsRouter = createTRPCRouter({
  pipeline: createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.pipelineStage.findMany({
        orderBy: { sortOrder: "asc" },
      })
    }),

    replaceAll: publicProcedure
      .input(z.object({ stages: z.array(pipelineStageInput).min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.$transaction([
          ctx.db.pipelineStage.deleteMany(),
          ctx.db.pipelineStage.createMany({
            data: input.stages.map((s) => ({
              name: s.name,
              color: s.color,
              sortOrder: s.sortOrder,
            })),
          }),
        ])
        return ctx.db.pipelineStage.findMany({
          orderBy: { sortOrder: "asc" },
        })
      }),
  }),

  team: createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.teamMember.findMany({ orderBy: { name: "asc" } })
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: teamRoleZod,
          avatar: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.teamMember.create({
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
            avatar: input.avatar,
          },
        })
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          role: teamRoleZod.optional(),
          avatar: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, name, email, role, avatar } = input
        try {
          return await ctx.db.teamMember.update({
            where: { id },
            data: {
              ...(name !== undefined ? { name } : {}),
              ...(email !== undefined ? { email } : {}),
              ...(role !== undefined ? { role } : {}),
              ...(avatar !== undefined ? { avatar } : {}),
            },
          })
        } catch {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Membro não encontrado",
          })
        }
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.teamMember.delete({ where: { id: input.id } })
        } catch {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Membro não encontrado",
          })
        }
        return { ok: true as const }
      }),
  }),

  emailTemplate: createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.emailTemplate.findMany({ orderBy: { name: "asc" } })
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          subject: z.string().min(1),
          type: emailTemplateTypeZod,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.emailTemplate.create({ data: input })
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.emailTemplate.delete({ where: { id: input.id } })
        } catch {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template não encontrado",
          })
        }
        return { ok: true as const }
      }),
  }),

  company: createTRPCRouter({
    get: publicProcedure.query(async ({ ctx }) => {
      const row = await ctx.db.companySettings.findUnique({
        where: { id: "default" },
      })
      if (!row) {
        return {
          id: "default" as const,
          companyName: "TATICCA",
          companyEmail: "recrutamento@tatica.pt",
          companyWebsite: "https://tatica.pt",
        }
      }
      return row
    }),

    upsert: publicProcedure
      .input(
        z.object({
          companyName: z.string().min(1),
          companyEmail: z.string().email(),
          companyWebsite: z.string().url(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.companySettings.upsert({
          where: { id: "default" },
          create: { id: "default", ...input },
          update: input,
        })
      }),
  }),

  admin: createTRPCRouter({
    syncGoogleSheet: publicProcedure.mutation(async () => {
      try {
        return await runGoogleSheetCvSync()
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message })
      }
    }),
  }),

  notifications: createTRPCRouter({
    get: publicProcedure.query(async ({ ctx }) => {
      const row = await ctx.db.notificationSettings.findUnique({
        where: { id: "default" },
      })
      if (!row) {
        return {
          id: "default" as const,
          newCandidate: true,
          statusChange: true,
          interview: true,
          dailyDigest: false,
          weeklyReport: true,
        }
      }
      return row
    }),

    upsert: publicProcedure
      .input(
        z.object({
          newCandidate: z.boolean(),
          statusChange: z.boolean(),
          interview: z.boolean(),
          dailyDigest: z.boolean(),
          weeklyReport: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.notificationSettings.upsert({
          where: { id: "default" },
          create: { id: "default", ...input },
          update: input,
        })
      }),
  }),
})
