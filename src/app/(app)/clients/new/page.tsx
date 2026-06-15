"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCNPJ } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", cnpj: "", size: "PP" as "PP" | "PM" | "PG" });
  const [error, setError] = useState("");

  const createClient = trpc.clients.create.useMutation({
    onSuccess: (data) => router.push(`/clients/${data.id}`),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createClient.mutate({ ...form, cnpj: form.cnpj.replace(/\D/g, "") });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Razão social</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                required
                value={formatCNPJ(form.cnpj)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cnpj: e.target.value.replace(/\D/g, "") }))
                }
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Porte</Label>
              <div className="flex gap-2">
                {(["PP", "PM", "PG"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, size }))}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                      form.size === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">PP = Pequeno · PM = Médio · PG = Grande</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={createClient.isPending}>
              {createClient.isPending ? "Salvando..." : "Cadastrar cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
