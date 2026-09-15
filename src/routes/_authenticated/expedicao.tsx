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
import { Truck, Plus, Banknote } from "lucide-react";
import { toast } from "sonner";
import { MetricCard, ModuleHeader, PedidoSelect, ProgressBar, dateBr, moneyBr, useConjuntos, usePedidos } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/expedicao")({
  head: () => ({
    meta: [
      { title: "Expedição | Omega Service ERP" },
      { name: "description", content: "Entregas parciais e totais por conjunto, romaneios e notas fiscais vinculadas ao POMG." },
      { property: "og:title", content: "Expedição | Omega Service ERP" },
      { property: "og:description", content: "Entregas parciais e totais por conjunto, romaneios e notas fiscais vinculadas ao POMG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExpedicaoPage,
});

type Romaneio = { id: string; numero: string; data_romaneio: string; destino: string | null; transporte: string | null; status: string; observacoes: string | null };
type Item = { id: string; romaneio_id: string; conjunto_id: string; quantidade: number; peso_kg: number | null };
type Nota = { id: string; romaneio_id: string; conjunto_id: string | null; numero: string; peso_kg: number | null; valor: number | null; data_emissao: string | null };

function ExpedicaoPage() {
  const qc = useQueryClient();
  const { data: pedidos = [] } = usePedidos();
  const [pedidoId, setPedidoId] = useState("");
  useEffect(() => {
    if (!pedidoId && pedidos[0]) setPedidoId(pedidos[0].id);
  }, [pedidoId, pedidos]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const { data: conjuntos = [] } = useConjuntos(pedidoId);

  const [novoRom, setNovoRom] = useState(false);
  const [rf, setRf] = useState({ numero: "", data: new Date().toISOString().slice(0, 10), destino: "", transporte: "", observacoes: "" });
  const [addItem, setAddItem] = useState<Romaneio | null>(null);
  const [itf, setItf] = useState({ conjunto_id: "", quantidade: "1", peso_kg: "" });
  const [addNota, setAddNota] = useState<Romaneio | null>(null);
  const [nf, setNf] = useState({ conjunto_id: "proposta", numero: "", peso_kg: "", valor: "", data_emissao: new Date().toISOString().slice(0, 10) });

  const { data: romaneios = [] } = useQuery({
    queryKey: ["romaneios", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("romaneios").select("*").eq("pedido_id", pedidoId).order("data_romaneio", { ascending: false });
      if (error) throw error;
      return data as Romaneio[];
    },
  });

  const romIds = romaneios.map((r) => r.id);

  const { data: itens = [] } = useQuery({
    queryKey: ["romaneio-itens", pedidoId, romIds.join(",")],
    enabled: romIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("romaneio_itens").select("*").in("romaneio_id", romIds);
      if (error) throw error;
      return data as Item[];
    },
  });

  const { data: notas = [] } = useQuery({
    queryKey: ["romaneio-notas", pedidoId, romIds.join(",")],
    enabled: romIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("romaneio_notas").select("*").in("romaneio_id", romIds);
      if (error) throw error;
      return data as unknown as Nota[];
    },
  });

  const expedidoPorConjunto = useMemo(() => {
    const ativos = new Set(romaneios.filter((r) => r.status !== "cancelado").map((r) => r.id));
    const map = new Map<string, number>();
    itens.filter((i) => ativos.has(i.romaneio_id)).forEach((i) => map.set(i.conjunto_id, (map.get(i.conjunto_id) ?? 0) + Number(i.quantidade)));
    return map;
  }, [itens, romaneios]);

  const totais = useMemo(() => {
    const total = conjuntos.reduce((s, c) => s + Number(c.quantidade), 0);
    const entregue = conjuntos.reduce((s, c) => s + (expedidoPorConjunto.get(c.id) ?? 0), 0);
    const peso = conjuntos.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);
    const pesoEntregue = conjuntos.reduce((s, c) => {
      const q = expedidoPorConjunto.get(c.id) ?? 0;
      return s + (c.peso_kg && c.quantidade ? (Number(c.peso_kg) * q) / Number(c.quantidade) : 0);
    }, 0);
    return { total, entregue, restante: total - entregue, peso, pesoEntregue, tipo: entregue === 0 ? "Nenhuma entrega" : entregue >= total ? "Entrega TOTAL" : "Entrega PARCIAL" };
  }, [conjuntos, expedidoPorConjunto]);

  const criarRomaneio = useMutation({
    mutationFn: async () => {
      if (!pedidoId) return;
      const numero = rf.numero || `ROM-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("romaneios").insert({ pedido_id: pedidoId, numero, data_romaneio: rf.data, destino: rf.destino || null, transporte: rf.transporte || null, observacoes: rf.observacoes || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Romaneio criado");
      setNovoRom(false);
      setRf({ numero: "", data: new Date().toISOString().slice(0, 10), destino: "", transporte: "", observacoes: "" });
      qc.invalidateQueries({ queryKey: ["romaneios", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const incluirItem = useMutation({
    mutationFn: async () => {
      if (!addItem || !itf.conjunto_id) throw new Error("Selecione o conjunto");
      const { error } = await supabase.from("romaneio_itens").insert({ romaneio_id: addItem.id, conjunto_id: itf.conjunto_id, quantidade: Number(itf.quantidade || 0), peso_kg: itf.peso_kg ? Number(itf.peso_kg) : null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conjunto incluído no romaneio");
      setAddItem(null);
      setItf({ conjunto_id: "", quantidade: "1", peso_kg: "" });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const incluirNota = useMutation({
    mutationFn: async () => {
      if (!addNota) return;
      const { error } = await supabase.from("romaneio_notas").insert({
        romaneio_id: addNota.id,
        conjunto_id: nf.conjunto_id === "proposta" ? null : nf.conjunto_id,
        numero: nf.numero,
        peso_kg: nf.peso_kg ? Number(nf.peso_kg) : null,
        valor: nf.valor ? Number(nf.valor) : null,
        data_emissao: nf.data_emissao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota fiscal vinculada ao romaneio");
      setAddNota(null);
      setNf({ conjunto_id: "proposta", numero: "", peso_kg: "", valor: "", data_emissao: new Date().toISOString().slice(0, 10) });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async ({ rom, status }: { rom: Romaneio; status: string }) => {
      const { error } = await supabase.from("romaneios").update({ status }).eq("id", rom.id);
      if (error) throw error;
      if (status === "expedido" || status === "entregue") {
        const doRom = itens.filter((i) => i.romaneio_id === rom.id);
        for (const item of doRom) {
          const conjunto = conjuntos.find((c) => c.id === item.conjunto_id);
          if (!conjunto) continue;
          const total = (expedidoPorConjunto.get(item.conjunto_id) ?? 0);
          const completo = total >= Number(conjunto.quantidade);
          await supabase.from("pedido_conjuntos").update({ status: completo ? "expedido" : "parcialmente_expedido", progresso: completo ? 100 : 90 }).eq("id", item.conjunto_id);
        }
        if (pedidoId) await supabase.from("pedidos").update({ pcp_status: status === "entregue" ? "entregue" : "ag_entrega" }).eq("id", pedidoId);
      }
    },
    onSuccess: () => {
      toast.success("Romaneio atualizado");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Expedição"
        description="Conjuntos prontos, entregas parciais ou totais, romaneios e notas fiscais por POMG."
        icon={Truck}
        action={
          <Button onClick={() => setNovoRom(true)} disabled={!pedidoId}>
            <Plus className="mr-2 h-4 w-4" />
            Romaneio
          </Button>
        }
      />
      <PedidoSelect pedidos={pedidos} value={pedidoId} onChange={setPedidoId} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="A entregar" value={totais.total} detail={`${totais.peso.toFixed(0)} kg`} />
        <MetricCard label="Já entregue" value={totais.entregue} detail={`${totais.pesoEntregue.toFixed(0)} kg`} tone="success" />
        <MetricCard label="Restante" value={totais.restante} tone={totais.restante ? "warning" : "success"} />
        <MetricCard label="Situação" value={totais.tipo} />
      </div>

      {pedido && (
        <p className="text-xs text-muted-foreground">
          Demanda {pedido.pomg_codigo ?? pedido.numero} · contrato {pedido.contratos?.nome ?? "—"} · subárea {pedido.sub_areas?.nome ?? "—"}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conjuntos e saldos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG</TableHead>
                  <TableHead>Conjunto</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Entregue</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Qualidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conjuntos.length ? (
                  conjuntos.map((c) => {
                    const entregue = expedidoPorConjunto.get(c.id) ?? 0;
                    const restante = Number(c.quantidade) - entregue;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium">{c.tag}</TableCell>
                        <TableCell>
                          <div>{c.codigo}</div>
                          <div className="text-xs text-muted-foreground">{c.descricao}</div>
                        </TableCell>
                        <TableCell>{c.quantidade}</TableCell>
                        <TableCell>{entregue}</TableCell>
                        <TableCell>{restante}</TableCell>
                        <TableCell>{c.peso_kg ? `${c.peso_kg} kg` : "—"}</TableCell>
                        <TableCell className="min-w-32">
                          <ProgressBar value={(entregue / Math.max(1, Number(c.quantidade))) * 100} />
                        </TableCell>
                        <TableCell>{c.liberado_qualidade ? <Badge>Liberado</Badge> : <Badge variant="outline">Bloqueado</Badge>}</TableCell>
                      </TableRow>
                    );
                  })
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Romaneios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {romaneios.length ? (
            romaneios.map((r) => {
              const doRom = itens.filter((i) => i.romaneio_id === r.id);
              const notasDoRom = notas.filter((n) => n.romaneio_id === r.id);
              return (
                <div key={r.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-semibold">
                        {r.numero} · {pedido?.pomg_codigo ?? pedido?.numero}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateBr(r.data_romaneio)} · {r.destino ?? "sem destino"} · {r.transporte ?? "sem transporte"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.status === "cancelado" ? "destructive" : "outline"}>{r.status}</Badge>
                      {r.status === "preparacao" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setAddItem(r)}>
                            Conjunto
                          </Button>
                          <Button size="sm" onClick={() => statusMut.mutate({ rom: r, status: "expedido" })} disabled={!doRom.length}>
                            Expedir
                          </Button>
                        </>
                      )}
                      {r.status === "expedido" && (
                        <Button size="sm" onClick={() => statusMut.mutate({ rom: r, status: "entregue" })}>
                          Confirmar entrega
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setAddNota(r)}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Nota fiscal
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {doRom.length ? (
                      doRom.map((i) => {
                        const c = conjuntos.find((x) => x.id === i.conjunto_id);
                        return (
                          <div key={i.id} className="flex justify-between border-b py-1 text-xs">
                            <span className="font-mono">{c?.tag ?? "—"} · {c?.codigo}</span>
                            <span>
                              {i.quantidade} un · {i.peso_kg ? `${i.peso_kg} kg` : "—"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground">Nenhum conjunto incluído.</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Notas fiscais</div>
                    {notasDoRom.length ? (
                      notasDoRom.map((n) => {
                        const c = conjuntos.find((x) => x.id === n.conjunto_id);
                        return (
                          <div key={n.id} className="flex justify-between border-b py-1 text-xs">
                            <span className="font-mono">NF {n.numero} · {c ? `${c.tag}` : "proposta"}</span>
                            <span>
                              {n.peso_kg ? `${n.peso_kg} kg` : "—"} · {n.valor ? moneyBr(Number(n.valor)) : "—"} · {dateBr(n.data_emissao)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground">Nenhuma nota vinculada.</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhum romaneio para esta demanda.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={novoRom} onOpenChange={setNovoRom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo romaneio</DialogTitle>
          </DialogHeader>
          <Field label="Número">
            <Input value={rf.numero} onChange={(e) => setRf({ ...rf, numero: e.target.value })} placeholder="Gerado automaticamente se vazio" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <Input type="date" value={rf.data} onChange={(e) => setRf({ ...rf, data: e.target.value })} />
            </Field>
            <Field label="Transporte">
              <Input value={rf.transporte} onChange={(e) => setRf({ ...rf, transporte: e.target.value })} />
            </Field>
          </div>
          <Field label="Destino">
            <Input value={rf.destino} onChange={(e) => setRf({ ...rf, destino: e.target.value })} />
          </Field>
          <Field label="Observações">
            <Textarea value={rf.observacoes} onChange={(e) => setRf({ ...rf, observacoes: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoRom(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criarRomaneio.mutate()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(addItem)} onOpenChange={(o) => !o && setAddItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incluir conjunto em {addItem?.numero}</DialogTitle>
          </DialogHeader>
          <Field label="Conjunto liberado">
            <Select value={itf.conjunto_id} onValueChange={(v) => setItf({ ...itf, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {conjuntos
                  .filter((c) => c.liberado_qualidade)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tag} · saldo {Number(c.quantidade) - (expedidoPorConjunto.get(c.id) ?? 0)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade">
              <Input type="number" min="1" value={itf.quantidade} onChange={(e) => setItf({ ...itf, quantidade: e.target.value })} />
            </Field>
            <Field label="Peso (kg)">
              <Input type="number" value={itf.peso_kg} onChange={(e) => setItf({ ...itf, peso_kg: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItem(null)}>
              Cancelar
            </Button>
            <Button onClick={() => incluirItem.mutate()} disabled={!itf.conjunto_id}>
              Incluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(addNota)} onOpenChange={(o) => !o && setAddNota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota fiscal do romaneio {addNota?.numero}</DialogTitle>
          </DialogHeader>
          <Field label="Vincular a">
            <Select value={nf.conjunto_id} onValueChange={(v) => setNf({ ...nf, conjunto_id: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposta">Proposta inteira</SelectItem>
                {conjuntos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tag} · {c.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número da NF">
            <Input value={nf.numero} onChange={(e) => setNf({ ...nf, numero: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)">
              <Input type="number" value={nf.peso_kg} onChange={(e) => setNf({ ...nf, peso_kg: e.target.value })} />
            </Field>
            <Field label="Valor">
              <Input type="number" step="0.01" value={nf.valor} onChange={(e) => setNf({ ...nf, valor: e.target.value })} />
            </Field>
          </div>
          <Field label="Emissão">
            <Input type="date" value={nf.data_emissao} onChange={(e) => setNf({ ...nf, data_emissao: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNota(null)}>
              Cancelar
            </Button>
            <Button onClick={() => incluirNota.mutate()} disabled={!nf.numero}>
              Adicionar NF
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
