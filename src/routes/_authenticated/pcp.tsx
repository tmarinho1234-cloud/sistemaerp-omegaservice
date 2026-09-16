import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { CalendarRange, Play, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import {
  FarolDot,
  MetricCard,
  ModuleHeader,
  PCP_STATUS,
  ProgressBar,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  moneyBr,
  pcpStatusLabel,
  useConjuntos,
  usePedidos,
  useSincronizacaoTempoReal,
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
  useSincronizacaoTempoReal();
  const { data: pedidos = [] } = usePedidos();
  const { data: todosConjuntos = [] } = useTodosConjuntos();
  const [contrato, setContrato] = useState("todos");
  const [subArea, setSubArea] = useState("todas");
  const [pedidoId, setPedidoId] = useState("");
  const [reprogramando, setReprogramando] = useState<ConjuntoResumo | null>(null);
  const [reprog, setReprog] = useState({ nova_data: "", motivo: "" });
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

  const detalhe = linhas.find((l) => l.pedido.id === pedidoId);

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

  const iniciarProducao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ producao_iniciada: true, data_inicio_producao: new Date().toISOString(), pcp_status: "em_fabricacao", status: "em_producao" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produção iniciada — a demanda já aparece no módulo de Produção");
      qc.invalidateQueries({ queryKey: ["pedidos-operacionais"] });
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
  const pesoTotal = conjuntos.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);

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
          <p className="text-xs text-muted-foreground">Clique em uma demanda para ver o detalhamento e os conjuntos.</p>
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
                  <TableHead>Contrato</TableHead>
                  <TableHead>Subárea</TableHead>
                  <TableHead>Avanço geral</TableHead>
                  <TableHead>Previsto</TableHead>
                  <TableHead>Real</TableHead>
                  <TableHead>Prazo restante</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Farol</TableHead>
                  <TableHead>Produção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length ? (
                  linhas.map(({ pedido: p, previsto, real, restante, farol }) => (
                    <TableRow key={p.id} className={p.id === pedidoId ? "bg-muted/50 cursor-pointer" : "cursor-pointer"} onClick={() => setPedidoId(p.id === pedidoId ? "" : p.id)}>
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {p.producao_iniciada ? (
                          <Badge variant="outline">Iniciada em {dateBr(p.data_inicio_producao)}</Badge>
                        ) : (
                          <Button size="sm" onClick={() => iniciarProducao.mutate(p.id)} disabled={iniciarProducao.isPending}>
                            <Play className="mr-2 h-4 w-4" />
                            Iniciar produção
                          </Button>
                        )}
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

      {pedido && detalhe && (
        <>
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Detalhamento · {pedido.pomg_codigo ?? pedido.numero}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {pedido.contratos?.empresa ?? "—"} · {pedido.contratos?.nome ?? "—"} · {pedido.sub_areas?.nome ?? "Sem subárea"}
                </p>
              </div>
              <Button size="icon" variant="ghost" title="Fechar" onClick={() => setPedidoId("")}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Situação" value={pcpStatusLabel(pedido.pcp_status)} />
              <Info label="Prazo (dias)" value={pedido.prazo_dias ? String(pedido.prazo_dias) : "—"} />
              <Info label="Data SLA" value={dateBr(pedido.data_sla ?? pedido.prazo_entrega)} />
              <Info label="Prazo restante" value={detalhe.restante === null ? "—" : detalhe.restante < 0 ? `${Math.abs(detalhe.restante)} dias em atraso` : `${detalhe.restante} dias`} />
              <Info label="Avanço previsto" value={`${detalhe.previsto.toFixed(0)}%`} />
              <Info label="Avanço real" value={`${detalhe.real.toFixed(0)}%`} />
              <Info label="Valor" value={moneyBr(pedido.valor_total)} />
              <Info label="Peso total" value={`${pesoTotal.toLocaleString("pt-BR")} kg`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conjuntos da demanda</CardTitle>
              <p className="text-xs text-muted-foreground">Os conjuntos e suas atividades são criados no módulo de Orçamentos.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TAG</TableHead>
                      <TableHead>Conjunto</TableHead>
                      <TableHead>Qtd.</TableHead>
                      <TableHead>Fabricado</TableHead>
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
                          <TableCell className="font-mono font-medium">{c.tag} · {pedido.pomg_codigo ?? pedido.numero}</TableCell>
                          <TableCell>
                            <div>{c.codigo}</div>
                            <div className="text-xs text-muted-foreground">{c.descricao}</div>
                          </TableCell>
                          <TableCell>{c.quantidade}</TableCell>
                          <TableCell className="text-xs">
                            {c.quantidade_fabricada} de {c.quantidade}
                          </TableCell>
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
                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                          Nenhum conjunto nesta demanda. Crie os conjuntos no módulo de Orçamentos.
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
        </>
      )}

      <Dialog open={Boolean(reprogramando)} onOpenChange={(o) => !o && setReprogramando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar {reprogramando?.tag} · {pedido?.pomg_codigo ?? pedido?.numero ?? ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nova data</Label>
            <Input type="date" value={reprog.nova_data} onChange={(e) => setReprog({ ...reprog, nova_data: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Textarea value={reprog.motivo} onChange={(e) => setReprog({ ...reprog, motivo: e.target.value })} />
          </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
