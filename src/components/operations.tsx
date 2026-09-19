import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";

export type PedidoResumo = {
  id: string;
  numero: string;
  pomg_codigo: string | null;
  prazo_entrega: string | null;
  data_sla: string | null;
  prazo_dias: number | null;
  data_aprovacao: string | null;
  prazo_aquisicao_dias: number | null;
  data_chegada_materiais: string | null;
  data_chegada_materiais_original: string | null;
  prazo_fabricacao_dias: number | null;
  data_entrega_reprogramada: string | null;
  pcp_status: string;
  producao_iniciada: boolean;
  data_inicio_producao: string | null;
  valor_total: number;
  status: "aberto" | "em_producao" | "concluido" | "cancelado";
  contrato_id: string | null;
  sub_area_id: string | null;
  orcamento_id: string | null;
  contratos?: { nome: string; empresa: string } | null;
  sub_areas?: { nome: string } | null;
  orcamentos?: { numero: string } | null;
};

export type ConjuntoResumo = {
  id: string;
  pedido_id: string;
  codigo: string;
  tag: string;
  descricao: string;
  quantidade: number;
  quantidade_fabricada: number;
  peso_kg: number | null;
  peso_fabricado_kg: number;
  prioridade: number;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  status: string;
  progresso: number;
  liberado_qualidade: boolean;
};

export type Atividade = {
  id: string;
  pedido_id: string;
  conjunto_id: string;
  atividade: string;
  nome_extra: string | null;
  ordem: number;
  status: string;
  quantidade_executada: number;
  peso_executado_kg: number;
  observacoes: string | null;
};

/* Atividades padrão do orçamento e da produção */
export const ATIVIDADES = ["corte", "dobra", "montagem", "acabamento", "pintura", "usinagem"] as const;
export const ATIVIDADE_EXTRA = "extra";
export const atividadeLabel = (value: string, nomeExtra?: string | null) =>
  value === ATIVIDADE_EXTRA
    ? nomeExtra || "Atividade extra"
    : ({ corte: "Corte", dobra: "Dobra", montagem: "Montagem", acabamento: "Acabamento", pintura: "Pintura", usinagem: "Usinagem" }[value] ?? value);

/* Compatibilidade com o cronograma existente */
export const PROCESSOS = ATIVIDADES;
export const TODAS_ETAPAS = [...ATIVIDADES, "qualidade", "expedicao"] as const;
export const processoLabel = (value: string) =>
  ({ qualidade: "Qualidade", expedicao: "Expedição", soldagem: "Soldagem" }[value] ?? atividadeLabel(value));

/* Relatórios / inspeções da demanda */
export const REQUISITOS = [
  { value: "dimensional", label: "Dimensional" },
  { value: "solda", label: "Solda" },
  { value: "pintura", label: "Pintura" },
  { value: "outro", label: "Outro Ensaio" },
] as const;
export const requisitoLabel = (tipo: string, nome?: string | null) =>
  tipo === "outro" ? nome || "Outro Ensaio" : (REQUISITOS.find((r) => r.value === tipo)?.label ?? tipo);

/* Situação da proposta */
export const SITUACOES_PROPOSTA = [
  { value: "orcamento", label: "Orçamento" },
  { value: "ag_aprovacao", label: "Ag. Aprovação" },
  { value: "aprovado", label: "Aprovado" },
  { value: "cancelado", label: "Cancelado" },
] as const;
export const situacaoLabel = (value: string) => SITUACOES_PROPOSTA.find((s) => s.value === value)?.label ?? value;

/* Situação do PCP */
export const PCP_STATUS = [
  { value: "nao_iniciado", label: "Não Iniciado" },
  { value: "aguardando_material", label: "Aguardando Material" },
  { value: "em_fabricacao", label: "Em Fabricação" },
  { value: "ag_entrega", label: "Ag. Entrega" },
  { value: "entregue", label: "Entregue" },
  { value: "paralisada", label: "Paralisada" },
] as const;
export const pcpStatusLabel = (value: string) => PCP_STATUS.find((s) => s.value === value)?.label ?? value;

export const dateBr = (value?: string | null) => (value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "—");
export const moneyBr = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const hoursBetween = (start: string, end?: string | null) => Math.max(0, (new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / 3_600_000);

export type Feriado = { id: string; data: string; nome: string; ativo: boolean };

/** Feriados cadastrados, usados nos cálculos de dias úteis. */
export function useFeriados() {
  return useQuery({
    queryKey: ["feriados"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feriados").select("*").eq("ativo", true).order("data");
      if (error) throw error;
      return data as unknown as Feriado[];
    },
  });
}

/** Soma dias úteis a uma data (ISO yyyy-mm-dd), pulando sábados, domingos e feriados cadastrados. */
export function somarDiasUteis(base: string | null | undefined, dias: number | null | undefined, feriados: string[] = []) {
  if (!base || !dias || dias <= 0) return base ? base.slice(0, 10) : null;
  const set = new Set(feriados.map((f) => f.slice(0, 10)));
  const d = new Date(`${base.slice(0, 10)}T12:00:00`);
  let restantes = Math.floor(dias);
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !set.has(iso)) restantes -= 1;
  }
  return d.toISOString().slice(0, 10);
}

export const diasRestantes = (prazo?: string | null) =>
  prazo ? Math.ceil((new Date(`${prazo.slice(0, 10)}T12:00:00`).getTime() - Date.now()) / 86_400_000) : null;

/** Diferença em dias corridos entre duas datas ISO (b − a). */
export const diffDias = (a?: string | null, b?: string | null) =>
  a && b ? Math.round((new Date(`${b.slice(0, 10)}T12:00:00`).getTime() - new Date(`${a.slice(0, 10)}T12:00:00`).getTime()) / 86_400_000) : null;

/** Prazo de entrega original da demanda (SLA ou prazo do pedido). */
export const prazoOriginal = (p: PedidoResumo) => p.data_sla ?? p.prazo_entrega;

/** Prazo de entrega em vigor: a reprogramação, quando existir. */
export const prazoVigente = (p: PedidoResumo) => p.data_entrega_reprogramada ?? prazoOriginal(p);

/** Data-base para contar o prazo de fabricação em dias úteis. */
export function baseFabricacao(p: PedidoResumo) {
  if (p.producao_iniciada && p.data_inicio_producao) {
    const d = new Date(p.data_inicio_producao);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  return p.data_chegada_materiais ?? p.data_aprovacao ?? null;
}

export function avancoPrevisto(conjuntos: ConjuntoResumo[]) {
  if (!conjuntos.length) return 0;
  const hoje = Date.now();
  return (
    conjuntos.reduce((sum, c) => {
      if (!c.inicio_previsto || !c.fim_previsto) return sum;
      const ini = new Date(`${c.inicio_previsto}T12:00:00`).getTime();
      const fim = new Date(`${c.fim_previsto}T12:00:00`).getTime();
      return sum + (hoje <= ini ? 0 : hoje >= fim ? 100 : ((hoje - ini) / Math.max(1, fim - ini)) * 100);
    }, 0) / conjuntos.length
  );
}

export type Farol = "verde" | "amarelo" | "vermelho";
export function calcularFarol({ previsto, real, restante, status }: { previsto: number; real: number; restante: number | null; status?: string }): Farol {
  if (status === "entregue") return "verde";
  if (status === "paralisada") return "vermelho";
  const desvio = previsto - real;
  if (restante !== null && (restante < 0 || (restante <= 5 && desvio > 10))) return "vermelho";
  if (desvio > 20) return "vermelho";
  if (desvio > 5) return "amarelo";
  return "verde";
}
export const FAROL_INFO: Record<Farol, { label: string; dot: string; text: string }> = {
  verde: { label: "No prazo", dot: "bg-success", text: "text-success" },
  amarelo: { label: "Com desvio", dot: "bg-warning", text: "text-warning" },
  vermelho: { label: "Crítico", dot: "bg-destructive", text: "text-destructive" },
};
export function FarolDot({ farol }: { farol: Farol }) {
  const info = FAROL_INFO[farol];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium">
      <span className={`h-3 w-3 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

/** Tabelas observadas e quais consultas cada mudança atualiza. */
const TABELAS_SINCRONIZADAS: Record<string, string[]> = {
  pedidos: ["pedidos-operacionais", "kpi-central", "pedido-por-orcamento"],
  pedido_conjuntos: ["todos-conjuntos", "conjuntos", "kpi-central"],
  pedido_conjunto_atividades: ["atividades-conjunto", "todos-conjuntos", "conjuntos", "kpi-central"],
  solicitacoes_orcamento: ["solicitacoes", "solicitacao"],
  analises_tecnicas: ["analise", "solicitacoes", "solicitacao"],
  demanda_requisitos: ["demanda-requisitos", "requisitos-demanda", "databook"],
  orcamentos: ["orcamento", "solicitacoes", "pedido-por-orcamento", "kpi-central"],
  orcamento_conjuntos: ["orcamento-conjuntos", "orcamento-conjunto-atividades"],
  orcamento_conjunto_atividades: ["orcamento-conjunto-atividades"],
  orcamento_itens: ["itens", "orcamento"],
  orcamento_historico: ["orcamento-historico"],
  pcp_planos: ["pedidos-operacionais"],
  pcp_reprogramacoes: ["reprogramacoes", "pedidos-operacionais", "pcp-timeline-reprogramacoes"],
  cronograma_etapas: ["conjuntos", "todos-conjuntos"],
  apontamentos_producao: ["atividades-conjunto", "conjuntos", "todos-conjuntos", "kpi-central", "pcp-timeline-apontamentos"],
  paralisacoes: ["paralisacoes", "kpi-central", "pcp-timeline-paralisacoes"],
  atividades_nao_previstas: ["atividades-nao-previstas"],
  inspecoes_qualidade: ["inspecoes", "conjuntos", "todos-conjuntos", "kpi-central"],
  nao_conformidades: ["ncs", "kpi-central"],
  romaneios: ["romaneios", "kpi-central"],
  romaneio_itens: ["romaneio-itens", "conjuntos", "todos-conjuntos", "kpi-central"],
  romaneio_notas: ["romaneio-notas"],
  medicoes: ["medicoes", "kpi-central"],
  notas_fiscais: ["notas", "kpi-central"],
  databook_relatorios: ["databook"],
  contratos: ["contratos-select", "pedidos-operacionais", "kpi-central"],
  sub_areas: ["sub-areas", "sub-areas-select", "pedidos-operacionais"],
  feriados: ["feriados"],
};

/** Mantém todos os módulos (Orçamentos, PCP, Produção, Qualidade, Expedição, Medição, Databook e painéis) sincronizados em tempo real. */
export function useSincronizacaoTempoReal() {
  const qc = useQueryClient();
  useEffect(() => {
    let canal = supabase.channel("operacoes-tempo-real");
    for (const [table, chaves] of Object.entries(TABELAS_SINCRONIZADAS)) {
      canal = canal.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const chave of chaves) qc.invalidateQueries({ queryKey: [chave] });
      });
    }
    canal.subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [qc]);
}

export function usePedidos() {
  return useQuery({
    queryKey: ["pedidos-operacionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, contratos(nome, empresa), sub_areas(nome), orcamentos(numero)")
        .neq("status", "cancelado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PedidoResumo[];
    },
  });
}

export function useConjuntos(pedidoId?: string) {
  return useQuery({
    queryKey: ["conjuntos", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      if (!pedidoId) return [];
      const { data, error } = await supabase.from("pedido_conjuntos").select("*").eq("pedido_id", pedidoId).order("prioridade").order("tag");
      if (error) throw error;
      return data as unknown as ConjuntoResumo[];
    },
  });
}

export function useTodosConjuntos() {
  return useQuery({
    queryKey: ["todos-conjuntos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedido_conjuntos").select("*");
      if (error) throw error;
      return data as unknown as ConjuntoResumo[];
    },
  });
}

export function useAtividades(pedidoId?: string) {
  return useQuery({
    queryKey: ["atividades-conjunto", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      if (!pedidoId) return [];
      const { data, error } = await supabase.from("pedido_conjunto_atividades").select("*").eq("pedido_id", pedidoId).order("ordem");
      if (error) throw error;
      return data as unknown as Atividade[];
    },
  });
}

export function ModuleHeader({ title, description, icon: Icon, action }: { title: string; description: string; icon: LucideIcon; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export const pedidoLabel = (p: PedidoResumo) => `${p.pomg_codigo ?? p.numero} · ${p.contratos?.empresa ?? "Sem empresa"} · ${p.sub_areas?.nome ?? "Sem sub-área"}`;

export function PedidoSelect({ pedidos, value, onChange, label = "Demanda (POMG)" }: { pedidos: PedidoResumo[]; value: string; onChange: (value: string) => void; label?: string }) {
  return (
    <div className="w-full max-w-xl space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma demanda" />
        </SelectTrigger>
        <SelectContent>
          {pedidos.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {pedidoLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MetricCard({ label, value, detail, tone = "default" }: { label: string; value: string | number; detail?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const border = tone === "success" ? "border-l-success" : tone === "warning" ? "border-l-warning" : tone === "danger" ? "border-l-destructive" : "border-l-primary";
  return (
    <Card className={`border-l-4 ${border}`}>
      <CardContent className="pt-5">
        <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
      </CardContent>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="flex min-w-28 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${safe}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium">{safe.toFixed(0)}%</span>
    </div>
  );
}
