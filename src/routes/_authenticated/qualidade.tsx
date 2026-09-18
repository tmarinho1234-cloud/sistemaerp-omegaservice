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
import { ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { MetricCard, ModuleHeader, PedidoSelect, ProgressBar, dateBr, requisitoLabel, useConjuntos, usePedidos, useSincronizacaoTempoReal } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/qualidade")({
  head: () => ({
    meta: [
      { title: "Qualidade | Omega Service ERP" },
      { name: "description", content: "Painel de conjuntos, inspeções conforme a análise técnica, não conformidades e liberação." },
      { property: "og:title", content: "Qualidade | Omega Service ERP" },
      { property: "og:description", content: "Painel de conjuntos, inspeções conforme a análise técnica, não conformidades e liberação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QualidadePage,
});

/* Requisito da demanda -> tipo de inspeção */
const TIPO_POR_REQUISITO: Record<string, string> = { dimensional: "dimensional", solda: "soldagem", pintura: "pintura", outro: "final" };

type Inspecao = { id: string; conjunto_id: string; tipo: string; resultado: string; data_inspecao: string; observacoes: string | null };
type NC = { id: string; conjunto_id: string; inspecao_id: string; descricao: string; acao_corretiva: string | null; exige_retrabalho: boolean; status: string };
type Requisito = { id: string; tipo: string; nome_ensaio: string | null };

function QualidadePage() {
  useSincronizacaoTempoReal();
  const qc = useQueryClient();
  const { data: pedidos = [] } = usePedidos();
  const [pedidoId, setPedidoId] = useState("");
  useEffect(() => {
    if (!pedidoId && pedidos[0]) setPedidoId(pedidos[0].id);
  }, [pedidoId, pedidos]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const { data: conjuntos = [] } = useConjuntos(pedidoId);

  const [inspOpen, setInspOpen] = useState(false);
  const [form, setForm] = useState({ conjunto_id: "", tipo: "dimensional", resultado: "aprovado", data: new Date().toISOString().slice(0, 10), observacoes: "", nc: "" });

  const { data: requisitos = [] } = useQuery({
    queryKey: ["requisitos-demanda", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("databook_relatorios").select("id, tipo, nome_ensaio").eq("pedido_id", pedidoId).order("created_at");
      if (error) throw error;
      return data as Requisito[];
    },
  });

  const { data: inspecoes = [] } = useQuery({
    queryKey: ["inspecoes", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspecoes_qualidade")
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("data_inspecao", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inspecao[];
    },
  });

  const { data: ncs = [] } = useQuery({
    queryKey: ["ncs", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("nao_conformidades").select("*").eq("pedido_id", pedidoId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as NC[];
    },
  });

  const tiposDaDemanda = useMemo(() => {
    const tipos = requisitos.map((r) => ({ value: TIPO_POR_REQUISITO[r.tipo] ?? "final", label: requisitoLabel(r.tipo, r.nome_ensaio) }));
    if (!tipos.some((t) => t.value === "final")) tipos.push({ value: "final", label: "Inspeção final (liberação)" });
    return tipos;
  }, [requisitos]);

  const registrar = useMutation({
    mutationFn: async () => {
      if (!pedidoId || !form.conjunto_id) throw new Error("Selecione o conjunto");
      const { data, error } = await supabase
        .from("inspecoes_qualidade")
        .insert({ pedido_id: pedidoId, conjunto_id: form.conjunto_id, tipo: form.tipo, resultado: form.resultado, data_inspecao: form.data, observacoes: form.observacoes || null })
        .select("id")
        .single();
      if (error) throw error;
      if (form.resultado === "reprovado") {
        const nc = await supabase.from("nao_conformidades").insert({ inspecao_id: data.id, pedido_id: pedidoId, conjunto_id: form.conjunto_id, descricao: form.nc || form.observacoes || "Reprovação registrada na inspeção", exige_retrabalho: true });
        if (nc.error) throw nc.error;
      }
    },
    onSuccess: () => {
      toast.success("Inspeção registrada");
      setInspOpen(false);
      setForm({ conjunto_id: "", tipo: "dimensional", resultado: "aprovado", data: new Date().toISOString().slice(0, 10), observacoes: "", nc: "" });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encerrarNC = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nao_conformidades").update({ status: "encerrada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Não conformidade encerrada");
      qc.invalidateQueries({ queryKey: ["ncs", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const liberados = conjuntos.filter((c) => c.liberado_qualidade).length;
  const reprovacoes = inspecoes.filter((i) => i.resultado === "reprovado").length;
  const ncsAbertas = ncs.filter((n) => n.status !== "encerrada").length;

  const resultadoDe = (conjuntoId: string, tipo: string) => {
    const encontrada = inspecoes.find((i) => i.conjunto_id === conjuntoId && i.tipo === tipo);
    return encontrada?.resultado;
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Qualidade"
        description="Painel de conjuntos com os relatórios definidos na análise técnica, não conformidades e liberação."
        icon={ShieldCheck}
        action={
          <Button onClick={() => setInspOpen(true)} disabled={!conjuntos.length}>
            <Plus className="mr-2 h-4 w-4" />
            Inspeção
          </Button>
        }
      />
      <PedidoSelect pedidos={pedidos} value={pedidoId} onChange={setPedidoId} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Conjuntos" value={conjuntos.length} />
        <MetricCard label="Liberados" value={liberados} tone="success" />
        <MetricCard label="Reprovações" value={reprovacoes} tone={reprovacoes ? "warning" : "default"} />
        <MetricCard label="NCs abertas" value={ncsAbertas} tone={ncsAbertas ? "danger" : "default"} />
      </div>

      {pedido && (
        <p className="text-xs text-muted-foreground">
          Demanda {pedido.pomg_codigo ?? pedido.numero} · requisitos: {requisitos.length ? requisitos.map((r) => requisitoLabel(r.tipo, r.nome_ensaio)).join(", ") : "nenhum definido na análise técnica"}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Painel de conjuntos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG</TableHead>
                  <TableHead>Conjunto</TableHead>
                  <TableHead>Avanço</TableHead>
                  {tiposDaDemanda.map((t) => (
                    <TableHead key={t.value + t.label}>{t.label}</TableHead>
                  ))}
                  <TableHead>Liberação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conjuntos.length ? (
                  conjuntos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.tag} · {pedido?.pomg_codigo ?? pedido?.numero}</TableCell>
                      <TableCell>
                        <div>{c.codigo}</div>
                        <div className="text-xs text-muted-foreground">{c.descricao}</div>
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={c.progresso} />
                      </TableCell>
                      {tiposDaDemanda.map((t) => {
                        const r = resultadoDe(c.id, t.value);
                        return (
                          <TableCell key={t.value + t.label}>
                            <Badge variant={r === "aprovado" ? "default" : r === "reprovado" ? "destructive" : "outline"}>{r ? r : "pendente"}</Badge>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        {c.liberado_qualidade ? <Badge>Liberado</Badge> : <Badge variant="outline">Aguardando</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4 + tiposDaDemanda.length} className="py-10 text-center text-muted-foreground">
                      Nenhum conjunto nesta demanda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inspeções registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inspecoes.length ? (
              inspecoes.map((i) => {
                const c = conjuntos.find((x) => x.id === i.conjunto_id);
                return (
                  <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                    <div>
                      <div className="font-medium">
                        <span className="font-mono">{c ? `${c.tag} · ${pedido?.pomg_codigo ?? pedido?.numero ?? ""}` : "—"}</span> · {i.tipo}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateBr(i.data_inspecao)} {i.observacoes ? `· ${i.observacoes}` : ""}
                      </div>
                    </div>
                    <Badge variant={i.resultado === "aprovado" ? "default" : i.resultado === "reprovado" ? "destructive" : "outline"}>{i.resultado}</Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma inspeção registrada.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Não conformidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ncs.length ? (
              ncs.map((n) => {
                const c = conjuntos.find((x) => x.id === n.conjunto_id);
                return (
                  <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                    <div>
                      <div className="font-medium">
                        <span className="font-mono">{c ? `${c.tag} · ${pedido?.pomg_codigo ?? pedido?.numero ?? ""}` : "—"}</span> · {n.descricao}
                      </div>
                      <div className="text-xs text-muted-foreground">{n.exige_retrabalho ? "Exige retrabalho" : "Sem retrabalho"}</div>
                    </div>
                    {n.status === "encerrada" ? <Badge variant="outline">Encerrada</Badge> : <Button size="sm" onClick={() => encerrarNC.mutate(n.id)}>Encerrar</Button>}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma não conformidade aberta.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={inspOpen} onOpenChange={setInspOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar inspeção</DialogTitle>
          </DialogHeader>
          <Field label="Conjunto">
            <Select value={form.conjunto_id} onValueChange={(v) => setForm({ ...form, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {conjuntos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tag} · {pedido?.pomg_codigo ?? pedido?.numero} · {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Relatório / inspeção">
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposDaDemanda.map((t) => (
                  <SelectItem key={t.value + t.label} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Resultado">
              <Select value={form.resultado} onValueChange={(v) => setForm({ ...form, resultado: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </Field>
          {form.resultado === "reprovado" && (
            <Field label="Descrição da não conformidade">
              <Textarea value={form.nc} onChange={(e) => setForm({ ...form, nc: e.target.value })} />
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => registrar.mutate()} disabled={!form.conjunto_id || registrar.isPending}>
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
