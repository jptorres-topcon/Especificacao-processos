"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  DRAFT: { label: "Rascunho", class: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  FINALIZED: { label: "Finalizada", class: "bg-green-100 text-green-700" },
};

export default function SessionsPage() {
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessões</h1>
        <p className="text-muted-foreground">Levantamentos de especificação de processo</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : sessions?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma sessão iniciada</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/clients">Iniciar via um cliente</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions?.map((s) => {
            const status = statusConfig[s.status];
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.client.name}</CardTitle>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {s.client.size} · Iniciada por {s.createdBy.name} · {formatDate(s.startedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">{s._count.answers} respostas</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
