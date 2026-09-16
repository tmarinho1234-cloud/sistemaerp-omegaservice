import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
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
import { Factory, OctagonAlert, Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import {
  ATIVIDADES,
  ATIVIDADE_EXTRA,
  FarolDot,
  MetricCard,
  ModuleHeader,
  ProgressBar,
  atividadeLabel,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  hoursBetween,
  useAtividades,
  useConjuntos,
  usePedidos,
  useSincronizacaoTempoReal,
  useTodosConjuntos,
  type Atividade,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({
    meta: [
      { title: "Produção | Omega Service ERP" },
      { name: "description", content: "Execução das atividades por conjunto, quantidades fabricadas, paralisações e atividades não previstas." },
      { property: "og:title", content: "Produção | Omega Service ERP" },
      { property: "og:description", content: "Execução das atividades por conjunto, quantidades fabricadas, paralisações e atividades não previstas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProducaoPage,
});

const MOTIVOS = ["falta_material", "manutencao", "absenteismo", "projeto", "qualidade", "energia", "outros"] as const;
const motivoLabel = (m: string) =>
  ({ falta_material: "Falta de material", manutencao: "Manutenção", absenteismo: "Absenteísmo", projeto: "Projeto/engenharia", qualidade: "Qualidade", energia: "Energia", outros: "Outros" }[m] ?? m);

const STATUS_ATIVIDADE = [
  { value: "nao_iniciada", label: "Não iniciada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "paralisada", label: "Paralisada" },
];

type Paralisacao = { id: string; conjunto_id: string | null; motivo: string; detalhe: string | null; inicio: string; fim: string | null; duracao_horas: number | null };
type NaoPrevista = { id: string; conjunto_id: string | null; nome: string; descricao: string | null; observacao: string | null; status: string; created_at: string };

function ProducaoPage() {
  const qc = useQueryClient();
  useSincronizacaoTempoReal();
  const { data: todosPedidos = [] } = usePedidos();
  const pedidos = useMemo(() => todosPedidos.filter((p) => p.producao_iniciada), [todosPedidos]);
  const [pedidoId, setPedidoId] = useState("");
  useEffect(() => {
    if (!pedidoId && pedidos[0]) setPedidoId(pedidos[0].id);
  }, [pedidoId, pedidos]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const { data: todosConjuntos = [] } = useTodosConjuntos();
  const { data: conjuntos = [] } = useConjuntos(pedidoId);
  const { data: atividades = [] } = useAtividades(pedidoId);

  const linhas = useMemo(
    () =>
      pedidos.map((p) => {
        const cs = todosConjuntos.filter((c) => c.pedido_id === p.id);
        const real = cs.length ? cs.reduce((s, c) => s + Number(c.progresso), 0) / cs.length : 0;
        const restante = diasRestantes(p.data_sla ?? p.prazo_entrega);
        const fabricadas = cs.reduce((s, c) => s + Number(c.quantidade_fabricada ?? 0), 0);
        const totalQtd = cs.reduce((s, c) => s + Number(c.quantidade ?? 0), 0);
        const pesoTotal = cs.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);
        const pesoFab = cs.reduce((s, c) => s + Number(c.peso_fabricado_kg ?? 0), 0);
        return { pedido: p, real, restante, fabricadas, totalQtd, pesoFab, pesoTotal, farol: calcularFarol({ previsto: avancoPrevisto(cs), real, restante, status: p.pcp_status }) };
      }),
    [pedidos, todosConjuntos],
  );

  const [editando, setEditando] = useState<Atividade | null>(null);
  const [ef, setEf] = useState({ quantidade: "", percent: "" });
  const [prontos, setProntos] = useState<Record<string, string>>({});
  const [extraOpen, setExtraOpen] = useState(false);
  const [extra, setExtra] = useState({ conjunto_id: "", nome: "" });
  const [paradaOpen, setParadaOpen] = useState(false);
  const [pf, setPf] = useState({ conjunto_id: "pedido", motivo: "falta_material", detalhe: "", inicio: new Date().toISOString().slice(0, 16) });
  const [naoPrevOpen, setNaoPrevOpen] = useState(false);
  const [npf, setNpf] = useState({ conjunto_id: "pedido", nome: "", descricao: "", observacao: "" });

  const { data: paralisacoes = [] } = useQuery({
    queryKey: ["paralisacoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("paralisacoes").select("*").eq("pedido_id", pedidoId).order("inicio", { ascending: false });
      if (error) throw error;
      return data as Paralisacao[];
    },
  });

  const { data: naoPrevistas = [] } = useQuery({
    queryKey: ["atividades-nao-previstas", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("atividades_nao_previstas").select("*").eq("pedido_id", pedidoId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as NaoPrevista[];
    },
  });

  const totais = useMemo(() => {
    const total = conjuntos.reduce((s, c) => s + Number(c.quantidade), 0);
    const fabricada = conjuntos.reduce((s, c) => s + Number(c.quantidade_fabricada ?? 0), 0);
    const peso = conjuntos.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);
    const pesoFab = conjuntos.reduce((s, c) => s + Number(c.peso_fabricado_kg ?? 0), 0);
    const horasParadas = paralisacoes.reduce((s, p) => s + (p.duracao_horas !== null ? Number(p.duracao_horas) : hoursBetween(p.inicio, p.fim)), 0);
    return { total, fabricada, restante: total - fabricada, peso, pesoFab, horasParadas };
  }, [conjuntos, paralisacoes]);

  const salvarAtividade = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      const conjunto = conjuntos.find((c) => c.id === editando.conjunto_id);
      const totalQtd = Number(conjunto?.quantidade ?? 0);
      const percent = Math.max(0, Math.min(100, Number(ef.percent || 0)));
      const quantidade = totalQtd ? (percent / 100) * totalQtd : 0;
      const status = percent >= 100 ? "concluida" : percent > 0 ? "em_andamento" : "nao_iniciada";
      const { error } = await supabase
        .from("pedido_conjunto_atividades")
        .update({ status, quantidade_executada: quantidade })
        .eq("id", editando.id);
      if (error) throw error;
      await recalcularConjunto(editando.conjunto_id);
    },
    onSuccess: () => {
      toast.success("Atividade atualizada");
      setEditando(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Informa quantos conjuntos estão prontos; sobe o avanço das atividades atrasadas. */
  const salvarProntos = useMutation({
    mutationFn: async (conjuntoId: string) => {
      const conjunto = conjuntos.find((c) => c.id === conjuntoId);
      const total = Number(conjunto?.quantidade ?? 0);
      const desejada = Math.max(0, Number(prontos[conjuntoId] || 0));
      const qtd = total ? Math.min(total, desejada) : desejada;
      const lista = atividades.filter((a) => a.conjunto_id === conjuntoId);
      for (const a of lista) {
        if (Number(a.quantidade_executada ?? 0) >= qtd) continue;
        const status = total > 0 && qtd >= total ? "concluida" : qtd > 0 ? "em_andamento" : "nao_iniciada";
        const { error } = await supabase.from("pedido_conjunto_atividades").update({ quantidade_executada: qtd, status }).eq("id", a.id);
        if (error) throw error;
      }
      await recalcularConjunto(conjuntoId);
    },
    onSuccess: () => {
      toast.success("Quantidade pronta registrada");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExtra = useMutation({
    mutationFn: async () => {
      if (!pedidoId || !extra.conjunto_id) throw new Error("Selecione o conjunto");
      const ordem = atividades.filter((a) => a.conjunto_id === extra.conjunto_id).length;
      const { error } = await supabase.from("pedido_conjunto_atividades").insert({ pedido_id: pedidoId, conjunto_id: extra.conjunto_id, atividade: ATIVIDADE_EXTRA, nome_extra: extra.nome, ordem });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atividade extra adicionada");
      setExtraOpen(false);
      setExtra({ conjunto_id: "", nome: "" });
      qc.invalidateQueries({ queryKey: ["atividades-conjunto", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const registrarParada = useMutation({
    mutationFn: async () => {
      if (!pedidoId) return;
      const { error } = await supabase.from("paralisacoes").insert({ pedido_id: pedidoId, conjunto_id: pf.conjunto_id === "pedido" ? null : pf.conjunto_id, motivo: pf.motivo, detalhe: pf.detalhe || null, inicio: new Date(pf.inicio).toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paralisação registrada");
      setParadaOpen(false);
      setPf({ conjunto_id: "pedido", motivo: "falta_material", detalhe: "", inicio: new Date().toISOString().slice(0, 16) });
      qc.invalidateQueries({ queryKey: ["paralisacoes", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encerrarParada = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paralisacoes").update({ fim: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paralisacoes", pedidoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const registrarNaoPrevista = useMutation({
    mutationFn: async () => {
      if (!pedidoId) return;
      const { error } = await supabase.from("atividades_nao_previstas").insert({ pedido_id: pedidoId, conjunto_id: npf.conjunto_id === "pedido" ? null : npf.conjunto_id, nome: npf.nome, descricao: npf.descricao || null, observacao: npf.observacao || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atividade não prevista registrada");
      setNaoPrevOpen(false);
      setNpf({ conjunto_id: "pedido", nome: "", descricao: "", observacao: "" });
      qc.invalidateQueries({ queryKey: ["atividades-nao-previstas", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusNaoPrevista = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("atividades_nao_previstas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atividades-nao-previstas", pedidoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Produção"
        description="Atividades por conjunto, quantidades fabricadas, paralisações e atividades não previstas."
        icon={Factory}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setNaoPrevOpen(true)} disabled={!pedidoId}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Atividade/ensaio não previsto
            </Button>
            <Button variant="outline" onClick={() => setParadaOpen(true)} disabled={!pedidoId}>
              <OctagonAlert className="mr-2 h-4 w-4" />
              Paralisação
            </Button>
            <Button onClick={() => setExtraOpen(true)} disabled={!conjuntos.length}>
              <Plus className="mr-2 h-4 w-4" />
              Atividade extra
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandas em produção</CardTitle>
          <p className="text-xs text-muted-foreground">Clique em uma demanda para acompanhar a produção dos conjuntos.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POMG</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Subárea</TableHead>
                  <TableHead>Peso fabricado / total</TableHead>
                  <TableHead>Avanço</TableHead>
                  <TableHead>Prazo / SLA</TableHead>
                  <TableHead>Farol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length ? (
                  linhas.map(({ pedido: p, real, restante, pesoFab, pesoTotal, farol }) => (
                    <TableRow
                      key={p.id}
                      className={cn("cursor-pointer", p.id === pedidoId && "bg-muted font-medium ring-1 ring-inset ring-primary/30")}
                      onClick={() => setPedidoId(p.id)}
                    >
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <span className="font-medium">{pesoFab.toFixed(0)} kg</span>
                        <span className="text-muted-foreground"> de {pesoTotal.toFixed(0)} kg</span>
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={real} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {dateBr(p.data_sla ?? p.prazo_entrega)}
                        {restante !== null && (
                          <span className={cn("ml-2", restante < 0 ? "text-destructive" : "text-muted-foreground")}>
                            {restante < 0 ? `${Math.abs(restante)}d em atraso` : `${restante}d`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <FarolDot farol={farol} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Nenhuma demanda iniciada. Use "Iniciar produção" no PCP para liberar a demanda aqui.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="A fabricar" value={totais.total} detail={`${totais.peso.toFixed(0)} kg previstos`} />
        <MetricCard label="Já fabricado" value={totais.fabricada} detail={`${totais.pesoFab.toFixed(0)} kg`} tone="success" />
        <MetricCard label="Restante" value={totais.restante} tone={totais.restante ? "warning" : "success"} />
        <MetricCard label="Horas paradas" value={totais.horasParadas.toFixed(1)} tone={totais.horasParadas ? "danger" : "default"} />
      </div>

      {pedido && (
        <p className="text-xs text-muted-foreground">
          Demanda {pedido.pomg_codigo ?? pedido.numero} · proposta {pedido.orcamentos?.numero ?? "—"} · SLA {dateBr(pedido.data_sla ?? pedido.prazo_entrega)}
        </p>
      )}

      {conjuntos.length ? (
        conjuntos.map((c) => {
          const lista = atividades.filter((a) => a.conjunto_id === c.id);
          const restante = Number(c.quantidade) - Number(c.quantidade_fabricada ?? 0);
          return (
            <Card key={c.id}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    <span className="font-mono">{c.tag} · {pedido?.pomg_codigo ?? pedido?.numero ?? "—"}</span> · {c.codigo}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {c.descricao} · total {c.quantidade} · fabricado {Number(c.quantidade_fabricada ?? 0)} · restante {restante} · peso {c.peso_kg ? `${c.peso_kg} kg` : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Conjuntos prontos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={Number(c.quantidade)}
                        className="h-9 w-24"
                        value={prontos[c.id] ?? String(Number(c.quantidade_fabricada ?? 0))}
                        onChange={(e) => setProntos({ ...prontos, [c.id]: e.target.value })}
                      />
                      <Button size="sm" variant="outline" onClick={() => salvarProntos.mutate(c.id)} disabled={salvarProntos.isPending}>
                        Aplicar
                      </Button>
                    </div>
                  </div>
                  <ProgressBar value={c.progresso} />
                  <Badge variant="outline">{c.status.replaceAll("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Atividade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Avanço</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.length ? (
                        lista.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{atividadeLabel(a.atividade, a.nome_extra)}</TableCell>
                            <TableCell>
                              <Badge variant={a.status === "concluida" ? "default" : a.status === "paralisada" ? "destructive" : "outline"}>
                                {STATUS_ATIVIDADE.find((s) => s.value === a.status)?.label ?? a.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {c.quantidade ? `${Math.min(100, (Number(a.quantidade_executada ?? 0) / Number(c.quantidade)) * 100).toFixed(0)}%` : "0%"}
                            </TableCell>

                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const total = Number(c.quantidade ?? 0);
                                  const q = Number(a.quantidade_executada ?? 0);
                                  setEditando(a);
                                  setEf({ quantidade: String(q), percent: total ? String(Math.round((q / total) * 1000) / 10) : "0" });
                                }}
                              >
                                Apontar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                            Nenhuma atividade definida para este conjunto.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Esta demanda ainda não tem conjuntos criados.</CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paralisações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paralisacoes.length ? (
              paralisacoes.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                  <div>
                    <div className="font-medium">{motivoLabel(p.motivo)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.inicio).toLocaleString("pt-BR")} · {(p.duracao_horas !== null ? Number(p.duracao_horas) : hoursBetween(p.inicio, p.fim)).toFixed(1)} h {p.detalhe ? `· ${p.detalhe}` : ""}
                    </div>
                  </div>
                  {p.fim ? <Badge variant="outline">Encerrada</Badge> : <Button size="sm" onClick={() => encerrarParada.mutate(p.id)}>Encerrar</Button>}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma paralisação registrada.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividades e ensaios não previstos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {naoPrevistas.length ? (
              naoPrevistas.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                  <div>
                    <div className="font-medium">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">{a.descricao ?? "—"}{a.observacao ? ` · ${a.observacao}` : ""}</div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => statusNaoPrevista.mutate({ id: a.id, status: v })}>
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["aberta", "em_andamento", "concluida", "cancelada"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade fora do previsto.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editando)} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apontar {editando ? atividadeLabel(editando.atividade, editando.nome_extra) : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Avanço (%)">
              <Input type="number" min="0" max="100" value={ef.percent} onChange={(e) => setEf({ quantidade: "", percent: e.target.value })} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => salvarAtividade.mutate()} disabled={salvarAtividade.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={extraOpen} onOpenChange={setExtraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atividade extra</DialogTitle>
          </DialogHeader>
          <Field label="Conjunto">
            <Select value={extra.conjunto_id} onValueChange={(v) => setExtra({ ...extra, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {conjuntos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tag} · {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nome da atividade">
            <Input value={extra.nome} onChange={(e) => setExtra({ ...extra, nome: e.target.value })} placeholder="Ex.: Jateamento" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtraOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => addExtra.mutate()} disabled={!extra.conjunto_id || !extra.nome}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paradaOpen} onOpenChange={setParadaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar paralisação</DialogTitle>
          </DialogHeader>
          <Field label="Conjunto">
            <Select value={pf.conjunto_id} onValueChange={(v) => setPf({ ...pf, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pedido">Toda a demanda</SelectItem>
                {conjuntos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tag} · {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Motivo">
            <Select value={pf.motivo} onValueChange={(v) => setPf({ ...pf, motivo: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {motivoLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Início">
            <Input type="datetime-local" value={pf.inicio} onChange={(e) => setPf({ ...pf, inicio: e.target.value })} />
          </Field>
          <Field label="Detalhe">
            <Textarea value={pf.detalhe} onChange={(e) => setPf({ ...pf, detalhe: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParadaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => registrarParada.mutate()}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={naoPrevOpen} onOpenChange={setNaoPrevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atividade ou ensaio não previsto</DialogTitle>
          </DialogHeader>
          <Field label="Conjunto">
            <Select value={npf.conjunto_id} onValueChange={(v) => setNpf({ ...npf, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pedido">Toda a demanda</SelectItem>
                {conjuntos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tag} · {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nome">
            <Input value={npf.nome} onChange={(e) => setNpf({ ...npf, nome: e.target.value })} placeholder="Ex.: Ultrassom adicional" />
          </Field>
          <Field label="Descrição">
            <Textarea value={npf.descricao} onChange={(e) => setNpf({ ...npf, descricao: e.target.value })} />
          </Field>
          <Field label="Observação">
            <Textarea value={npf.observacao} onChange={(e) => setNpf({ ...npf, observacao: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNaoPrevOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => registrarNaoPrevista.mutate()} disabled={!npf.nome}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Recalcula avanço médio, quantidade e peso fabricados do conjunto. */
async function recalcularConjunto(conjuntoId: string) {
  const { data: cj, error: ce } = await supabase.from("pedido_conjuntos").select("*").eq("id", conjuntoId).maybeSingle();
  if (ce) throw ce;
  const { data: lista, error: le } = await supabase.from("pedido_conjunto_atividades").select("*").eq("conjunto_id", conjuntoId);
  if (le) throw le;
  const todas = (lista ?? []) as unknown as Atividade[];
  const total = Number(cj?.quantidade ?? 0);
  const percents = todas.map((a) => (total ? Math.min(100, (Number(a.quantidade_executada ?? 0) / total) * 100) : 0));
  const progresso = percents.length ? percents.reduce((s, p) => s + p, 0) / percents.length : 0;
  const fabricada = todas.length ? Math.min(...todas.map((a) => Number(a.quantidade_executada ?? 0))) : 0;
  const pesoFab = cj?.peso_kg && total ? (Number(cj.peso_kg) * fabricada) / total : 0;
  const statusConjunto = progresso >= 100 ? "aguardando_qualidade" : progresso > 0 ? "em_producao" : "planejado";
  const upd = await supabase
    .from("pedido_conjuntos")
    .update({ progresso, quantidade_fabricada: fabricada, peso_fabricado_kg: pesoFab, ...(cj?.liberado_qualidade ? {} : { status: statusConjunto }) })
    .eq("id", conjuntoId);
  if (upd.error) throw upd.error;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

