"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error");

  const messages: Record<string, string> = {
    AccessDenied: "Acesso negado. Apenas emails @topconsuite.com podem acessar esta plataforma.",
    Configuration: "Erro de configuração do servidor. Contate o administrador.",
    Default: "Ocorreu um erro durante o login.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Erro de autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {messages[error ?? "Default"] ?? messages.Default}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/signin">Tentar novamente</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
