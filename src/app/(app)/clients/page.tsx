"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = trpc.clients.list.useQuery({ search: search || undefined });

  const sizeLabel = { PP: "Pequeno Porte", PM: "Médio Porte", PG: "Grande Porte" };
  const sizeVariant: Record<string, "default" | "secondary" | "outline"> = {
    PP: "secondary",
    PM: "default",
    PG: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : clients?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/clients/new">Cadastrar primeiro cliente</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients?.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{client.name}</CardTitle>
                    <Badge variant={sizeVariant[client.size]}>{sizeLabel[client.size]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm text-muted-foreground">{client.cnpj}</p>
                  <p className="text-xs text-muted-foreground">
                    Criado por {client.createdBy.name} · {formatDate(client.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
