import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarRange, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ModuleHeader, PedidoSelect, MetricCard, ProgressBar, TODAS_ETAPAS, dateBr, processoLabel, useConjuntos, usePedidos, type ConjuntoResumo } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/pcp")({
  head: () => ({ meta: [{ title: "PCP | Omega Service ERP" }, { name: "description", content: "Planejamento de pedidos, conjuntos, TAGs e cronogramas industriais." }, { property: "og:title", content: "PCP | Omega Service ERP" }, { property: "og:description", content: "Planejamento de pedidos, conjuntos, TAGs e cronogramas industriais." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PcpPage,
});

type Plano = { id: string; pedido_id: string; data_inicio: string | null; data_fim_prevista: string | null; status: string; observacoes: string | null };
type Reprogramacao = { id: string; conjunto_id: string | null; data_anterior: string | null; nova_data: string; motivo: string; impacto_dias: number; created_at: string };

function PcpPage() {
  const qc = useQueryClient();
  const { data: pedidos = [] } = usePedidos();
  const [pedidoId, setPedidoId] = useState("");
  const [novo, setNovo] = useState(false);
  const [reprogramando, setReprogramando] = useState<ConjuntoResumo | null>(null);
  const [form, setForm] = useState({ codigo: "", tag: "", descricao: "", quantidade: 1, peso_kg: "", prioridade: 3, inicio_previsto: "", fim_previsto: "" });
  const [reprog, setReprog] = useState({ nova_data: "", motivo: "" });
  useEffect(() => { if (!pedidoId && pedidos[0]) setPedidoId(pedidos[0].id); }, [pedidoId, pedidos]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const { data: conjuntos = [] } = useConjuntos(pedidoId);

  const { data: plano } = useQuery({ queryKey: ["pcp-plano", pedidoId], enabled: Boolean(pedidoId), queryFn: async () => { const { data, error } = await supabase.from("pcp_planos").select("*").eq("pedido_id", pedidoId).maybeSingle(); if (error) throw error; return data as Plano | null; } });
  const { data: reprogramacoes = [] } = useQuery({ queryKey: ["reprogramacoes", pedidoId], enabled: Boolean(pedidoId), queryFn: async () => { const { data, error } = await supabase.from("pcp_reprogramacoes").select("*").eq("pedido_id", pedidoId).order("created_at", { ascending: false }); if (error) throw error; return data as Reprogramacao[]; } });

  const previsto = useMemo(() => {
    if (!conjuntos.length) return 0;
    const hoje = Date.now();
    return conjuntos.reduce((sum, c) => {
      if (!c.inicio_previsto || !c.fim_previsto) return sum;
      const ini = new Date(`${c.inicio_previsto}T12:00:00`).getTime(); const fim = new Date(`${c.fim_previsto}T12:00:00`).getTime();
      return sum + (hoje <= ini ? 0 : hoje >= fim ? 100 : ((hoje - ini) / Math.max(1, fim - ini)) * 100);
    }, 0) / conjuntos.length;
  }, [conjuntos]);
  const realizado = conjuntos.length ? conjuntos.reduce((s, c) => s + Number(c.progresso), 0) / conjuntos.length : 0;

  const salvarPlano = useMutation({ mutationFn: async () => { if (!pedidoId) return; const payload = { pedido_id: pedidoId, data_inicio: plano?.data_inicio ?? new Date().toISOString().slice(0, 10), data_fim_prevista: pedido?.prazo_entrega ?? null, status: "publicado" }; const { error } = plano ? await supabase.from("pcp_planos").update(payload).eq("id", plano.id) : await supabase.from("pcp_planos").insert(payload); if (error) throw error; }, onSuccess: () => { toast.success("Planejamento publicado"); qc.invalidateQueries({ queryKey: ["pcp-plano", pedidoId] }); }, onError: (e: Error) => toast.error(e.message) });
  const adicionar = useMutation({ mutationFn: async () => { if (!pedidoId) throw new Error("Selecione um pedido"); const { data, error } = await supabase.from("pedido_conjuntos").insert({ pedido_id: pedidoId, codigo: form.codigo, tag: form.tag, descricao: form.descricao, quantidade: form.quantidade, peso_kg: form.peso_kg ? Number(form.peso_kg) : null, prioridade: form.prioridade, inicio_previsto: form.inicio_previsto || null, fim_previsto: form.fim_previsto || null }).select("id").single(); if (error) throw error; const etapas = TODAS_ETAPAS.map((processo, ordem) => ({ conjunto_id: data.id, processo, ordem, inicio_previsto: form.inicio_previsto || null, fim_previsto: form.fim_previsto || null, peso_percentual: 12.5 })); const etapaRes = await supabase.from("cronograma_etapas").insert(etapas); if (etapaRes.error) throw etapaRes.error; }, onSuccess: () => { toast.success("Conjunto e cronograma criados"); setNovo(false); setForm({ codigo: "", tag: "", descricao: "", quantidade: 1, peso_kg: "", prioridade: 3, inicio_previsto: "", fim_previsto: "" }); qc.invalidateQueries({ queryKey: ["conjuntos", pedidoId] }); }, onError: (e: Error) => toast.error(e.message) });
  const reprogramar = useMutation({ mutationFn: async () => { if (!pedidoId || !reprogramando) return; const anterior = reprogramando.fim_previsto; const impacto = anterior && reprog.nova_data ? Math.round((new Date(reprog.nova_data).getTime() - new Date(anterior).getTime()) / 86400000) : 0; const { error } = await supabase.from("pcp_reprogramacoes").insert({ pedido_id: pedidoId, conjunto_id: reprogramando.id, data_anterior: anterior, nova_data: reprog.nova_data, motivo: reprog.motivo, impacto_dias: impacto }); if (error) throw error; const upd = await supabase.from("pedido_conjuntos").update({ fim_previsto: reprog.nova_data }).eq("id", reprogramando.id); if (upd.error) throw upd.error; }, onSuccess: () => { toast.success("Reprogramação registrada"); setReprogramando(null); setReprog({ nova_data: "", motivo: "" }); qc.invalidateQueries({ queryKey: ["conjuntos", pedidoId] }); qc.invalidateQueries({ queryKey: ["reprogramacoes", pedidoId] }); }, onError: (e: Error) => toast.error(e.message) });

  return <div className="space-y-6">
    <ModuleHeader title="PCP" description="Planejamento do pedido, conjuntos, TAGs e cronograma." icon={CalendarRange} action={<Button onClick={() => salvarPlano.mutate()} disabled={!pedidoId || salvarPlano.isPending}>{plano ? "Republicar plano" : "Publicar plano"}</Button>} />
    <PedidoSelect pedidos={pedidos} value={pedidoId} onChange={setPedidoId} />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><MetricCard label="Conjuntos" value={conjuntos.length} /><MetricCard label="Avanço planejado" value={`${previsto.toFixed(0)}%`} /><MetricCard label="Avanço realizado" value={`${realizado.toFixed(0)}%`} tone="success" /><MetricCard label="Reprogramações" value={reprogramacoes.length} tone={reprogramacoes.length ? "warning" : "default"} /></div>
    <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Estrutura do pedido</CardTitle><p className="text-xs text-muted-foreground">{pedido ? `${pedido.numero} · prazo ${dateBr(pedido.prazo_entrega)}` : "Selecione um pedido"}</p></div><Button size="sm" onClick={() => setNovo(true)} disabled={!pedidoId}><Plus className="mr-2 h-4 w-4" />Conjunto</Button></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>TAG</TableHead><TableHead>Conjunto</TableHead><TableHead>Qtd.</TableHead><TableHead>Peso</TableHead><TableHead>Prazo</TableHead><TableHead>Avanço</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{conjuntos.length ? conjuntos.map((c) => <TableRow key={c.id}><TableCell className="font-mono font-medium">{c.tag}</TableCell><TableCell><div>{c.codigo}</div><div className="text-xs text-muted-foreground">{c.descricao}</div></TableCell><TableCell>{c.quantidade}</TableCell><TableCell>{c.peso_kg ? `${c.peso_kg} kg` : "—"}</TableCell><TableCell>{dateBr(c.fim_previsto)}</TableCell><TableCell><ProgressBar value={c.progresso} /></TableCell><TableCell><Badge variant="outline">{c.status.replaceAll("_", " ")}</Badge></TableCell><TableCell><Button size="icon" variant="ghost" title="Reprogramar" onClick={() => { setReprogramando(c); setReprog({ nova_data: c.fim_previsto ?? "", motivo: "" }); }}><RefreshCw className="h-4 w-4" /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Nenhum conjunto planejado.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
    {reprogramacoes.length > 0 && <Card><CardHeader><CardTitle className="text-base">Histórico de reprogramações</CardTitle></CardHeader><CardContent className="space-y-2">{reprogramacoes.map((r) => <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm"><span>{dateBr(r.data_anterior)} → <strong>{dateBr(r.nova_data)}</strong></span><span className="text-muted-foreground">{r.motivo} · impacto {r.impacto_dias} dias</span></div>)}</CardContent></Card>}
    <Dialog open={novo} onOpenChange={setNovo}><DialogContent><DialogHeader><DialogTitle>Novo conjunto e TAG</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><Field label="Código"><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></Field><Field label="TAG"><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></Field><div className="col-span-2"><Field label="Descrição"><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field></div><Field label="Quantidade"><Input type="number" min="1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} /></Field><Field label="Peso total (kg)"><Input type="number" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} /></Field><Field label="Início previsto"><Input type="date" value={form.inicio_previsto} onChange={(e) => setForm({ ...form, inicio_previsto: e.target.value })} /></Field><Field label="Fim previsto"><Input type="date" value={form.fim_previsto} onChange={(e) => setForm({ ...form, fim_previsto: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => setNovo(false)}>Cancelar</Button><Button onClick={() => adicionar.mutate()} disabled={!form.codigo || !form.tag || !form.descricao || adicionar.isPending}>Criar conjunto</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(reprogramando)} onOpenChange={(o) => !o && setReprogramando(null)}><DialogContent><DialogHeader><DialogTitle>Reprogramar {reprogramando?.tag}</DialogTitle></DialogHeader><Field label="Nova data"><Input type="date" value={reprog.nova_data} onChange={(e) => setReprog({ ...reprog, nova_data: e.target.value })} /></Field><Field label="Motivo"><Textarea value={reprog.motivo} onChange={(e) => setReprog({ ...reprog, motivo: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => setReprogramando(null)}>Cancelar</Button><Button onClick={() => reprogramar.mutate()} disabled={!reprog.nova_data || !reprog.motivo}>Registrar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }