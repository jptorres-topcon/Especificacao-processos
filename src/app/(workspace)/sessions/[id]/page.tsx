"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Constants ──────────────────────────────────────────────

const AREAS = [
  "CUSTO",
  "TECNOLOGIA",
  "COMERCIAL",
  "CRÉDITO",
  "PROGRAMAÇÃO",
  "EXPEDIÇÃO",
  "FATURAMENTO",
  "FINANCEIRO",
  "COMPRAS",
  "PARÂMETROS",
];

const STATUS_CONFIG = {
  DRAFT: { label: "Rascunho", bg: "bg-gray-100", text: "text-gray-600" },
  IN_PROGRESS: { label: "Em andamento", bg: "bg-amber-100", text: "text-amber-700" },
  FINALIZED: { label: "Finalizada", bg: "bg-green-100", text: "text-green-700" },
};

// ─── Types ──────────────────────────────────────────────────

type AnswerFields = {
  asIs: string;
  toBe: string;
  parameters: string;
  observations: string;
};

type AnswersMap = Record<string, AnswerFields>;

const EMPTY_ANSWER: AnswerFields = { asIs: "", toBe: "", parameters: "", observations: "" };

// ─── Page ───────────────────────────────────────────────────

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: authSession } = useSession();

  const [selectedArea, setSelectedArea] = useState(AREAS[0]);
  const [answersMap, setAnswersMap] = useState<AnswersMap>({});
  const [initialized, setInitialized] = useState(false);
  const [savingQid, setSavingQid] = useState<string | null>(null);

  const answersRef = useRef<AnswersMap>({});
  answersRef.current = answersMap;

  const { data: session, isLoading: loadingSession } = trpc.sessions.getById.useQuery({ id });
  const { data: allQuestions = [], isLoading: loadingQuestions } = trpc.questions.list.useQuery(
    { activePP: true }
  );

  const utils = trpc.useUtils();
  const saveAnswer = trpc.sessions.saveAnswer.useMutation();
  const finalize = trpc.sessions.finalize.useMutation({
    onSuccess: () => utils.sessions.getById.invalidate({ id }),
  });

  // Initialise local state once session loads
  useEffect(() => {
    if (session && !initialized) {
      const map: AnswersMap = {};
      for (const answer of session.answers) {
        map[answer.questionId] = {
          asIs: answer.asIs ?? "",
          toBe: answer.toBe ?? "",
          parameters: answer.parameters ?? "",
          observations: answer.observations ?? "",
        };
      }
      setAnswersMap(map);
      setInitialized(true);
    }
  }, [session, initialized]);

  // Derived data
  const areaQuestions = allQuestions
    .filter((q) => q.area === selectedArea)
    .sort((a, b) => a.order - b.order);

  function getAreaProgress(area: string) {
    const qs = allQuestions.filter((q) => q.area === area);
    const answered = qs.filter((q) => {
      const a = answersRef.current[q.id];
      return a && (a.asIs || a.toBe || a.parameters || a.observations);
    }).length;
    return { answered, total: qs.length };
  }

  const isFinalized = session?.status === "FINALIZED";

  const canFinalize =
    initialized &&
    !isFinalized &&
    AREAS.every((area) => getAreaProgress(area).answered > 0);

  // Field change handler
  const handleFieldChange = useCallback(
    (questionId: string, field: keyof AnswerFields, value: string) => {
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: { ...(prev[questionId] ?? EMPTY_ANSWER), [field]: value },
      }));
    },
    []
  );

  // Auto-save on blur
  const handleBlur = useCallback(
    async (questionId: string) => {
      const fields = answersRef.current[questionId];
      if (!fields) return;
      setSavingQid(questionId);
      try {
        await saveAnswer.mutateAsync({
          sessionId: id,
          questionId,
          asIs: fields.asIs || undefined,
          toBe: fields.toBe || undefined,
          parameters: fields.parameters || undefined,
          observations: fields.observations || undefined,
        });
      } finally {
        setTimeout(
          () => setSavingQid((cur) => (cur === questionId ? null : cur)),
          2000
        );
      }
    },
    [id, saveAnswer]
  );

  // ─── Loading / Error states ──────────────────────────────

  if (loadingSession || loadingQuestions) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Carregando sessão…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Sessão não encontrada.</p>
      </div>
    );
  }

  const status = STATUS_CONFIG[session.status];

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* ═══════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════ */}
      <aside
        className="flex w-[260px] flex-shrink-0 flex-col border-r bg-white"
        style={{ borderColor: "#e2e8f0" }}
      >
        {/* Logo */}
        <div
          className="flex h-14 items-center gap-3 border-b px-4"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#E8821A", color: "#003166" }}
          >
            TC
          </div>
          <span className="text-sm font-bold" style={{ color: "#003166" }}>
            Topcon PP Spec
          </span>
        </div>

        {/* Client + status */}
        <div
          className="border-b px-4 py-3"
          style={{ borderColor: "#e2e8f0" }}
        >
          <p className="truncate text-sm font-semibold text-gray-800">
            {session.client.name}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        {/* Area list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {AREAS.map((area) => {
            const { answered, total } = getAreaProgress(area);
            const active = area === selectedArea;
            const done = answered > 0;

            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? "#E8821A" : "transparent",
                  color: active ? "#fff" : "#374151",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#fff7ed";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {/* Progress indicator */}
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: active
                      ? "rgba(255,255,255,0.25)"
                      : done
                      ? "#22c55e"
                      : "#e5e7eb",
                    color: active ? "#fff" : done ? "#fff" : "#9ca3af",
                  }}
                >
                  {done ? "✓" : "○"}
                </span>

                <span className="flex-1 truncate">{area}</span>

                {total > 0 && (
                  <span
                    className="text-xs"
                    style={{
                      color: active ? "rgba(255,255,255,0.7)" : "#9ca3af",
                    }}
                  >
                    {answered}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="border-t px-4 py-4 space-y-3"
          style={{ borderColor: "#e2e8f0" }}
        >
          <Link
            href="/sessions"
            className="block text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Voltar às sessões
          </Link>

          {!isFinalized && (
            <button
              disabled={!canFinalize || finalize.isPending}
              onClick={() => finalize.mutate({ id })}
              className="w-full rounded-lg py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: canFinalize ? "#16a34a" : "#6b7280",
              }}
            >
              {finalize.isPending ? "Finalizando…" : "Finalizar Especificação"}
            </button>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-6"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-800">{session.client.name}</span>
            <span className="text-gray-300">·</span>
            <span className="font-medium" style={{ color: "#1E6AB4" }}>
              {selectedArea}
            </span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled
              title="Disponível após finalizar"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 opacity-50 cursor-not-allowed"
            >
              Exportar PDF
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#003166" }}
              title={authSession?.user?.name ?? ""}
            >
              {authSession?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          </div>
        </header>

        {/* Question cards */}
        <main className="flex-1 overflow-y-auto p-6">
          {areaQuestions.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
              Nenhuma pergunta cadastrada para esta área.
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {areaQuestions.map((question) => {
                const fields = answersMap[question.id] ?? EMPTY_ANSWER;
                const saving = savingQid === question.id;

                return (
                  <div
                    key={question.id}
                    className="overflow-hidden rounded-xl border bg-white shadow-sm"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    {/* Card title */}
                    <div
                      className="flex items-center justify-between border-b px-5 py-3"
                      style={{ backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }}
                    >
                      <p className="text-sm font-semibold leading-snug" style={{ color: "#003166" }}>
                        {question.order}. {question.text}
                      </p>
                      {saving && (
                        <span className="ml-4 flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                          Salvando…
                        </span>
                      )}
                    </div>

                    {/* 2 × 2 grid */}
                    <div className="grid grid-cols-2" style={{ minHeight: 280 }}>
                      <Quadrant
                        label="AS IS — Como é hoje"
                        accentColor="#1E6AB4"
                        value={fields.asIs}
                        disabled={isFinalized}
                        onChange={(v) => handleFieldChange(question.id, "asIs", v)}
                        onBlur={() => handleBlur(question.id)}
                        borderRight
                        borderBottom
                      />
                      <Quadrant
                        label="TO BE — Como será no Topcon"
                        accentColor="#16a34a"
                        value={fields.toBe}
                        disabled={isFinalized}
                        onChange={(v) => handleFieldChange(question.id, "toBe", v)}
                        onBlur={() => handleBlur(question.id)}
                        showAiButton
                        borderBottom
                      />
                      <Quadrant
                        label="Parâmetros Relevantes"
                        accentColor="#7c3aed"
                        value={fields.parameters}
                        disabled={isFinalized}
                        onChange={(v) => handleFieldChange(question.id, "parameters", v)}
                        onBlur={() => handleBlur(question.id)}
                        borderRight
                      />
                      <Quadrant
                        label="Observações / GAPs"
                        accentColor="#d97706"
                        value={fields.observations}
                        disabled={isFinalized}
                        onChange={(v) => handleFieldChange(question.id, "observations", v)}
                        onBlur={() => handleBlur(question.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Quadrant sub-component ─────────────────────────────────

type QuadrantProps = {
  label: string;
  accentColor: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  showAiButton?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
};

function Quadrant({
  label,
  accentColor,
  value,
  disabled,
  onChange,
  onBlur,
  showAiButton,
  borderRight,
  borderBottom,
}: QuadrantProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        borderRight: borderRight ? "1px solid #e2e8f0" : undefined,
        borderBottom: borderBottom ? "1px solid #e2e8f0" : undefined,
      }}
    >
      {/* Label row */}
      <div
        className="flex items-center justify-between border-l-[3px] px-3 py-2"
        style={{
          borderLeftColor: accentColor,
          backgroundColor: `${accentColor}14`,
        }}
      >
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          {label}
        </span>
        {showAiButton && (
          <button
            disabled
            title="Em breve"
            className="rounded px-2 py-0.5 text-[10px] font-semibold text-white opacity-50 cursor-not-allowed"
            style={{ backgroundColor: "#E8821A" }}
          >
            💡 Sugerir com IA
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={disabled ? "" : "Digite aqui…"}
        className="flex-1 resize-none bg-white p-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
        style={{ minHeight: 100 }}
        onFocus={(e) => {
          if (!disabled) e.currentTarget.style.boxShadow = `inset 0 0 0 1.5px ${accentColor}`;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
