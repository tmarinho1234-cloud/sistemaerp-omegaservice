import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { DetailEmpty, DetailShell } from "@/components/detail-page";
import { MetricCard, REQUISITOS, dateBr, requisitoLabel, usePedidos, useSincronizacaoTempoReal } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/databook/$pedidoId")({
  head: () => ({
    meta: [
      { title: "Databook da demanda | Omega Service ERP" },
      { name: "description", content: "Relatórios e ensaios da demanda POMG, com arquivos anexados e situação de cada item." },
      { property: "og:title", content: "Databook da demanda | Omega Service ERP" },
      { property: "og:description", content: "Relatórios e ensaios da demanda POMG, com arquivos anexados e situação de cada item." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DatabookDetalhePage,
});

const STATUS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "concluido", label: "Concluído" },
  { value: "aprovado", label: "Aprovado" },
];

type Relatorio = {
  id: string;
  tipo: string;
  nome_ensaio: string | null;
  status: string;
  storage_path: string | null;
  nome_arquivo: string | null;
  observacoes: string | null;
  created_at: string;
};

function DatabookDetalhePage() {
  const { pedidoId } = Route.useParams();
  const navigate = useNavigate();
  useSincronizacaoTempoReal();
  const qc = useQueryClient();
  const { data: pedidos = [], isLoading } = usePedidos();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const indice = pedidos.findIndex((p) => p.id === pedidoId);
  const anterior = indice > 0 ? pedidos[indice - 1] : undefined;
  const proximo = indice >= 0 && indice < pedidos.length - 1 ? pedidos[indice + 1] : undefined;

  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({ tipo: "dimensional", nome_ensaio: "", observacoes: "" });

  const { data: relatorios = [] } = useQuery({
    queryKey: ["databook", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("databook_relatorios").select("*").eq("pedido_id", pedidoId).order("created_at");
      if (error) throw error;
      return data as unknown as Relatorio[];
    },
  });

  const adicionar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("databook_relatorios")
        .insert({ pedido_id: pedidoId, tipo: form.tipo, nome_ensaio: form.tipo === "outro" ? form.nome_ensaio : null, observacoes: form.observacoes || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Relatório incluído no databook");
      setNovo(false);
      setForm({ tipo: "dimensional", nome_ensaio: "", observacoes: "" });
      qc.invalidateQueries({ queryKey: ["databook", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("databook_relatorios").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databook", pedidoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async ({ rel, file }: { rel: Relatorio; file: File }) => {
      const path = `databook/${pedidoId}/${rel.id}-${file.name}`;
      const { error } = await supabase.storage.from("orcamentos").upload(path, file, { upsert: true });
      if (error) throw error;
      const upd = await supabase
        .from("databook_relatorios")
        .update({ storage_path: path, nome_arquivo: file.name, status: rel.status === "pendente" ? "concluido" : rel.status })
        .eq("id", rel.id);
      if (upd.error) throw upd.error;
    },
    onSuccess: () => {
      toast.success("Arquivo anexado");
      qc.invalidateQueries({ queryKey: ["databook", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function baixar(rel: Relatorio) {
    if (!rel.storage_path) return;
    const { data, error } = await supabase.storage.from("orcamentos").createSignedUrl(rel.storage_path, 300);
    if (error || !data) {
      toast.error("Não foi possível abrir o arquivo");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const concluidos = relatorios.filter((r) => r.status === "concluido" || r.status === "aprovado").length;
  const aprovados = relatorios.filter((r) => r.status === "aprovado").length;

  const voltar = () => navigate({ to: "/databook" });

  if (!pedido) {
    return <DetailEmpty modulo="Databook" onBack={voltar} message={isLoading ? "Carregando demanda..." : "Demanda não encontrada."} />;
  }

  return (
    <DetailShell
      modulo="Databook"
      title={pedido.pomg_codigo ?? pedido.numero}
      subtitle={`${pedido.contratos?.nome ?? "—"} · ${pedido.sub_areas?.nome ?? "Sem subárea"} · proposta ${pedido.orcamentos?.numero ?? "—"}`}
      onBack={voltar}
      onPrev={anterior ? () => navigate({ to: "/databook/$pedidoId", params: { pedidoId: anterior.id } }) : undefined}
      onNext={proximo ? () => navigate({ to: "/databook/$pedidoId", params: { pedidoId: proximo.id } }) : undefined}
      actions={
        <Button size="sm" onClick={() => setNovo(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Relatório
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Relatórios" value={relatorios.length} />
        <MetricCard label="Concluídos" value={concluidos} tone="success" />
        <MetricCard label="Aprovados" value={aprovados} tone="success" />
        <MetricCard label="Pendentes" value={relatorios.length - concluidos} tone={relatorios.length - concluidos ? "warning" : "default"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist da demanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relatório</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.length ? (
                  relatorios.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{requisitoLabel(r.tipo, r.nome_ensaio)}</TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => statusMut.mutate({ id: r.id, status: v })}>
                          <SelectTrigger className="h-8 w-[170px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {r.storage_path ? (
                            <Button size="sm" variant="outline" onClick={() => baixar(r)}>
                              <Download className="mr-2 h-4 w-4" />
                              {r.nome_arquivo ?? "Abrir"}
                            </Button>
                          ) : (
                            <Badge variant="outline">Sem arquivo</Badge>
                          )}
                          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary">
                            <Upload className="h-3.5 w-3.5" />
                            Anexar
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) upload.mutate({ rel: r, file });
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[240px] text-xs text-muted-foreground">{r.observacoes ?? "—"}</TableCell>
                      <TableCell className="text-xs">{dateBr(r.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhum relatório definido para esta demanda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo relatório do databook</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUISITOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.tipo === "outro" && (
            <div className="space-y-1.5">
              <Label>Nome do ensaio</Label>
              <Input value={form.nome_ensaio} onChange={(e) => setForm({ ...form, nome_ensaio: e.target.value })} placeholder="Ex.: Ultrassom" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={() => adicionar.mutate()} disabled={form.tipo === "outro" && !form.nome_ensaio}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailShell>
  );
}
