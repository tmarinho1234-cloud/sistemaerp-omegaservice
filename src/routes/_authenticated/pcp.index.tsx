import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarRange, Play } from "lucide-react";
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
  diffDias,
  prazoOriginal,
  prazoVigente,
  useSincronizacaoTempoReal,
  usePedidos,
  useTodosConjuntos,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/pcp/")({
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
  component: PcpListaPage,
});

function PcpListaPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  useSincronizacaoTempoReal();
  const { data: pedidos = [] } = usePedidos();
  const { data: todosConjuntos = [] } = useTodosConjuntos();
  const [contrato, setContrato] = useState("todos");
  const [subArea, setSubArea] = useState("todas");

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
          const restante = diasRestantes(prazoVigente(p));
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
          <p className="text-xs text-muted-foreground">Clique em uma demanda para abrir a página de detalhe.</p>
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
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Aquisição</TableHead>
                  <TableHead>Chegada materiais / início prev.</TableHead>
                  <TableHead>Início real</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Entrega reprogramada</TableHead>
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
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate({ to: "/pcp/$pedidoId", params: { pedidoId: p.id } })}>
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{dateBr(p.data_aprovacao)}</TableCell>
                      <TableCell className="text-xs">{p.prazo_aquisicao_dias ? `${p.prazo_aquisicao_dias} dias úteis` : "sem aquisição"}</TableCell>
                      <TableCell className="text-xs">
                        {dateBr(p.data_chegada_materiais)}
                        {p.data_chegada_materiais_original && p.data_chegada_materiais_original !== p.data_chegada_materiais && (
                          <span className="ml-1 text-muted-foreground line-through">{dateBr(p.data_chegada_materiais_original)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{p.producao_iniciada ? dateBr(p.data_inicio_producao) : "—"}</TableCell>
                      <TableCell className="text-xs">{dateBr(p.prazo_entrega ?? p.data_sla)}</TableCell>
                      <TableCell className="text-xs">
                        {p.data_entrega_reprogramada ? (
                          <>
                            <div className="font-semibold">{dateBr(p.data_entrega_reprogramada)}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {(() => {
                                const d = diffDias(prazoOriginal(p), p.data_entrega_reprogramada);
                                return d === null ? "—" : d === 0 ? "sem alteração" : `${d > 0 ? "+" : ""}${d} dias vs. original`;
                              })()}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
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
                    <TableCell colSpan={16} className="py-10 text-center text-muted-foreground">
                      Nenhuma demanda aprovada chegou ao PCP.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
