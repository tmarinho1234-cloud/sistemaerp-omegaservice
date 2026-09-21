import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { CalendarClock, Play, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { PcpTimeline } from "@/components/pcp-timeline";
import { DetailEmpty, DetailShell, Info } from "@/components/detail-page";
import {
  FarolDot,
  ProgressBar,
  avancoPrevisto,
  baseFabricacao,
  calcularFarol,
  dateBr,
  diasRestantes,
  diffDias,
  moneyBr,
  pcpStatusLabel,
  prazoOriginal,
  prazoVigente,
  somarDiasUteis,
  useConjuntos,
  useFeriados,
  usePedidos,
  useSincronizacaoTempoReal,
  type ConjuntoResumo,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/pcp/$pedidoId")({
  head: () => ({
    meta: [
      { title: "Detalhe da demanda · PCP | Omega Service ERP" },
      { name: "description", content: "Detalhamento da demanda POMG no PCP: prazos, conjuntos, linha do tempo e reprogramações." },
      { property: "og:title", content: "Detalhe da demanda · PCP | Omega Service ERP" },
      { property: "og:description", content: "Detalhamento da demanda POMG no PCP: prazos, conjuntos, linha do tempo e reprogramações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PcpDetalhePage,
});

type Reprogramacao = { id: string; conjunto_id: string | null; data_anterior: string | null; nova_data: string; motivo: string; impacto_dias: number; tipo: string; created_at: string };

function PcpDetalhePage() {
  const { pedidoId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  useSincronizacaoTempoReal();
  const { data: pedidos = [], isLoading } = usePedidos();
  const { data: conjuntos = [] } = useConjuntos(pedidoId);
  const { data: feriados = [] } = useFeriados();
  const datasFeriados = useMemo(() => feriados.map((f) => f.data), [feriados]);

  const [reprogramando, setReprogramando] = useState<ConjuntoResumo | null>(null);
  const [reprog, setReprog] = useState({ nova_data: "", motivo: "" });
  const [aquisicaoOpen, setAquisicaoOpen] = useState(false);
  const [aquisicao, setAquisicao] = useState({ dias: "", motivo: "" });
  const [entregaOpen, setEntregaOpen] = useState(false);
  const [entrega, setEntrega] = useState({ dias: "", nova_data: "", motivo: "" });

  const pedido = pedidos.find((p) => p.id === pedidoId);
  const indice = pedidos.findIndex((p) => p.id === pedidoId);
  const anterior = indice > 0 ? pedidos[indice - 1] : undefined;
  const proximo = indice >= 0 && indice < pedidos.length - 1 ? pedidos[indice + 1] : undefined;

  const { data: reprogramacoes = [] } = useQuery({
    queryKey: ["reprogramacoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("pcp_reprogramacoes").select("*").eq("pedido_id", pedidoId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reprogramacao[];
    },
  });

  const iniciarProducao = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pedidos")
        .update({ producao_iniciada: true, data_inicio_producao: new Date().toISOString(), pcp_status: "em_fabricacao", status: "em_producao" })
        .eq("id", pedidoId);
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
      if (!reprogramando) return;
      const anteriorData = reprogramando.fim_previsto;
      const impacto = anteriorData && reprog.nova_data ? Math.round((new Date(reprog.nova_data).getTime() - new Date(anteriorData).getTime()) / 86400000) : 0;
      const { error } = await supabase
        .from("pcp_reprogramacoes")
        .insert({ pedido_id: pedidoId, conjunto_id: reprogramando.id, data_anterior: anteriorData, nova_data: reprog.nova_data, motivo: reprog.motivo, impacto_dias: impacto });
      if (error) throw error;
      const upd = await supabase.from("pedido_conjuntos").update({ fim_previsto: reprog.nova_data }).eq("id", reprogramando.id);
      if (upd.error) throw upd.error;
    },
    onSuccess: () => {
      toast.success("Reprogramação registrada");
      setReprogramando(null);
      setReprog({ nova_data: "", motivo: "" });
      qc.invalidateQueries({ queryKey: ["conjuntos"] });
      qc.invalidateQueries({ queryKey: ["todos-conjuntos"] });
      qc.invalidateQueries({ queryKey: ["reprogramacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const novaChegada = somarDiasUteis(pedido?.data_aprovacao, aquisicao.dias ? Number(aquisicao.dias) : null, datasFeriados);

  const reprogramarAquisicao = useMutation({
    mutationFn: async () => {
      if (!pedido) return;
      if (!pedido.data_aprovacao) throw new Error("Esta demanda não tem data de aprovação registrada");
      const dias = Number(aquisicao.dias);
      if (!dias || dias < 0) throw new Error("Informe o novo prazo de aquisição em dias úteis");
      const nova = somarDiasUteis(pedido.data_aprovacao, dias, datasFeriados);
      if (!nova) throw new Error("Não foi possível calcular a nova data");
      const anteriorData = pedido.data_chegada_materiais;
      const impacto = anteriorData ? Math.round((new Date(`${nova}T12:00:00`).getTime() - new Date(`${anteriorData}T12:00:00`).getTime()) / 86400000) : 0;
      const ins = await supabase.from("pcp_reprogramacoes").insert({
        pedido_id: pedido.id,
        data_anterior: anteriorData,
        nova_data: nova,
        motivo: `Aquisição de materiais: ${dias} dias úteis — ${aquisicao.motivo}`,
        impacto_dias: impacto,
        tipo: "aquisicao",
      });
      if (ins.error) throw ins.error;
      const upd = await supabase
        .from("pedidos")
        .update({
          prazo_aquisicao_dias: dias,
          data_chegada_materiais: nova,
          data_chegada_materiais_original: pedido.data_chegada_materiais_original ?? anteriorData ?? nova,
        })
        .eq("id", pedido.id);
      if (upd.error) throw upd.error;
    },
    onSuccess: () => {
      toast.success("Prazo de aquisição atualizado e nova data de chegada calculada");
      setAquisicaoOpen(false);
      setAquisicao({ dias: "", motivo: "" });
      qc.invalidateQueries({ queryKey: ["pedidos-operacionais"] });
      qc.invalidateQueries({ queryKey: ["reprogramacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const baseEntrega = pedido ? baseFabricacao(pedido) : null;
  const impactoEntrega = pedido && entrega.nova_data ? diffDias(prazoVigente(pedido), entrega.nova_data) : null;

  const reprogramarEntrega = useMutation({
    mutationFn: async () => {
      if (!pedido) return;
      const { error } = await supabase.rpc("reprogramar_entrega_pedido", {
        p_pedido_id: pedido.id,
        p_nova_data: entrega.nova_data,
        p_motivo: entrega.motivo,
        p_prazo_fabricacao_dias: entrega.dias ? Number(entrega.dias) : undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nova data de entrega registrada");
      setEntregaOpen(false);
      setEntrega({ dias: "", nova_data: "", motivo: "" });
      qc.invalidateQueries({ queryKey: ["pedidos-operacionais"] });
      qc.invalidateQueries({ queryKey: ["reprogramacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voltar = () => navigate({ to: "/pcp" });

  if (!pedido) {
    return <DetailEmpty modulo="PCP" onBack={voltar} message={isLoading ? "Carregando demanda..." : "Demanda não encontrada."} />;
  }

  const previsto = avancoPrevisto(conjuntos);
  const real = conjuntos.length ? conjuntos.reduce((s, c) => s + Number(c.progresso), 0) / conjuntos.length : 0;
  const restante = diasRestantes(prazoVigente(pedido));
  const farol = calcularFarol({ previsto, real, restante, status: pedido.pcp_status });
  const pesoTotal = conjuntos.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);

  return (
    <DetailShell
      modulo="PCP"
      title={pedido.pomg_codigo ?? pedido.numero}
      subtitle={`${pedido.contratos?.empresa ?? "—"} · ${pedido.contratos?.nome ?? "—"} · ${pedido.sub_areas?.nome ?? "Sem subárea"}`}
      badges={
        <>
          <Badge variant="outline">{pcpStatusLabel(pedido.pcp_status)}</Badge>
          <FarolDot farol={farol} />
        </>
      }
      onBack={voltar}
      onPrev={anterior ? () => navigate({ to: "/pcp/$pedidoId", params: { pedidoId: anterior.id } }) : undefined}
      onNext={proximo ? () => navigate({ to: "/pcp/$pedidoId", params: { pedidoId: proximo.id } }) : undefined}
      prevLabel={anterior?.pomg_codigo ?? undefined}
      nextLabel={proximo?.pomg_codigo ?? undefined}
      actions={
        <>
          {!pedido.producao_iniciada && (
            <Button size="sm" onClick={() => iniciarProducao.mutate()} disabled={iniciarProducao.isPending}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar produção
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAquisicao({ dias: String(pedido.prazo_aquisicao_dias ?? ""), motivo: "" });
              setAquisicaoOpen(true);
            }}
          >
            <Truck className="mr-2 h-4 w-4" />
            Prazo de aquisição
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEntrega({ dias: String(pedido.prazo_fabricacao_dias ?? ""), nova_data: pedido.data_entrega_reprogramada ?? "", motivo: "" });
              setEntregaOpen(true);
            }}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Reprogramar entrega
          </Button>
        </>
      }
    >
      <PcpTimeline pedido={pedido} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Situação" value={pcpStatusLabel(pedido.pcp_status)} />
          <Info label="Prazo (dias)" value={pedido.prazo_dias ? String(pedido.prazo_dias) : "—"} />
          <Info label="Data SLA" value={dateBr(pedido.data_sla ?? pedido.prazo_entrega)} />
          <Info label="Prazo restante" value={restante === null ? "—" : restante < 0 ? `${Math.abs(restante)} dias em atraso` : `${restante} dias`} />
          <Info label="Avanço previsto" value={`${previsto.toFixed(0)}%`} />
          <Info label="Avanço real" value={`${real.toFixed(0)}%`} />
          <Info label="Valor" value={moneyBr(pedido.valor_total)} />
          <Info label="Peso total" value={`${pesoTotal.toLocaleString("pt-BR")} kg`} />
          <Info label="Início de fabricação" value={pedido.producao_iniciada ? dateBr(pedido.data_inicio_producao) : "Não iniciada"} />
          <Info label="Data de aprovação" value={dateBr(pedido.data_aprovacao)} />
          <Info label="Prazo de aquisição" value={pedido.prazo_aquisicao_dias ? `${pedido.prazo_aquisicao_dias} dias úteis` : "Sem aquisição"} />
          <Info
            label="Chegada materiais / início prev."
            value={
              pedido.data_chegada_materiais_original && pedido.data_chegada_materiais_original !== pedido.data_chegada_materiais
                ? `${dateBr(pedido.data_chegada_materiais)} (original ${dateBr(pedido.data_chegada_materiais_original)})`
                : dateBr(pedido.data_chegada_materiais)
            }
          />
          <Info label="Prazo de fabricação" value={pedido.prazo_fabricacao_dias != null ? `${pedido.prazo_fabricacao_dias} dias úteis` : "—"} />
          <Info
            label="Entrega reprogramada"
            value={pedido.data_entrega_reprogramada ? `${dateBr(pedido.data_entrega_reprogramada)} (original ${dateBr(prazoOriginal(pedido))})` : "Sem reprogramação"}
          />
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
                      <TableCell className="font-mono font-medium">
                        {c.tag} · {pedido.pomg_codigo ?? pedido.numero}
                      </TableCell>
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
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{r.tipo === "aquisicao" ? "Aquisição" : r.tipo === "entrega_pedido" ? "Entrega da demanda" : "Conjunto"}</Badge>
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

      <Dialog open={Boolean(reprogramando)} onOpenChange={(o) => !o && setReprogramando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reprogramar {reprogramando?.tag} · {pedido.pomg_codigo ?? pedido.numero}
            </DialogTitle>
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

      <Dialog open={aquisicaoOpen} onOpenChange={setAquisicaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prazo de aquisição · {pedido.pomg_codigo ?? pedido.numero}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Aprovação em {dateBr(pedido.data_aprovacao)} · chegada atual {dateBr(pedido.data_chegada_materiais)}
          </p>
          <div className="space-y-1.5">
            <Label>Prazo de aquisição (dias úteis)</Label>
            <Input type="number" min="0" value={aquisicao.dias} onChange={(e) => setAquisicao({ ...aquisicao, dias: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo da reprogramação</Label>
            <Textarea value={aquisicao.motivo} onChange={(e) => setAquisicao({ ...aquisicao, motivo: e.target.value })} />
          </div>
          <p className="text-sm">
            Nova chegada dos materiais / início da fabricação: <strong>{dateBr(novaChegada)}</strong>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAquisicaoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => reprogramarAquisicao.mutate()} disabled={!aquisicao.dias || !aquisicao.motivo || reprogramarAquisicao.isPending}>
              Recalcular e registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={entregaOpen} onOpenChange={setEntregaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar entrega · {pedido.pomg_codigo ?? pedido.numero}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Entrega original {dateBr(prazoOriginal(pedido))}
            {pedido.data_entrega_reprogramada ? ` · reprogramada atual ${dateBr(pedido.data_entrega_reprogramada)}` : ""}
          </p>
          <div className="space-y-1.5">
            <Label>Prazo de fabricação (dias úteis)</Label>
            <Input
              type="number"
              min="0"
              disabled={!baseEntrega}
              value={entrega.dias}
              onChange={(e) => {
                const dias = e.target.value;
                const nova = somarDiasUteis(baseEntrega, dias ? Number(dias) : null, datasFeriados);
                setEntrega((s) => ({ ...s, dias, nova_data: nova ?? s.nova_data }));
              }}
            />
            <p className="text-xs text-muted-foreground">
              {baseEntrega
                ? `Contagem a partir de ${dateBr(baseEntrega)} (${pedido.producao_iniciada && pedido.data_inicio_producao ? "início da produção" : "chegada dos materiais"}), ignorando sábados, domingos e feriados cadastrados.`
                : "Sem data-base para contagem — informe a nova data de entrega manualmente."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Nova data de entrega</Label>
            <Input type="date" value={entrega.nova_data} onChange={(e) => setEntrega((s) => ({ ...s, nova_data: e.target.value, dias: "" }))} />
            <p className="text-xs text-muted-foreground">
              {impactoEntrega === null
                ? "Informe a nova data."
                : impactoEntrega === 0
                  ? "Sem alteração em relação à entrega em vigor."
                  : `${impactoEntrega > 0 ? "+" : ""}${impactoEntrega} dias em relação à entrega em vigor.`}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Textarea value={entrega.motivo} onChange={(e) => setEntrega((s) => ({ ...s, motivo: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => reprogramarEntrega.mutate()} disabled={!entrega.nova_data || !entrega.motivo.trim() || reprogramarEntrega.isPending}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailShell>
  );
}
