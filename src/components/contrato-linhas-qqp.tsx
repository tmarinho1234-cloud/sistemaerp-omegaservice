import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, classLabel } from "@/components/orcamento-itens-editor";

type Linha = { id?: string; codigo: string; descricao: string; unidade: string; preco_unitario: number; classificacao: string | null };
type Previa = Linha & { erro?: string };

const norm = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

function parseValor(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/R\$|\s/g, "");
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return n;
}

function parseClass(v: unknown): string | null {
  const s = norm(v);
  if (s.startsWith("FORN")) return "fornecimento";
  if (s.startsWith("SERV")) return "servico";
  return null;
}

export function ContratoLinhasQqp({ contrato, onClose }: { contrato: { id: string; numero: string | null; nome: string } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<Previa[] | null>(null);
  const [edit, setEdit] = useState<Linha | null>(null);
  const contratoId = contrato?.id ?? "";

  const { data: linhas = [] } = useQuery({
    queryKey: ["linhas-qqp", contratoId],
    enabled: Boolean(contratoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrato_linhas_preco")
        .select("id, codigo, descricao, unidade, preco_unitario, classificacao")
        .eq("contrato_id", contratoId)
        .order("codigo");
      if (error) throw error;
      return data as Linha[];
    },
  });

  const lerArquivo = async (file: File) => {
    const wb = XLSX.read(await file.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    const hi = rows.findIndex((r) => r.some((c) => norm(c).includes("ITEM")));
    if (hi < 0) return toast.error("Cabeçalho não encontrado. Use as colunas ITEM QQP, DESCRIÇÃO, UND, VALOR, CLASSIFICAÇÃO.");
    const h = rows[hi].map(norm);
    const col = (k: string) => h.findIndex((c) => c.includes(k));
    const [ci, cd, cu, cv, cc] = [col("ITEM"), col("DESCRI"), h.findIndex((c) => c === "UND" || c.startsWith("UNID")), col("VALOR"), col("CLASSIF")];
    if ([ci, cd, cu, cv, cc].some((x) => x < 0)) return toast.error("Faltam colunas: ITEM QQP, DESCRIÇÃO, UND, VALOR e CLASSIFICAÇÃO.");
    const vistos = new Set<string>();
    const out: Previa[] = [];
    for (const r of rows.slice(hi + 1)) {
      const codigo = String(r[ci] ?? "").trim();
      if (!codigo && !String(r[cd] ?? "").trim()) continue;
      const valor = parseValor(r[cv]);
      const classificacao = parseClass(r[cc]);
      const l: Previa = { codigo, descricao: String(r[cd] ?? "").trim(), unidade: String(r[cu] ?? "").trim() || "un", preco_unitario: valor, classificacao };
      if (!codigo) l.erro = "Item QQP vazio";
      else if (vistos.has(codigo)) l.erro = "Item repetido na planilha";
      else if (!l.descricao) l.erro = "Descrição vazia";
      else if (!Number.isFinite(valor) || valor < 0) l.erro = "Valor inválido";
      else if (!classificacao) l.erro = "Classificação deve ser FORNECIMENTO ou SERVIÇO";
      vistos.add(codigo);
      out.push(l);
    }
    setPrevia(out);
  };

  const importar = useMutation({
    mutationFn: async () => {
      const validas = (previa ?? []).filter((l) => !l.erro).map(({ erro: _e, ...l }) => ({ ...l, contrato_id: contratoId }));
      if (!validas.length) throw new Error("Nenhuma linha válida para importar");
      const { error } = await supabase.from("contrato_linhas_preco").upsert(validas, { onConflict: "contrato_id,codigo" });
      if (error) throw error;
      return validas.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} linha(s) importada(s)`);
      setPrevia(null);
      qc.invalidateQueries({ queryKey: ["linhas-qqp", contratoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvar = useMutation({
    mutationFn: async (l: Linha) => {
      const payload = { contrato_id: contratoId, codigo: l.codigo, descricao: l.descricao, unidade: l.unidade, preco_unitario: Number(l.preco_unitario), classificacao: l.classificacao };
      const { error } = l.id
        ? await supabase.from("contrato_linhas_preco").update(payload).eq("id", l.id)
        : await supabase.from("contrato_linhas_preco").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Linha salva");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["linhas-qqp", contratoId] });
    },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "Já existe uma linha com esse Item QQP" : e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contrato_linhas_preco").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["linhas-qqp", contratoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const baixarModelo = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["ITEM QQP", "DESCRIÇÃO", "UND", "VALOR", "CLASSIFICAÇÃO"],
      ["1.1", "Fabricação de estrutura metálica", "kg", 25.5, "FORNECIMENTO"],
      ["2.1", "Montagem em campo", "h", 120, "SERVIÇO"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QQP");
    XLSX.writeFile(wb, "modelo-linhas-qqp.xlsx");
  };

  const erros = previa?.filter((l) => l.erro).length ?? 0;

  return (
    <Dialog open={!!contrato} onOpenChange={(o) => { if (!o) { setPrevia(null); setEdit(null); onClose(); } }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Linhas QQP · Contrato {contrato?.numero ?? contrato?.nome}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) lerArquivo(f); e.target.value = ""; }} />
          <Button size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Importar Excel</Button>
          <Button size="sm" variant="outline" onClick={baixarModelo}><Download className="mr-2 h-4 w-4" />Baixar modelo</Button>
          <Button size="sm" variant="outline" onClick={() => setEdit({ codigo: "", descricao: "", unidade: "un", preco_unitario: 0, classificacao: "fornecimento" })}><Plus className="mr-2 h-4 w-4" />Nova linha</Button>
        </div>

        {previa && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="text-sm font-semibold">Prévia da importação: {previa.length - erros} válida(s){erros ? `, ${erros} com erro (serão ignoradas)` : ""}. Itens já existentes serão atualizados.</div>
            <TabelaLinhas linhas={previa} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPrevia(null)}>Cancelar</Button>
              <Button size="sm" onClick={() => importar.mutate()} disabled={importar.isPending}>Confirmar importação</Button>
            </div>
          </div>
        )}

        {edit && (
          <div className="grid grid-cols-12 gap-2 items-end rounded-md border p-3">
            <Input className="col-span-2" placeholder="Item QQP" value={edit.codigo} onChange={(e) => setEdit({ ...edit, codigo: e.target.value })} />
            <Input className="col-span-4" placeholder="Descrição" value={edit.descricao} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} />
            <Input className="col-span-1" placeholder="Und" value={edit.unidade} onChange={(e) => setEdit({ ...edit, unidade: e.target.value })} />
            <Input className="col-span-2" type="number" step="0.01" value={edit.preco_unitario} onChange={(e) => setEdit({ ...edit, preco_unitario: Number(e.target.value) })} />
            <div className="col-span-2">
              <Select value={edit.classificacao ?? ""} onValueChange={(v) => setEdit({ ...edit, classificacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fornecimento">Fornecimento</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 flex gap-1">
              <Button size="sm" onClick={() => salvar.mutate(edit)} disabled={!edit.codigo || !edit.descricao || salvar.isPending}>OK</Button>
            </div>
          </div>
        )}

        <TabelaLinhas linhas={linhas} onEdit={setEdit} onDelete={(id) => excluir.mutate(id)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TabelaLinhas({ linhas, onEdit, onDelete }: { linhas: Previa[]; onEdit?: (l: Linha) => void; onDelete?: (id: string) => void }) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item QQP</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Und</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Classificação</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Nenhuma linha QQP cadastrada.</TableCell></TableRow>
          ) : (
            linhas.map((l, i) => (
              <TableRow key={l.id ?? i}>
                <TableCell className="font-mono text-xs">{l.codigo}</TableCell>
                <TableCell className="text-sm">{l.descricao}</TableCell>
                <TableCell>{l.unidade}</TableCell>
                <TableCell className="text-right">{Number.isFinite(l.preco_unitario) ? brl(l.preco_unitario) : "—"}</TableCell>
                <TableCell className="text-xs">{classLabel(l.classificacao)}</TableCell>
                <TableCell className="text-right">
                  {l.erro ? (
                    <span className="text-xs text-destructive">{l.erro}</span>
                  ) : onEdit && l.id ? (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Editar linha" onClick={() => onEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Excluir linha" onClick={() => onDelete?.(l.id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
