import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";
import {
  FarolDot,
  MetricCard,
  ModuleHeader,
  ProgressBar,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  moneyBr,
  pcpStatusLabel,
  situacaoLabel,
  usePedidos,
  useSincronizacaoTempoReal,
  useTodosConjuntos,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/fluxo")({
  head: () => ({
    meta: [
      { title: "Fluxo da Demanda | Omega Service ERP" },
      { name: "description", content: "Acompanhe cada demanda POMG em uma linha: Orçamentos, PCP, Produção, Qualidade e Expedição com avanço total." },
      { property: "og:title", content: "Fluxo da Demanda | Omega Service ERP" },
      { property: "og:description", content: "Acompanhe cada demanda POMG em uma linha: Orçamentos, PCP, Produção, Qualidade e Expedição com avanço total." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FluxoPage,
});

const ETAPAS = ["Orçamentos", "PCP", "Produção", "Qualidade", "Expedição"] as const;

function useOrcamentosSituacao() {
  return useQuery({
    queryKey: ["orcamento", "fluxo-situacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos").select("id, situacao, status, numero");
      if (error) throw error;
      return data as { id: string; situacao: string; status: string; numero: string }[];
    },
  });
}

function useInspecoes() {
  return useQuery({
    queryKey: ["inspecoes", "fluxo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inspecoes_qualidade").select("id, pedido_id, conjunto_id, resultado");
      if (error) throw error;
      return data as { id: string; pedido_id: string; conjunto_id: string; resultado: string }[];
    },
  });
}

function useItensExpedidos() {
  return useQuery({
    queryKey: ["romaneio-itens", "fluxo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("romaneio_itens").select("conjunto_id, quantidade, peso_kg");
      if (error) throw error;
      return data as { conjunto_id: string; quantidade: number; peso_kg: number | null }[];
    },
  });
}

function EtapaBadge({ nome, valor }: { nome: string; valor: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));
  const tone = pct >= 100 ? "bg-success" : pct > 0 ? "bg-primary" : "bg-muted-foreground/30";
  return (
    <div className="min-w-[104px] flex-1">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="truncate">{nome}</span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FluxoPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();
  const { data: orcamentos = [] } = useOrcamentosSituacao();
  const { data: inspecoes = [] } = useInspecoes();
  const { data: expedidos = [] } = useItensExpedidos();

  const linhas = useMemo(() => {
    const porConjunto = new Map<string, number>();
    for (const it of expedidos) porConjunto.set(it.conjunto_id, (porConjunto.get(it.conjunto_id) ?? 0) + Number(it.quantidade ?? 0));

    return pedidos.map((p) => {
      const cs = conjuntos.filter((c) => c.pedido_id === p.id);
      const orc = orcamentos.find((o) => o.id === p.orcamento_id);
      const situacao = orc?.situacao ?? "aprovado";

      const etapaOrcamento = situacao === "aprovado" ? 100 : situacao === "ag_aprovacao" ? 60 : situacao === "cancelado" ? 0 : 30;

      const comDatas = cs.filter((c) => c.inicio_previsto && c.fim_previsto).length;
      const planejado = cs.length ? (comDatas / cs.length) * 100 : 0;
      const etapaPcp = p.producao_iniciada || p.pcp_status === "entregue" ? 100 : planejado * 0.8;

      const etapaProducao = cs.length ? cs.reduce((s, c) => s + Number(c.progresso ?? 0), 0) / cs.length : 0;

      const aprovados = cs.filter((c) => c.liberado_qualidade || inspecoes.some((i) => i.conjunto_id === c.id && i.resultado === "aprovado")).length;
      const etapaQualidade = cs.length ? (aprovados / cs.length) * 100 : 0;

      const totalQtd = cs.reduce((s, c) => s + Number(c.quantidade ?? 0), 0);
      const entregue = cs.reduce((s, c) => s + (porConjunto.get(c.id) ?? 0), 0);
      const etapaExpedicao = totalQtd ? (entregue / totalQtd) * 100 : 0;

      const etapas = [etapaOrcamento, etapaPcp, etapaProducao, etapaQualidade, etapaExpedicao];
      const total = etapas.reduce((s, v) => s + Math.min(100, v), 0) / etapas.length;

      const previsto = avancoPrevisto(cs);
      const restante = diasRestantes(p.data_sla ?? p.prazo_entrega);
      const pesoTotal = cs.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);

      return {
        pedido: p,
        situacao,
        etapas,
        total,
        restante,
        pesoTotal,
        conjuntos: cs.length,
        farol: calcularFarol({ previsto, real: etapaProducao, restante, status: p.pcp_status }),
      };
    });
  }, [pedidos, conjuntos, orcamentos, inspecoes, expedidos]);

  const media = linhas.length ? linhas.reduce((s, l) => s + l.total, 0) / linhas.length : 0;
  const concluidas = linhas.filter((l) => l.total >= 100).length;
  const criticas = linhas.filter((l) => l.farol === "vermelho").length;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Fluxo da Demanda"
        description="Cada demanda POMG em uma linha: Orçamentos → PCP → Produção → Qualidade → Expedição, com avanço total."
        icon={GitBranch}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Demandas no fluxo" value={linhas.length} />
        <MetricCard label="Avanço médio" value={`${media.toFixed(0)}%`} />
        <MetricCard label="Fluxo concluído" value={concluidas} tone="success" />
        <MetricCard label="Críticas" value={criticas} tone={criticas ? "danger" : "default"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandas por etapa</CardTitle>
          <p className="text-xs text-muted-foreground">Clique em uma demanda para abrir o detalhamento no PCP.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {linhas.length ? (
            linhas.map((l) => (
              <button
                key={l.pedido.id}
                type="button"
                onClick={() => navigate({ to: "/pcp" })}
                className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/60"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-sm font-semibold">{l.pedido.pomg_codigo ?? l.pedido.numero}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {situacaoLabel(l.situacao)}
                      </Badge>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {pcpStatusLabel(l.pedido.pcp_status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.pedido.contratos?.nome ?? "—"} · {l.pedido.sub_areas?.nome ?? "—"} · {l.conjuntos} conjunto(s) · {l.pesoTotal.toLocaleString("pt-BR")} kg ·{" "}
                      {moneyBr(l.pedido.valor_total)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <FarolDot farol={l.farol} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      SLA {dateBr(l.pedido.data_sla ?? l.pedido.prazo_entrega)}
                      {l.restante === null ? "" : l.restante < 0 ? ` · ${Math.abs(l.restante)} d em atraso` : ` · ${l.restante} d`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {ETAPAS.map((nome, i) => (
                    <EtapaBadge key={nome} nome={nome} valor={l.etapas[i] ?? 0} />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="shrink-0 text-xs font-medium">Avanço total</span>
                  <div className="min-w-0 flex-1">
                    <ProgressBar value={l.total} />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="py-10 text-center text-muted-foreground">Nenhuma demanda no fluxo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
