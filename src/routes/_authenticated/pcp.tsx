import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarRange, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ATIVIDADES,
  FarolDot,
  MetricCard,
  ModuleHeader,
  PCP_STATUS,
  PedidoSelect,
  ProgressBar,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  pcpStatusLabel,
  useConjuntos,
  usePedidos,
  useTodosConjuntos,
  type ConjuntoResumo,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/pcp")({
  head: () => ({
    meta: [
      { title: "PCP | Omega Service ERP" },
      { name: "description", content: "Acompanhamento das demandas POMG com farol, avanço previsto e avanço real." },
      { property: "og:title", content: "PCP | Omega Service ERP" },
      { property: "og:description", content: "Acompanhamento das demandas POMG com farol, avanço previsto e avanço real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PcpPage,
});

type Reprogramacao = { id: string; conjunto_id: string | null; data_anterior: string | null; nova_data: string; motivo: string; impacto_dias: number; created_at: string };

function PcpPage() {
  const qc = useQueryClient();
  const { data: pedidos = [] } = usePedidos();
  const { data: todosConjuntos = [] } = useTodosConjuntos();
  const [contrato, setContrato] = useState("todos");
  const [subArea, setSubArea] = useState("todas");
  const [pedidoId, setPedidoId] = useState("");
  const [novo, setNovo] = useState(false);
  const [reprogramando, setReprogramando] = useState<ConjuntoResumo | null>(null);
  const [form, setForm] = useState({ codigo: "", tag: "", descricao: "", quantidade: 1, peso_kg: "", prioridade: 3, inicio_previsto: "", fim_previsto: "" });
  const [reprog, setReprog] = useState({ nova_data: "", motivo: "" });
  useEffect(() => {
    if (!pedidoId && pedidos[0]) setPedidoId(pedidos[0].id);
  }, [pedidoId, pedidos]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const { data: conjuntos = [] } = useConjuntos(pedidoId);

  const { data: reprogramacoes = [] } = useQuery({
    queryKey: ["reprogramacoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("pcp_reprogramacoes").select("*").eq("pedido_id", pedidoId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reprogramacao[];
    },
  });

  const contratos = useMemo(() => {
    const map = new Map<string, string>();
    pedidos.forEach((p) => p.contrato_id && map.set(p.contrato_id, `${p.contratos?.empresa ?? ""} · ${p.contratos?.nome ?? ""}`));
    return [...map.entries()];
  }, [pedidos]);
  const subAreas = useMemo(() => {
    const map = new Map<string, string>();
    pedidos.filter((p) => contrato === "todos" || p.contrato_id === contrato).forEach((p) => p.sub_area_id && map.set(p.sub_area_id, p.sub_areas?.nome ?? ""));
    return [...map.entries()];
  }, [pedidos, contrato]);

  const linhas = useMemo(
    () =>
      pedidos
        .filter((p) => (contrato === "todos" || p.contrato_id === contrato) && (subArea === "todas" || p.sub_area_id === subArea))
        .map((p) => {
          const cs = todosConjuntos.filter((c) => c.pedido_id === p.id);
          const previsto = avancoPrevisto(cs);
          const real = cs.length ? cs.reduce((s, c) => s + Number(c.progresso), 0) / cs.length : 0;
          const restante = diasRestantes(p.data_sla ?? p.prazo_entrega);
          return { pedido: p, previsto, real, restante, farol: calcularFarol({ previsto, real, restante, status: p.pcp_status }) };
        }),
    [pedidos, todosConjuntos, contrato, subArea],
  );

  const statusMut = useMutation({
    mutationFn: async ({ id, pcp_status }: { id: string; pcp_status: string }) => {
      const { error } = await supabase.from("pedidos").update({ pcp_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Situação atualizada");
      qc.invalidateQueries({ queryKey: ["pedidos-operacionais"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adicionar = useMutation({
    mutationFn: async () => {
      if (!pedidoId) throw new Error("Selecione uma demanda");
      const { data, error } = await supabase
        .from("pedido_conjuntos")
        .insert({
          pedido_id: pedidoId,
          codigo: form.codigo,
          tag: form.tag,
          descricao: form.descricao,
          quantidade: form.quantidade,
          peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
          prioridade: form.prioridade,
          inicio_previsto: form.inicio_previsto || null,
          fim_previsto: form.fim_previsto || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const atividades = ATIVIDADES.map((atividade, ordem) => ({ pedido_id: pedidoId, conjunto_id: data.id, atividade, ordem }));
      const res = await supabase.from("pedido_conjunto_atividades").insert(atividades);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Conjunto criado com as atividades padrão");
      setNovo(false);
      setForm({ codigo: "", tag: "", descricao: "", quantidade: 1, peso_kg: "", prioridade: 3, inicio_previsto: "", fim_previsto: "" });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reprogramar = useMutation({
    mutationFn: async () => {
      if (!pedidoId || !reprogramando) return;
      const anterior = reprogramando.fim_previsto;
      const impacto = anterior && reprog.nova_data ? Math.round((new Date(reprog.nova_data).getTime() - new Date(anterior).getTime()) / 86400000) : 0;
      const { error } = await supabase.from("pcp_reprogramacoes").insert({ pedido_id: pedidoId, conjunto_id: reprogramando.id, data_anterior: anterior, nova_data: reprog.nova_data, motivo: reprog.motivo, impacto_dias: impacto });
      if (error) throw error;
      const upd = await supabase.from("pedido_conjuntos").update({ fim_previsto: reprog.nova_data }).eq("id", reprogramando.id);
      if (upd.error) throw upd.error;
    },
    onSuccess: () => {
      toast.success("Reprogramação registrada");
      setReprogramando(null);
      setReprog({ nova_data: "", motivo: "" });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criticos = linhas.filter((l) => l.farol === "vermelho").length;
  const desvio = linhas.filter((l) => l.farol === "amarelo").length;

  return (
    <div className="space-y-6">
      <ModuleHeader title="PCP" description="Acompanhamento das demandas POMG: farol, avanço previsto, avanço real e prazo." icon={CalendarRange} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Demandas" value={linhas.length} />
        <MetricCard label="No prazo" value={linhas.length - criticos - desvio} tone="success" />
        <MetricCard label="Com desvio" value={desvio} tone="warning" />
        <MetricCard label="Críticas" value={criticos} tone={criticos ? "danger" : "default"} />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Todas as demandas</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label>Contrato</Label>
              <Select
                value={contrato}
                onValueChange={(v) => {
                  setContrato(v);
                  setSubArea("todas");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os contratos</SelectItem>
                  {contratos.map(([id, nome]) => (
                    <SelectItem key={id} value={id}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full max-w-xs space-y-1.5">
              <Label>Subárea</Label>
              <Select value={subArea} onValueChange={setSubArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as subáreas</SelectItem>
                  {subAreas.map(([id, nome]) => (
                    <SelectItem key={id} value={id}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POMG</TableHead>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Subárea</TableHead>
                  <TableHead>Avanço geral</TableHead>
                  <TableHead>Previsto</TableHead>
                  <TableHead>Real</TableHead>
                  <TableHead>Prazo restante</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Farol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length ? (
                  linhas.map(({ pedido: p, previsto, real, restante, farol }) => (
                    <TableRow key={p.id} className={p.id === pedidoId ? "bg-muted/50" : "cursor-pointer"} onClick={() => setPedidoId(p.id)}>
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="font-mono text-xs">{p.orcamentos?.numero ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <ProgressBar value={real} />
                      </TableCell>
                      <TableCell className="text-xs">{previsto.toFixed(0)}%</TableCell>
                      <TableCell className="text-xs">{real.toFixed(0)}%</TableCell>
                      <TableCell className="text-xs">{restante === null ? "—" : restante < 0 ? `${Math.abs(restante)} dias em atraso` : `${restante} dias`}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={p.pcp_status} onValueChange={(v) => statusMut.mutate({ id: p.id, pcp_status: v })}>
                          <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PCP_STATUS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <FarolDot farol={farol} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      Nenhuma demanda aprovada chegou ao PCP.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PedidoSelect pedidos={pedidos} value={pedidoId} onChange={setPedidoId} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Conjuntos da demanda</CardTitle>
            <p className="text-xs text-muted-foreground">
              {pedido ? `${pedido.pomg_codigo ?? pedido.numero} · situação ${pcpStatusLabel(pedido.pcp_status)} · SLA ${dateBr(pedido.data_sla ?? pedido.prazo_entrega)}` : "Selecione uma demanda"}
            </p>
          </div>
          <Button size="sm" onClick={() => setNovo(true)} disabled={!pedidoId}>
            <Plus className="mr-2 h-4 w-4" />
            Conjunto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG</TableHead>
                  <TableHead>Conjunto</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Avanço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conjuntos.length ? (
                  conjuntos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.tag}</TableCell>
                      <TableCell>
                        <div>{c.codigo}</div>
                        <div className="text-xs text-muted-foreground">{c.descricao}</div>
                      </TableCell>
                      <TableCell>{c.quantidade}</TableCell>
                      <TableCell>{c.peso_kg ? `${c.peso_kg} kg` : "—"}</TableCell>
                      <TableCell>{dateBr(c.fim_previsto)}</TableCell>
                      <TableCell>
                        <ProgressBar value={c.progresso} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.status.replaceAll("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reprogramar"
                          onClick={() => {
                            setReprogramando(c);
                            setReprog({ nova_data: c.fim_previsto ?? "", motivo: "" });
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Nenhum conjunto nesta demanda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {reprogramacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de reprogramações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reprogramacoes.map((r) => (
              <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
                <span>
                  {dateBr(r.data_anterior)} → <strong>{dateBr(r.nova_data)}</strong>
                </span>
                <span className="text-muted-foreground">
                  {r.motivo} · impacto {r.impacto_dias} dias
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo conjunto e TAG</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código">
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </Field>
            <Field label="TAG">
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label="Descrição">
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </Field>
            </div>
            <Field label="Quantidade">
              <Input type="number" min="1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
            </Field>
            <Field label="Peso total (kg)">
              <Input type="number" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} />
            </Field>
            <Field label="Início previsto">
              <Input type="date" value={form.inicio_previsto} onChange={(e) => setForm({ ...form, inicio_previsto: e.target.value })} />
            </Field>
            <Field label="Fim previsto">
              <Input type="date" value={form.fim_previsto} onChange={(e) => setForm({ ...form, fim_previsto: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={() => adicionar.mutate()} disabled={!form.codigo || !form.tag || !form.descricao || adicionar.isPending}>
              Criar conjunto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reprogramando)} onOpenChange={(o) => !o && setReprogramando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar {reprogramando?.tag}</DialogTitle>
          </DialogHeader>
          <Field label="Nova data">
            <Input type="date" value={reprog.nova_data} onChange={(e) => setReprog({ ...reprog, nova_data: e.target.value })} />
          </Field>
          <Field label="Motivo">
            <Textarea value={reprog.motivo} onChange={(e) => setReprog({ ...reprog, motivo: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprogramando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => reprogramar.mutate()} disabled={!reprog.nova_data || !reprog.motivo}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
