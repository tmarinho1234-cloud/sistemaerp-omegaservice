import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Flag, Hammer, PackageCheck, RefreshCw, ThumbsUp } from "lucide-react";
import { dateBr, diffDias, prazoOriginal, prazoVigente, type PedidoResumo } from "@/components/operations";

type Paralisacao = { id: string; inicio: string; fim: string | null; motivo: string; detalhe: string | null; duracao_horas: number | null; conjunto_id: string | null };
type Apontamento = { id: string; inicio: string; fim: string | null; processo: string; quantidade_executada: number; conjunto_id: string | null };
type Reprog = { id: string; tipo: string; data_anterior: string | null; nova_data: string; motivo: string; impacto_dias: number };

const MOTIVOS: Record<string, string> = {
  falta_material: "Falta de material",
  manutencao: "Manutenção",
  absenteismo: "Absenteísmo",
  projeto: "Projeto",
  qualidade: "Qualidade",
  energia: "Energia",
  outros: "Outros",
};
const motivoLabel = (m: string) => MOTIVOS[m] ?? m;

const isoLocal = (value: string) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const hojeIso = () => isoLocal(new Date().toISOString());
const ms = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();

type Marco = {
  id: string;
  data: string;
  titulo: string;
  detalhe: string;
  tone: "primary" | "success" | "warning" | "destructive" | "muted";
  icon: typeof Flag;
  riscado?: string | null;
  badge?: string | null;
};

const TONE: Record<Marco["tone"], { dot: string; text: string; border: string }> = {
  primary: { dot: "bg-primary", text: "text-primary", border: "border-primary/40" },
  success: { dot: "bg-success", text: "text-success", border: "border-success/40" },
  warning: { dot: "bg-warning", text: "text-warning", border: "border-warning/40" },
  destructive: { dot: "bg-destructive", text: "text-destructive", border: "border-destructive/40" },
  muted: { dot: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border" },
};

export function PcpTimeline({ pedido }: { pedido: PedidoResumo }) {
  const pedidoId = pedido.id;

  const { data: paralisacoes = [] } = useQuery({
    queryKey: ["pcp-timeline-paralisacoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("paralisacoes").select("id, inicio, fim, motivo, detalhe, duracao_horas, conjunto_id").eq("pedido_id", pedidoId).order("inicio");
      if (error) throw error;
      return data as unknown as Paralisacao[];
    },
  });

  const { data: apontamentos = [] } = useQuery({
    queryKey: ["pcp-timeline-apontamentos", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("apontamentos_producao").select("id, inicio, fim, processo, quantidade_executada, conjunto_id").eq("pedido_id", pedidoId).order("inicio");
      if (error) throw error;
      return data as unknown as Apontamento[];
    },
  });

  const { data: reprogramacoes = [] } = useQuery({
    queryKey: ["pcp-timeline-reprogramacoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("pcp_reprogramacoes").select("id, tipo, data_anterior, nova_data, motivo, impacto_dias").eq("pedido_id", pedidoId).order("created_at");
      if (error) throw error;
      return data as unknown as Reprog[];
    },
  });

  const { data: conjuntos = [] } = useQuery({
    queryKey: ["pcp-timeline-conjuntos", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("pedido_conjuntos").select("id, tag").eq("pedido_id", pedidoId);
      if (error) throw error;
      return data as unknown as { id: string; tag: string }[];
    },
  });

  const tagDe = useMemo(() => new Map(conjuntos.map((c) => [c.id, c.tag])), [conjuntos]);
  const hoje = hojeIso();

  const marcos = useMemo<Marco[]>(() => {
    const list: Marco[] = [];

    if (pedido.data_aprovacao)
      list.push({ id: "aprovacao", data: pedido.data_aprovacao.slice(0, 10), titulo: "Aprovação", detalhe: `Proposta aprovada em ${dateBr(pedido.data_aprovacao)}`, tone: "primary", icon: ThumbsUp });

    if (pedido.data_chegada_materiais) {
      const original = pedido.data_chegada_materiais_original;
      const atraso = original && original !== pedido.data_chegada_materiais ? diffDias(original, pedido.data_chegada_materiais) : null;
      list.push({
        id: "materiais",
        data: pedido.data_chegada_materiais.slice(0, 10),
        titulo: "Chegada de materiais",
        detalhe: `Previsto original ${dateBr(original)} · atual ${dateBr(pedido.data_chegada_materiais)}`,
        tone: atraso && atraso > 0 ? "warning" : "success",
        icon: PackageCheck,
        riscado: atraso ? dateBr(original) : null,
        badge: atraso ? `${atraso > 0 ? "+" : ""}${atraso} dias` : null,
      });
    }

    for (const r of reprogramacoes) {
      if (r.tipo === "aquisicao")
        list.push({
          id: r.id,
          data: r.nova_data.slice(0, 10),
          titulo: "Reprogramação de aquisição",
          detalhe: `${dateBr(r.data_anterior)} → ${dateBr(r.nova_data)} · ${r.motivo} · impacto ${r.impacto_dias} dias`,
          tone: "warning",
          icon: RefreshCw,
          riscado: dateBr(r.data_anterior),
        });
      else if (r.tipo === "entrega" || r.tipo === "entrega_pedido")
        list.push({
          id: r.id,
          data: r.nova_data.slice(0, 10),
          titulo: "Reprogramação de entrega",
          detalhe: `${dateBr(r.data_anterior)} → ${dateBr(r.nova_data)} · ${r.motivo} · impacto ${r.impacto_dias} dias`,
          tone: "warning",
          icon: RefreshCw,
          riscado: dateBr(r.data_anterior),
        });
    }

    if (pedido.producao_iniciada && pedido.data_inicio_producao)
      list.push({
        id: "inicio",
        data: isoLocal(pedido.data_inicio_producao),
        titulo: "Início da produção",
        detalhe: `Fabricação iniciada em ${dateBr(isoLocal(pedido.data_inicio_producao))}`,
        tone: "primary",
        icon: Hammer,
      });

    // Avanços agrupados por dia
    const porDia = new Map<string, Map<string, number>>();
    const tagsDia = new Map<string, Set<string>>();
    for (const a of apontamentos) {
      const dia = isoLocal(a.inicio);
      const proc = porDia.get(dia) ?? new Map<string, number>();
      proc.set(a.processo, (proc.get(a.processo) ?? 0) + Number(a.quantidade_executada ?? 0));
      porDia.set(dia, proc);
      const tags = tagsDia.get(dia) ?? new Set<string>();
      const tag = a.conjunto_id ? tagDe.get(a.conjunto_id) : null;
      if (tag) tags.add(tag);
      tagsDia.set(dia, tags);
    }
    for (const [dia, procs] of porDia) {
      const resumo = [...procs.entries()].map(([p, q]) => `${p.charAt(0).toUpperCase()}${p.slice(1)}: ${q} un`).join(" · ");
      const tags = [...(tagsDia.get(dia) ?? [])];
      list.push({
        id: `avanco-${dia}`,
        data: dia,
        titulo: "Avanço de produção",
        detalhe: `${resumo}${tags.length ? ` · ${tags.join(", ")}` : ""}`,
        tone: "success",
        icon: CheckCircle2,
        badge: procs.size > 1 ? `${procs.size} processos` : null,
      });
    }

    const entregaOriginal = prazoOriginal(pedido);
    const entregaVigente = prazoVigente(pedido);
    if (entregaVigente)
      list.push({
        id: "entrega",
        data: entregaVigente.slice(0, 10),
        titulo: "Entrega",
        detalhe: pedido.data_entrega_reprogramada ? `Reprogramada para ${dateBr(entregaVigente)} (original ${dateBr(entregaOriginal)})` : `Entrega prevista ${dateBr(entregaVigente)}`,
        tone: "muted",
        icon: Flag,
        riscado: pedido.data_entrega_reprogramada && entregaOriginal !== entregaVigente ? dateBr(entregaOriginal) : null,
      });

    return list.filter((m) => m.data).sort((a, b) => ms(a.data) - ms(b.data));
  }, [pedido, reprogramacoes, apontamentos, tagDe]);

  const faixas = useMemo(
    () =>
      paralisacoes
        .filter((p) => p.inicio)
        .map((p) => ({
          ...p,
          ini: isoLocal(p.inicio),
          fimIso: p.fim ? isoLocal(p.fim) : hoje,
          emAndamento: !p.fim,
        })),
    [paralisacoes, hoje],
  );

  const { inicio, fim } = useMemo(() => {
    const datas = [...marcos.map((m) => m.data), ...faixas.flatMap((f) => [f.ini, f.fimIso]), hoje].filter(Boolean);
    if (!datas.length) return { inicio: hoje, fim: hoje };
    const min = datas.reduce((a, b) => (ms(a) <= ms(b) ? a : b));
    const max = datas.reduce((a, b) => (ms(a) >= ms(b) ? a : b));
    return { inicio: min, fim: max };
  }, [marcos, faixas, hoje]);

  const span = Math.max(1, diffDias(inicio, fim) ?? 1);
  const margem = Math.max(2, Math.round(span * 0.05));
  const t0 = ms(inicio) - margem * 86_400_000;
  const t1 = ms(fim) + margem * 86_400_000;
  const pos = (iso: string) => ((ms(iso) - t0) / Math.max(1, t1 - t0)) * 100;

  const meses = useMemo(() => {
    const out: { label: string; left: number }[] = [];
    const d = new Date(t0);
    d.setDate(1);
    while (d.getTime() <= t1) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const left = pos(iso);
      if (left >= 0 && left <= 100) out.push({ label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), left });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t0, t1]);

  const largura = Math.max(760, marcos.length * 130);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Linha do tempo · {pedido.pomg_codigo ?? pedido.numero}</CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Legenda tone="primary" icon={ThumbsUp} label="Aprovação / início" />
          <Legenda tone="success" icon={CheckCircle2} label="Avanços e materiais" />
          <Legenda tone="warning" icon={RefreshCw} label="Reprogramações" />
          <Legenda tone="destructive" icon={AlertTriangle} label="Paralisações" />
          <Legenda tone="muted" icon={Flag} label="Entrega" />
        </div>
      </CardHeader>
      <CardContent>
        {!marcos.length && !faixas.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem eventos registrados para esta demanda.</p>
        ) : (
          <TooltipProvider>
            <div className="overflow-x-auto pb-2">
              <div className="relative" style={{ width: largura }}>
                {/* eixo de meses */}
                <div className="relative h-5">
                  {meses.map((m) => (
                    <span key={m.label} className="absolute -translate-x-1/2 text-[10px] uppercase text-muted-foreground" style={{ left: `${m.left}%` }}>
                      {m.label}
                    </span>
                  ))}
                </div>

                {/* esteira */}
                <div
                  className="relative h-16 rounded-md border border-border bg-foreground/85"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--background) / 0.18) 0 2px, transparent 2px 22px)" }}
                >
                  {faixas.map((f) => {
                    const left = pos(f.ini);
                    const right = pos(f.fimIso);
                    return (
                      <Tooltip key={f.id}>
                        <TooltipTrigger asChild>
                          <div
                            aria-label={`Paralisação ${motivoLabel(f.motivo)} de ${dateBr(f.ini)} a ${f.emAndamento ? "em andamento" : dateBr(f.fimIso)}`}
                            className="absolute top-1/2 h-6 -translate-y-1/2 rounded bg-destructive/80 ring-1 ring-destructive"
                            style={{ left: `${left}%`, width: `${Math.max(0.8, right - left)}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-semibold">Paralisação · {motivoLabel(f.motivo)}</div>
                            <div>
                              {dateBr(f.ini)} → {f.emAndamento ? "em andamento" : dateBr(f.fimIso)}
                            </div>
                            {f.duracao_horas != null && <div>{Number(f.duracao_horas).toFixed(1)} h</div>}
                            {f.detalhe && <div className="text-muted-foreground">{f.detalhe}</div>}
                            {f.conjunto_id && tagDe.get(f.conjunto_id) && <div className="text-muted-foreground">{tagDe.get(f.conjunto_id)}</div>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}

                  {/* hoje */}
                  <div className="absolute inset-y-0 w-px bg-primary" style={{ left: `${pos(hoje)}%` }}>
                    <span className="absolute -top-1 left-1 whitespace-nowrap text-[10px] font-semibold text-primary">Hoje</span>
                  </div>
                </div>

                {/* marcos */}
                <div className="relative mt-3 h-28">
                  {marcos.map((m, i) => {
                    const tone = TONE[m.tone];
                    const Icon = m.icon;
                    return (
                      <Tooltip key={m.id}>
                        <TooltipTrigger asChild>
                          <div
                            aria-label={`${m.titulo} em ${dateBr(m.data)}`}
                            className={`absolute w-36 -translate-x-1/2 rounded-md border bg-card p-2 shadow-sm ${tone.border}`}
                            style={{ left: `${pos(m.data)}%`, top: i % 2 === 0 ? 0 : 52 }}
                          >
                            <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${tone.text}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {m.titulo}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs">
                              {m.riscado && <span className="text-muted-foreground line-through">{m.riscado}</span>}
                              <span className="font-medium">{dateBr(m.data)}</span>
                            </div>
                            {m.badge && (
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                {m.badge}
                              </Badge>
                            )}
                            <span className={`absolute -top-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full ${tone.dot}`} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-semibold">{m.titulo}</div>
                            <div>{m.detalhe}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

function Legenda({ tone, icon: Icon, label }: { tone: Marco["tone"]; icon: typeof Flag; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${TONE[tone].dot}`} />
      <Icon className={`h-3.5 w-3.5 ${TONE[tone].text}`} />
      {label}
    </span>
  );
}
