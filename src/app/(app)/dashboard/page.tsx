import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HelpCircle, ClipboardList, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [clientCount, questionCount, sessionCount, finalizedCount] = await Promise.all([
    prisma.client.count(),
    prisma.question.count({ where: { activePP: true } }),
    prisma.specSession.count(),
    prisma.specSession.count({ where: { status: "FINALIZED" } }),
  ]);

  const recentSessions = await prisma.specSession.findMany({
    take: 5,
    orderBy: { startedAt: "desc" },
    include: {
      client: { select: { name: true, size: true } },
      createdBy: { select: { name: true } },
    },
  });

  const stats = [
    { label: "Clientes cadastrados", value: clientCount, icon: Users, color: "text-blue-600" },
    { label: "Perguntas ativas", value: questionCount, icon: HelpCircle, color: "text-purple-600" },
    { label: "Sessões totais", value: sessionCount, icon: ClipboardList, color: "text-amber-600" },
    { label: "Sessões finalizadas", value: finalizedCount, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {session?.user?.name?.split(" ")[0]}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessões recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sessão iniciada.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{s.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {s.createdBy.name} · {s.client.size}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      s.status === "FINALIZED"
                        ? "bg-green-100 text-green-700"
                        : s.status === "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.status === "FINALIZED"
                      ? "Finalizada"
                      : s.status === "IN_PROGRESS"
                      ? "Em andamento"
                      : "Rascunho"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
