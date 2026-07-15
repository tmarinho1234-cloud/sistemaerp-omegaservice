import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FileText,
  Upload,
  Trash2,
  Download,
  ClipboardCheck,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  component: OrcamentosPage,
});

type Solicitacao = {
  id: string;
  numero: string;
  contrato_id: string;
  sub_area_id: string | null;
  data_recebimento: string;
  prazo_cliente: string | null;
  escopo: string;
  observacoes: string | null;
  status:
    | "recebida"
    | "em_analise"
    | "orcamento_em_elaboracao"
    | "enviada"
    | "aprovada"
    | "reprovada"
    | "convertida_pedido";
  contratos?: { nome: string; empresa: string } | null;
  sub_areas?: { nome: string } | null;
};

const STATUS_LABEL: Record<Solicitacao["status"], string> = {
  recebida: "Recebida",
  em_analise: "Em Análise",
  orcamento_em_elaboracao: "Orçamento em Elaboração",
  enviada: "Enviada",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  convertida_pedido: "Convertida em Pedido",
};

const STATUS_VARIANT: Record<
  Solicitacao["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  recebida: "secondary",
  em_analise: "outline",
  orcamento_em_elaboracao: "outline",
  enviada: "default",
  aprovada: "default",
  reprovada: "destructive",
  convertida_pedido: "default",
};

function OrcamentosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [creating, setCreating] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_orcamento")
        .select("*, contratos(nome, empresa), sub_areas(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Solicitacao[];
    },
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const s = search.toLowerCase();
        const matchesSearch =
          !s ||
          r.numero.toLowerCase().includes(s) ||
          r.escopo.toLowerCase().includes(s) ||
          r.contratos?.empresa.toLowerCase().includes(s) ||
          r.contratos?.nome.toLowerCase().includes(s);
        const matchesStatus =
          statusFilter === "todos" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [rows, search, statusFilter],
  );

  const kpis = useMemo(() => {
    const total = rows.length;
    const emAnalise = rows.filter(
      (r) => r.status === "em_analise" || r.status === "orcamento_em_elaboracao",
    ).length;
    const enviadas = rows.filter((r) => r.status === "enviada").length;
    const aprovadas = rows.filter(
      (r) => r.status === "aprovada" || r.status === "convertida_pedido",
    ).length;
    return { total, emAnalise, enviadas, aprovadas };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Recebimento de solicitações, análise técnica, propostas comerciais e aprovação.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova solicitação
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <KpiCard label="Total" value={kpis.total} />
        <KpiCard label="Em análise" value={kpis.emAnalise} />
        <KpiCard label="Enviadas ao cliente" value={kpis.enviadas} />
        <KpiCard label="Aprovadas" value={kpis.aprovadas} />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou escopo..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Sub-área</TableHead>
                  <TableHead>Recebida</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenedId(r.id)}>
                      <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                      <TableCell>{r.contratos?.empresa ?? "—"}</TableCell>
                      <TableCell>{r.contratos?.nome ?? "—"}</TableCell>
                      <TableCell>{r.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell>{formatDate(r.data_recebimento)}</TableCell>
                      <TableCell>{formatDate(r.prazo_cliente)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenedId(r.id); }}>
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovaSolicitacaoDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: ["solicitacoes"] });
          setCreating(false);
          setOpenedId(id);
        }}
      />

      <SolicitacaoDrawer
        id={openedId}
        onClose={() => setOpenedId(null)}
      />
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

/* ---------------- Nova solicitação ---------------- */

function NovaSolicitacaoDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [contratoId, setContratoId] = useState<string>("");
  const [subAreaId, setSubAreaId] = useState<string>("");
  const [prazoCliente, setPrazoCliente] = useState<string>("");
  const [escopo, setEscopo] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, nome, empresa")
        .eq("ativo", true)
        .order("empresa");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: subAreas = [] } = useQuery({
    queryKey: ["sub-areas-select", contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      const { data, error } = await supabase
        .from("sub_areas")
        .select("id, nome")
        .eq("contrato_id", contratoId)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!contratoId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const numero = `SOL-${Date.now().toString().slice(-8)}`;
      const { data, error } = await supabase
        .from("solicitacoes_orcamento")
        .insert({
          numero,
          contrato_id: contratoId,
          sub_area_id: subAreaId || null,
          prazo_cliente: prazoCliente || null,
          escopo,
          observacoes: observacoes || null,
          status: "recebida",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Solicitação cadastrada");
      setContratoId("");
      setSubAreaId("");
      setPrazoCliente("");
      setEscopo("");
      setObservacoes("");
      onCreated(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova solicitação de orçamento</DialogTitle>
          <DialogDescription>
            Cadastre a solicitação recebida do cliente para iniciar o fluxo.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select
              value={contratoId}
              onValueChange={(v) => {
                setContratoId(v);
                setSubAreaId("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contrato" />
              </SelectTrigger>
              <SelectContent>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.empresa} — {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sub-área</Label>
              <Select value={subAreaId} onValueChange={setSubAreaId} disabled={!contratoId}>
                <SelectTrigger>
                  <SelectValue placeholder={contratoId ? "Opcional" : "Selecione o contrato"} />
                </SelectTrigger>
                <SelectContent>
                  {subAreas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo do cliente</Label>
              <Input
                type="date"
                value={prazoCliente}
                onChange={(e) => setPrazoCliente(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Escopo *</Label>
            <Textarea
              required
              rows={4}
              placeholder="Descrição do que foi solicitado"
              value={escopo}
              onChange={(e) => setEscopo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMut.isPending || !contratoId}>
              {createMut.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Drawer de detalhes ---------------- */

function SolicitacaoDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: sol } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_orcamento")
        .select("*, contratos(nome, empresa), sub_areas(nome)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as Solicitacao;
    },
    enabled: !!id,
  });

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        {sol && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <span className="font-mono text-sm">{sol.numero}</span>
                <Badge variant={STATUS_VARIANT[sol.status]}>{STATUS_LABEL[sol.status]}</Badge>
              </SheetTitle>
              <SheetDescription>
                {sol.contratos?.empresa} · {sol.contratos?.nome} {sol.sub_areas?.nome ? `· ${sol.sub_areas.nome}` : ""} · Recebida em {formatDate(sol.data_recebimento)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6">
              <Tabs defaultValue="solicitacao">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="solicitacao">Solicitação</TabsTrigger>
                  <TabsTrigger value="analise">Análise</TabsTrigger>
                  <TabsTrigger value="proposta">Proposta</TabsTrigger>
                  <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
                </TabsList>

                <TabsContent value="solicitacao" className="space-y-4 mt-4">
                  <SolicitacaoTab sol={sol} />
                </TabsContent>
                <TabsContent value="analise" className="mt-4">
                  <AnaliseTab solicitacaoId={sol.id} />
                </TabsContent>
                <TabsContent value="proposta" className="mt-4">
                  <PropostaTab sol={sol} />
                </TabsContent>
                <TabsContent value="aprovacao" className="mt-4">
                  <AprovacaoTab sol={sol} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Tab: Solicitação (dados + anexos) ---------------- */

type Anexo = {
  id: string;
  nome: string;
  storage_path: string;
  tamanho: number | null;
  tipo: string | null;
};

function SolicitacaoTab({ sol }: { sol: Solicitacao }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: anexos = [] } = useQuery({
    queryKey: ["anexos", sol.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_anexos")
        .select("*")
        .eq("solicitacao_id", sol.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Anexo[];
    },
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `${sol.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("orcamentos").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("solicitacao_anexos").insert({
        solicitacao_id: sol.id,
        storage_path: path,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
      });
      if (dbErr) throw dbErr;
      toast.success("Anexo enviado");
      qc.invalidateQueries({ queryKey: ["anexos", sol.id] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const download = async (a: Anexo) => {
    const { data, error } = await supabase.storage.from("orcamentos").createSignedUrl(a.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const removeMut = useMutation({
    mutationFn: async (a: Anexo) => {
      await supabase.storage.from("orcamentos").remove([a.storage_path]);
      const { error } = await supabase.from("solicitacao_anexos").delete().eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anexo removido");
      qc.invalidateQueries({ queryKey: ["anexos", sol.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-2">
          <FieldRow label="Escopo" value={sol.escopo} />
          <FieldRow label="Observações" value={sol.observacoes ?? "—"} />
          <FieldRow label="Prazo do cliente" value={formatDate(sol.prazo_cliente)} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Anexos ({anexos.length})</h3>
          <label className="inline-flex">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = "";
              }}
            />
            <Button asChild size="sm" variant="outline" disabled={uploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Enviar"}
              </span>
            </Button>
          </label>
        </div>
        <div className="rounded-md border">
          {anexos.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Nenhum anexo. Envie desenhos, especificações e documentos técnicos.
            </div>
          ) : (
            <div className="divide-y">
              {anexos.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{a.nome}</span>
                    {a.tamanho && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(a.tamanho / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => download(a)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeMut.mutate(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

/* ---------------- Tab: Análise Técnica ---------------- */

type Analise = {
  id: string;
  parecer: string;
  viavel: boolean;
  materiais: string | null;
  processos: string | null;
  horas_estimadas: number | null;
  data_analise: string;
};

function AnaliseTab({ solicitacaoId }: { solicitacaoId: string }) {
  const qc = useQueryClient();
  const { data: analise } = useQuery({
    queryKey: ["analise", solicitacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analises_tecnicas")
        .select("*")
        .eq("solicitacao_id", solicitacaoId)
        .maybeSingle();
      if (error) throw error;
      return data as Analise | null;
    },
  });

  const [form, setForm] = useState<Partial<Analise>>({});
  const current = { ...(analise ?? {}), ...form } as Partial<Analise>;

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        solicitacao_id: solicitacaoId,
        parecer: current.parecer ?? "",
        viavel: current.viavel ?? true,
        materiais: current.materiais ?? null,
        processos: current.processos ?? null,
        horas_estimadas: current.horas_estimadas ?? null,
      };
      if (analise?.id) {
        const { error } = await supabase.from("analises_tecnicas").update(payload).eq("id", analise.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("analises_tecnicas").insert(payload);
        if (error) throw error;
      }
      await supabase
        .from("solicitacoes_orcamento")
        .update({ status: "orcamento_em_elaboracao" })
        .eq("id", solicitacaoId)
        .in("status", ["recebida", "em_analise"]);
    },
    onSuccess: () => {
      toast.success("Análise técnica salva");
      qc.invalidateQueries({ queryKey: ["analise", solicitacaoId] });
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["solicitacao", solicitacaoId] });
      setForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveMut.mutate();
      }}
    >
      <div className="space-y-2">
        <Label>Parecer técnico *</Label>
        <Textarea
          required
          rows={4}
          value={current.parecer ?? ""}
          onChange={(e) => setForm({ ...form, parecer: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Viabilidade</Label>
          <Select
            value={String(current.viavel ?? true)}
            onValueChange={(v) => setForm({ ...form, viavel: v === "true" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Viável</SelectItem>
              <SelectItem value="false">Inviável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Horas estimadas</Label>
          <Input
            type="number"
            step="0.5"
            value={current.horas_estimadas ?? ""}
            onChange={(e) =>
              setForm({ ...form, horas_estimadas: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Materiais necessários</Label>
        <Textarea
          rows={2}
          value={current.materiais ?? ""}
          onChange={(e) => setForm({ ...form, materiais: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Processos envolvidos</Label>
        <Textarea
          rows={2}
          placeholder="Corte, dobra, usinagem, soldagem, pintura..."
          value={current.processos ?? ""}
          onChange={(e) => setForm({ ...form, processos: e.target.value })}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMut.isPending}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          {saveMut.isPending ? "Salvando..." : analise ? "Atualizar análise" : "Registrar análise"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- Tab: Proposta (orçamento + itens) ---------------- */

type Orcamento = {
  id: string;
  numero: string;
  solicitacao_id: string;
  valor_total: number;
  prazo_execucao_dias: number | null;
  condicoes_comerciais: string | null;
  validade: string | null;
  status: "rascunho" | "enviado" | "aprovado" | "reprovado";
  enviado_em: string | null;
  respondido_em: string | null;
  motivo_reprovacao: string | null;
};

type QqpCategoria = "kg" | "hora" | "m2" | "formato_a1" | "diaria" | "outros";

type Item = {
  id: string;
  orcamento_id: string;
  descricao: string;
  categoria: QqpCategoria;
  quantidade: number;
  unidade: string;
  peso_kg: number | null;
  preco_unitario: number;
  preco_total: number;
  ordem: number;
};

const QQP_CATEGORIAS: { value: QqpCategoria; label: string; unidade: string }[] = [
  { value: "kg", label: "Peso (KG)", unidade: "kg" },
  { value: "hora", label: "Hora", unidade: "h" },
  { value: "m2", label: "Área (m²)", unidade: "m²" },
  { value: "formato_a1", label: "Formato A1 (Projetos)", unidade: "A1" },
  { value: "diaria", label: "Diária (Ensaios)", unidade: "diária" },
  { value: "outros", label: "Outros", unidade: "un" },
];

const categoriaLabel = (c: QqpCategoria) =>
  QQP_CATEGORIAS.find((k) => k.value === c)?.label ?? c;

function PropostaTab({ sol }: { sol: Solicitacao }) {
  const qc = useQueryClient();
  const { data: orc } = useQuery({
    queryKey: ["orcamento", sol.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("solicitacao_id", sol.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Orcamento | null;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const numero = `ORC-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("orcamentos").insert({
        numero,
        solicitacao_id: sol.id,
        status: "rascunho",
      });
      if (error) throw error;
      await supabase
        .from("solicitacoes_orcamento")
        .update({ status: "orcamento_em_elaboracao" })
        .eq("id", sol.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamento", sol.id] });
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast.success("Proposta criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orc) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma proposta comercial elaborada. Crie uma para adicionar itens e valores.
          </p>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Criar proposta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <PropostaEditor orc={orc} sol={sol} />;
}

function PropostaEditor({ orc, sol }: { orc: Orcamento; sol: Solicitacao }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Orcamento>>({});
  const current = { ...orc, ...form };

  const { data: itens = [] } = useQuery({
    queryKey: ["itens", orc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orc.id)
        .order("ordem");
      if (error) throw error;
      return data as Item[];
    },
  });

  const total = useMemo(
    () => itens.reduce((s, i) => s + Number(i.preco_total ?? 0), 0),
    [itens],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orcamentos")
        .update({
          prazo_execucao_dias: current.prazo_execucao_dias ?? null,
          condicoes_comerciais: current.condicoes_comerciais ?? null,
          validade: current.validade ?? null,
          valor_total: total,
        })
        .eq("id", orc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposta atualizada");
      qc.invalidateQueries({ queryKey: ["orcamento", sol.id] });
      setForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enviarMut = useMutation({
    mutationFn: async () => {
      await saveMut.mutateAsync();
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", orc.id);
      if (error) throw error;
      await supabase
        .from("solicitacoes_orcamento")
        .update({ status: "enviada" })
        .eq("id", sol.id);
    },
    onSuccess: () => {
      toast.success("Proposta enviada ao cliente");
      qc.invalidateQueries({ queryKey: ["orcamento", sol.id] });
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["solicitacao", sol.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{orc.numero}</div>
              <div className="text-lg font-semibold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </div>
            <Badge variant={orc.status === "rascunho" ? "secondary" : "default"}>
              {orc.status === "rascunho" ? "Rascunho" : orc.status === "enviado" ? "Enviado" : orc.status === "aprovado" ? "Aprovado" : "Reprovado"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo de execução (dias)</Label>
              <Input
                type="number"
                value={current.prazo_execucao_dias ?? ""}
                onChange={(e) =>
                  setForm({ ...form, prazo_execucao_dias: e.target.value ? Number(e.target.value) : null })
                }
                disabled={orc.status !== "rascunho"}
              />
            </div>
            <div className="space-y-2">
              <Label>Validade</Label>
              <Input
                type="date"
                value={current.validade ?? ""}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
                disabled={orc.status !== "rascunho"}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Condições comerciais</Label>
            <Textarea
              rows={2}
              value={current.condicoes_comerciais ?? ""}
              onChange={(e) => setForm({ ...form, condicoes_comerciais: e.target.value })}
              disabled={orc.status !== "rascunho"}
            />
          </div>
          {orc.status === "rascunho" && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                Salvar
              </Button>
              <Button onClick={() => enviarMut.mutate()} disabled={enviarMut.isPending || itens.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                Enviar ao cliente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ItensEditor orcamentoId={orc.id} itens={itens} editable={orc.status === "rascunho"} />
    </div>
  );
}

function ItensEditor({
  orcamentoId,
  itens,
  editable,
}: {
  orcamentoId: string;
  itens: Item[];
  editable: boolean;
}) {
  const qc = useQueryClient();
  const [novo, setNovo] = useState<Partial<Item>>({
    descricao: "",
    categoria: "kg",
    quantidade: 1,
    unidade: "kg",
    preco_unitario: 0,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: orcamentoId,
        descricao: novo.descricao ?? "",
        categoria: (novo.categoria ?? "outros") as QqpCategoria,
        quantidade: novo.quantidade ?? 1,
        unidade: novo.unidade ?? "un",
        peso_kg: novo.peso_kg ?? null,
        preco_unitario: novo.preco_unitario ?? 0,
        ordem: itens.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itens", orcamentoId] });
      setNovo({ descricao: "", categoria: "kg", quantidade: 1, unidade: "kg", preco_unitario: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orcamento_itens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itens", orcamentoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const totalPorCategoria = itens.reduce<Record<string, number>>((acc, i) => {
    acc[i.categoria] = (acc[i.categoria] ?? 0) + Number(i.preco_total ?? 0);
    return acc;
  }, {});

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Itens da proposta (QQP)</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(totalPorCategoria).map(([cat, tot]) => (
              <span key={cat} className="px-2 py-1 rounded bg-muted">
                {categoriaLabel(cat as QqpCategoria)}: <strong>R$ {tot.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-40">Categoria QQP</TableHead>
                <TableHead className="w-20">Qtd</TableHead>
                <TableHead className="w-16">Un.</TableHead>
                <TableHead className="w-24">Peso (kg)</TableHead>
                <TableHead className="w-28">Unitário</TableHead>
                <TableHead className="w-28">Total</TableHead>
                {editable && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 8 : 7} className="text-center text-muted-foreground py-4">
                    Nenhum item.
                  </TableCell>
                </TableRow>
              ) : (
                itens.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm">{i.descricao}</TableCell>
                    <TableCell className="text-xs">{categoriaLabel(i.categoria)}</TableCell>
                    <TableCell>{Number(i.quantidade)}</TableCell>
                    <TableCell>{i.unidade}</TableCell>
                    <TableCell>{i.peso_kg ?? "—"}</TableCell>
                    <TableCell>R$ {Number(i.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-medium">R$ {Number(i.preco_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    {editable && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => delMut.mutate(i.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {editable && (
          <div className="grid grid-cols-12 gap-2 items-end pt-2">
            <div className="col-span-4 space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Input
                value={novo.descricao ?? ""}
                onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Categoria QQP</Label>
              <Select
                value={novo.categoria ?? "kg"}
                onValueChange={(v) => {
                  const preset = QQP_CATEGORIAS.find((k) => k.value === v);
                  setNovo({ ...novo, categoria: v as QqpCategoria, unidade: preset?.unidade ?? novo.unidade });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QQP_CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Qtd</Label>
              <Input
                type="number"
                step="0.001"
                value={novo.quantidade ?? ""}
                onChange={(e) => setNovo({ ...novo, quantidade: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Un.</Label>
              <Input
                value={novo.unidade ?? ""}
                onChange={(e) => setNovo({ ...novo, unidade: e.target.value })}
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Peso</Label>
              <Input
                type="number"
                step="0.001"
                value={novo.peso_kg ?? ""}
                onChange={(e) => setNovo({ ...novo, peso_kg: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">R$ Unit.</Label>
              <Input
                type="number"
                step="0.01"
                value={novo.preco_unitario ?? ""}
                onChange={(e) => setNovo({ ...novo, preco_unitario: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-1">
              <Button
                size="icon"
                onClick={() => addMut.mutate()}
                disabled={addMut.isPending || !novo.descricao}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Tab: Aprovação (aprovar/reprovar + converter em pedido) ---------------- */

function AprovacaoTab({ sol }: { sol: Solicitacao }) {
  const qc = useQueryClient();
  const [motivoOpen, setMotivoOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");

  const { data: orc } = useQuery({
    queryKey: ["orcamento", sol.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("solicitacao_id", sol.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Orcamento | null;
    },
  });

  const { data: pedido } = useQuery({
    queryKey: ["pedido-por-orcamento", orc?.id],
    queryFn: async () => {
      if (!orc?.id) return null;
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("orcamento_id", orc.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orc?.id,
  });

  const aprovarMut = useMutation({
    mutationFn: async () => {
      if (!orc) throw new Error("Sem proposta");
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: "aprovado", respondido_em: new Date().toISOString() })
        .eq("id", orc.id);
      if (error) throw error;
      await supabase.from("solicitacoes_orcamento").update({ status: "aprovada" }).eq("id", sol.id);
    },
    onSuccess: () => {
      toast.success("Orçamento aprovado");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reprovarMut = useMutation({
    mutationFn: async () => {
      if (!orc) throw new Error("Sem proposta");
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: "reprovado", respondido_em: new Date().toISOString(), motivo_reprovacao: motivo })
        .eq("id", orc.id);
      if (error) throw error;
      await supabase.from("solicitacoes_orcamento").update({ status: "reprovada" }).eq("id", sol.id);
    },
    onSuccess: () => {
      toast.success("Orçamento reprovado");
      setMotivoOpen(false);
      setMotivo("");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const converterMut = useMutation({
    mutationFn: async () => {
      if (!orc) throw new Error("Sem proposta");
      const numero = `PED-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("pedidos").insert({
        numero,
        orcamento_id: orc.id,
        contrato_id: sol.contrato_id,
        sub_area_id: sol.sub_area_id,
        prazo_entrega: prazoEntrega || null,
        valor_total: Number(orc.valor_total),
        status: "aberto",
      });
      if (error) throw error;
      await supabase.from("solicitacoes_orcamento").update({ status: "convertida_pedido" }).eq("id", sol.id);
    },
    onSuccess: () => {
      toast.success("Pedido gerado — segue para o PCP");
      setPrazoEntrega("");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orc) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Elabore uma proposta na aba anterior antes de registrar aprovação.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Proposta</div>
              <div className="font-mono text-sm">{orc.numero}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Valor</div>
              <div className="text-lg font-semibold">
                R$ {Number(orc.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {orc.status === "enviado" && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => aprovarMut.mutate()} disabled={aprovarMut.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button variant="destructive" onClick={() => setMotivoOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reprovar
              </Button>
            </div>
          )}

          {orc.status === "rascunho" && (
            <p className="text-sm text-muted-foreground">Envie a proposta ao cliente na aba anterior antes de aprovar.</p>
          )}

          {orc.status === "reprovado" && (
            <div className="text-sm">
              <div className="text-destructive font-medium">Reprovado</div>
              <div className="text-muted-foreground">{orc.motivo_reprovacao}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {orc.status === "aprovado" && !pedido && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-sm font-semibold">Converter em Pedido</h3>
            <p className="text-sm text-muted-foreground">
              Gera o pedido e envia para o PCP iniciar o levantamento de materiais e o planejamento.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prazo de entrega</Label>
                <Input type="date" value={prazoEntrega} onChange={(e) => setPrazoEntrega(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => converterMut.mutate()} disabled={converterMut.isPending}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Gerar Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pedido && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Pedido gerado</div>
                <div className="font-mono text-sm">{pedido.numero}</div>
              </div>
              <Badge>Aberto</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Prazo de entrega: {formatDate(pedido.prazo_entrega)} · Valor R${" "}
              {Number(pedido.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={motivoOpen} onOpenChange={setMotivoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo da reprovação</AlertDialogTitle>
            <AlertDialogDescription>
              Registre o motivo informado pelo cliente para reprovar a proposta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => reprovarMut.mutate()} disabled={!motivo}>
              Confirmar reprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
