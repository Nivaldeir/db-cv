"use client"

import Image from "next/image"
import { useState } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Spinner } from "@/components/ui/spinner"
import { useZodForm } from "@/hooks/use-zod-form"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Email inválido"),
  password: z.string().min(1, "Palavra-passe obrigatória"),
})

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useZodForm(loginSchema, {
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors("root")
    setIsLoading(true)

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      form.setError("root", {
        type: "manual",
        message: "Email ou palavra-passe incorretos",
      })
    } else {
      router.push("/")
      router.refresh()
    }

    setIsLoading(false)
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center items-center gap-3">
          <div className="bg-white rounded-md px-4 py-3 shadow-sm">
            <Image
              src="/logo.png"
              alt="Taticca"
              width={220}
              height={86}
              className="object-contain h-auto w-55"
              priority
            />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Banco CV
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Aceda à plataforma de gestão de currículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu.email@tatica.pt"
                        autoComplete="email"
                        className="bg-secondary border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Palavra-passe</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="bg-secondary border-border pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Esconder" : "Mostrar"} palavra-passe
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.message && (
                <p className="text-sm text-destructive text-center">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
