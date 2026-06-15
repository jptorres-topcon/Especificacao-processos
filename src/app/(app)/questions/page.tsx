"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from "lucide-react";

export default function QuestionsPage() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: areas = [] } = trpc.questions.areas.useQuery();
  const { data: questions = [], isLoading } = trpc.questions.list.useQuery({
    area: selectedArea ?? undefined,
    activePP: true,
  });

  const filtered = questions.filter(
    (q) =>
      !search ||
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Questionário</h1>
        <p className="text-muted-foreground">Perguntas ativas para levantamento PP</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedArea(null)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            !selectedArea ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
          }`}
        >
          Todas as áreas
        </button>
        {areas.map((area: string) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area === selectedArea ? null : area)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              selectedArea === area ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar pergunta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{q.area}</Badge>
                  {q.subArea && <Badge variant="secondary">{q.subArea}</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">#{q.order}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <CardTitle className="text-sm font-medium leading-snug">{q.text}</CardTitle>
                {q.suggestedParam && (
                  <p className="text-xs text-muted-foreground">
                    Parâmetro sugerido: {q.suggestedParam}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
