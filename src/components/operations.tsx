import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";

export type PedidoResumo = {
  id: string;
  numero: string;
  prazo_entrega: string | null;
  valor_total: number;
  status: "aberto" | "em_producao" | "concluido" | "cancelado";
  contrato_id: string | null;
  contratos?: { nome: string; empresa: string } | null;
  sub_areas?: { nome: string } | null;
};

export type ConjuntoResumo = {
  id: string;
  pedido_id: string;
  codigo: string;
  tag: string;
  descricao: string;
  quantidade: number;
  peso_kg: number | null;
  prioridade: number;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  status: string;
  progresso: number;
  liberado_qualidade: boolean;
};

export const PROCESSOS = ["corte", "dobra", "usinagem", "montagem", "soldagem", "pintura"] as const;
export const TODAS_ETAPAS = [...PROCESSOS, "qualidade", "expedicao"] as const;
export const processoLabel = (value: string) => ({
  corte: "Corte", dobra: "Dobra", usinagem: "Usinagem", montagem: "Montagem",
  soldagem: "Soldagem", pintura: "Pintura", qualidade: "Qualidade", expedicao: "Expedição",
}[value] ?? value);

export const dateBr = (value?: string | null) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "—";
export const moneyBr = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const hoursBetween = (start: string, end?: string | null) => Math.max(0, (new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / 3_600_000);

export function usePedidos() {
  return useQuery({
    queryKey: ["pedidos-operacionais"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*, contratos(nome, empresa), sub_areas(nome)").neq("status", "cancelado").order("created_at", { ascending: false });
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
      return data as ConjuntoResumo[];
    },
  });
}

export function ModuleHeader({ title, description, icon: Icon, action }: { title: string; description: string; icon: LucideIcon; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 flex-wrap"><div className="flex items-start gap-3"><div className="mt-0.5 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div></div>{action}</div>;
}

export function PedidoSelect({ pedidos, value, onChange }: { pedidos: PedidoResumo[]; value: string; onChange: (value: string) => void }) {
  return <div className="w-full max-w-xl space-y-1.5"><Label>Pedido</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Selecione um pedido" /></SelectTrigger><SelectContent>{pedidos.map((p) => <SelectItem key={p.id} value={p.id}>{p.numero} · {p.contratos?.empresa ?? "Sem empresa"} · {p.sub_areas?.nome ?? "Sem sub-área"}</SelectItem>)}</SelectContent></Select></div>;
}

export function MetricCard({ label, value, detail, tone = "default" }: { label: string; value: string | number; detail?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const border = tone === "success" ? "border-l-success" : tone === "warning" ? "border-l-warning" : tone === "danger" ? "border-l-destructive" : "border-l-primary";
  return <Card className={`border-l-4 ${border}`}><CardContent className="pt-5"><div className="text-xs font-medium uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div>{detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}</CardContent></Card>;
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="flex min-w-28 items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${safe}%` }} /></div><span className="w-10 text-right text-xs font-medium">{safe.toFixed(0)}%</span></div>;
}