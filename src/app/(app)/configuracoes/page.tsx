"use client"

import { useState } from "react"
import {
  Users,
  GitBranch,
  Mail,
  Bell,
  Building,
  Link,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Save,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useZodForm } from "@/hooks/use-zod-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  type PipelineStage,
  type EmailTemplate,
  defaultPipeline,
  defaultTemplates,
  colorOptions,
} from "./_utils/settings"
import { trpc } from "@/trpc/react"
import { toast } from "sonner"

const createUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["admin", "recruiter", "viewer"]),
})

const addPipelineStageSchema = z.object({
  name: z.string().min(1, "Indique o nome da etapa").max(120),
})

const companyFormSchema = z.object({
  companyName: z.string().min(1, "Nome obrigatório"),
  companyEmail: z.string().min(1, "Email obrigatório").email("Email inválido"),
  companyWebsite: z.string().min(1, "Website obrigatório").url("URL inválida"),
})

const notificationsFormSchema = z.object({
  newCandidate: z.boolean(),
  statusChange: z.boolean(),
  interview: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyReport: z.boolean(),
})

export default function ConfiguracoesPage() {
  const [pipeline, setPipeline] = useState<PipelineStage[]>(defaultPipeline)
  const [templates] = useState<EmailTemplate[]>(defaultTemplates)
  const [openCreateUser, setOpenCreateUser] = useState(false)

  const utils = trpc.useUtils()
  const { data: users = [], isLoading: usersLoading } = trpc.auth.users.list.useQuery()
  const createUser = trpc.auth.users.create.useMutation({
    onSuccess: () => {
      toast.success("Utilizador criado com sucesso")
      void utils.auth.users.list.invalidate()
      setOpenCreateUser(false)
      createUserForm.reset()
    },
    onError: (e) => toast.error(e.message),
  })
  const deleteUser = trpc.auth.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Utilizador removido")
      void utils.auth.users.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const createUserForm = useZodForm(createUserSchema, {
    defaultValues: { name: "", email: "", password: "", role: "recruiter" },
  })

  const pipelineStageForm = useZodForm(addPipelineStageSchema, {
    defaultValues: { name: "" },
  })

  const companyForm = useZodForm(companyFormSchema, {
    defaultValues: {
      companyName: "TATICCA",
      companyEmail: "recrutamento@tatica.pt",
      companyWebsite: "https://tatica.pt",
    },
  })

  const notificationsForm = useZodForm(notificationsFormSchema, {
    defaultValues: {
      newCandidate: true,
      statusChange: true,
      interview: true,
      dailyDigest: false,
      weeklyReport: true,
    },
  })

  const onAddPipelineStage = (values: z.infer<typeof addPipelineStageSchema>) => {
    setPipeline((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: values.name.trim(),
        color: "bg-gray-500",
        order: prev.length + 1,
      },
    ])
    pipelineStageForm.reset()
  }

  const deleteStage = (id: string) => {
    setPipeline(pipeline.filter((s) => s.id !== id))
  }

  const updateStageColor = (id: string, color: string) => {
    setPipeline(pipeline.map((s) => (s.id === id ? { ...s, color } : s)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize o sistema de acordo com as necessidades da sua empresa
        </p>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pipeline" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipa
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          {/* <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger> */}
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Recrutamento</CardTitle>
              <CardDescription>
                Configure as etapas do processo de recrutamento. Arraste para reordenar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {pipeline.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg group"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="flex-1 font-medium text-foreground">{stage.name}</span>
                    <Select
                      value={stage.color}
                      onValueChange={(color) => updateStageColor(stage.id, color)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.value}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => deleteStage(stage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Form {...pipelineStageForm}>
                <form
                  onSubmit={pipelineStageForm.handleSubmit(onAddPipelineStage)}
                  className="flex flex-col gap-2 pt-4 border-t border-border sm:flex-row sm:items-start"
                >
                  <FormField
                    control={pipelineStageForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormControl>
                          <Input
                            placeholder="Nome da nova etapa..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Utilizadores</CardTitle>
                  <CardDescription>
                    Gerencie os utilizadores com acesso ao sistema
                  </CardDescription>
                </div>
                <Button onClick={() => setOpenCreateUser(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Utilizador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersLoading && (
                  <p className="text-sm text-muted-foreground">A carregar...</p>
                )}
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(user.name ?? user.email)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {user.role === "admin" && "Administrador"}
                      {user.role === "recruiter" && "Recrutador"}
                      {user.role === "viewer" && "Visualizador"}
                      {!["admin", "recruiter", "viewer"].includes(user.role ?? "") && user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => deleteUser.mutate({ id: user.id })}
                      disabled={deleteUser.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Níveis de Permissão</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Administrador:</span> Acesso
                    total, incluindo configurações
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Recrutador:</span> Gerenciar
                    candidatos, agendar entrevistas
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Visualizador:</span> Apenas
                    visualização de candidatos
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Dialog open={openCreateUser} onOpenChange={setOpenCreateUser}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Utilizador</DialogTitle>
                <DialogDescription>
                  O utilizador receberá acesso ao sistema e será obrigado a alterar a palavra-passe no primeiro login.
                </DialogDescription>
              </DialogHeader>
              <Form {...createUserForm}>
                <form
                  onSubmit={createUserForm.handleSubmit((values) => createUser.mutate(values))}
                  className="space-y-4"
                >
                  <FormField
                    control={createUserForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Palavra-passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perfil</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="recruiter">Recrutador</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenCreateUser(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUser.isPending}>
                      {createUser.isPending ? "A criar..." : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de Email</CardTitle>
                  <CardDescription>
                    Configure os templates para comunicação automática com candidatos
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{template.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {template.type === "confirmation" && "Confirmação"}
                          {template.type === "interview" && "Entrevista"}
                          {template.type === "rejection" && "Rejeição"}
                          {template.type === "offer" && "Proposta"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Variáveis Disponíveis</h4>
                <div className="flex flex-wrap gap-2 text-sm">
                  <code className="px-2 py-1 bg-secondary rounded">{"{{nome}}"}</code>
                  <code className="px-2 py-1 bg-secondary rounded">{"{{cargo}}"}</code>
                  <code className="px-2 py-1 bg-secondary rounded">{"{{empresa}}"}</code>
                  <code className="px-2 py-1 bg-secondary rounded">{"{{data}}"}</code>
                  <code className="px-2 py-1 bg-secondary rounded">{"{{hora}}"}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informações básicas que aparecem nas comunicações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form
                  onSubmit={companyForm.handleSubmit(() => undefined)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input id="company-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Recrutamento</FormLabel>
                          <FormControl>
                            <Input id="company-email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input id="company-website" type="url" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Alterações
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure quando e como deseja receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form className="space-y-4">
                  <FormField
                    control={notificationsForm.control}
                    name="newCandidate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg bg-secondary/50 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Nova candidatura</FormLabel>
                          <FormDescription>
                            Notificar quando um novo candidato se candidatar
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="statusChange"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg bg-secondary/50 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Mudança de status</FormLabel>
                          <FormDescription>
                            Notificar quando o status de um candidato mudar
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="interview"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg bg-secondary/50 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Lembrete de entrevista</FormLabel>
                          <FormDescription>
                            Receber lembrete 1h antes de entrevistas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="dailyDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg bg-secondary/50 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Resumo diário</FormLabel>
                          <FormDescription>
                            Receber um resumo diário às 9:00
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="weeklyReport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg bg-secondary/50 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Relatório semanal</FormLabel>
                          <FormDescription>
                            Receber relatório semanal às segundas-feiras
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte o Banco CV com outras ferramentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">in</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">LinkedIn</p>
                      <p className="text-xs text-muted-foreground">Importar candidatos</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Conectar
                  </Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#2684FF] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ID</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Indeed</p>
                      <p className="text-xs text-muted-foreground">Publicar vagas</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Conectar
                  </Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Slack</p>
                      <p className="text-xs text-muted-foreground">Notificações</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary mb-3">Conectado</Badge>
                  <Button variant="outline" className="w-full">
                    Configurar
                  </Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#4285F4] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Google Calendar</p>
                      <p className="text-xs text-muted-foreground">Sincronizar entrevistas</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary mb-3">Conectado</Badge>
                  <Button variant="outline" className="w-full">
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin" className="mt-6">
          <AdminTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminTab() {
  const syncMutation = trpc.settings.admin.syncGoogleSheet.useMutation({
    onSuccess: (result) => {
      const msg = `Sincronização concluída — ${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados`
      if (result.errors.length > 0) {
        toast.warning(msg)
      } else {
        toast.success(msg)
      }
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sincronização Google Sheets</CardTitle>
          <CardDescription>
            Importa CVs da folha de cálculo configurada e processa com IA. Normalmente corre
            automaticamente, mas pode ser acionado manualmente aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "A sincronizar..." : "Correr Sincronização Agora"}
            </Button>
          </div>

          {syncMutation.data && (
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-3">
              <p className="font-medium text-foreground">Último resultado:</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-foreground">{syncMutation.data.fetchedRows}</p>
                  <p className="text-xs text-muted-foreground">linhas lidas</p>
                </div>
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-green-600">{syncMutation.data.created}</p>
                  <p className="text-xs text-muted-foreground">criados</p>
                </div>
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-blue-600">{syncMutation.data.updated}</p>
                  <p className="text-xs text-muted-foreground">atualizados</p>
                </div>
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-muted-foreground">{syncMutation.data.skipped}</p>
                  <p className="text-xs text-muted-foreground">ignorados</p>
                </div>
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-green-600">{syncMutation.data.pdfOk}</p>
                  <p className="text-xs text-muted-foreground">PDFs OK</p>
                </div>
                <div className="p-2 bg-background rounded border text-center">
                  <p className="text-lg font-bold text-destructive">{syncMutation.data.pdfFailed}</p>
                  <p className="text-xs text-muted-foreground">PDFs falhados</p>
                </div>
              </div>
              {syncMutation.data.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Erros:</p>
                  {syncMutation.data.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded">{e}</p>
                  ))}
                </div>
              )}
              {syncMutation.data.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-yellow-600">Avisos ({syncMutation.data.warnings.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {syncMutation.data.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-2 rounded">{w}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
