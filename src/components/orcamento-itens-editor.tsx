import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type ItemOrcamento = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_total: number;
  item_qqp?: string | null;
  classificacao?: string | null;
  contrato_linha_id?: string | null;
};

type LinhaQqp = { id: string; codigo: string; descricao: string; unidade: string; preco_unitario: number; classificacao: string | null };

export const brl = (v: number | null | undefined) => `R$ ${Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
export const classLabel = (c?: string | null) => (c === "fornecimento" ? "Fornecimento" : c === "servico" ? "Serviço" : "—");

type Novo = { descricao: string; quantidade: number; unidade: string; preco_unitario: number; item_qqp: string | null; classificacao: string | null; contrato_linha_id: string | null };
const vazio: Novo = { descricao: "", quantidade: 1, unidade: "un", preco_unitario: 0, item_qqp: null, classificacao: null, contrato_linha_id: null };

export function ItensEditor({ orcamentoId, contratoId, itens, editable }: { orcamentoId: string; contratoId: string; itens: ItemOrcamento[]; editable: boolean }) {
  const qc = useQueryClient();
  const [novo, setNovo] = useState<Novo>(vazio);
  const [busca, setBusca] = useState("");

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
      return data as LinhaQqp[];
    },
  });

  const q = busca.trim().toLowerCase();
  const filtradas = linhas.filter((l) => !q || l.codigo.toLowerCase().includes(q) || l.descricao.toLowerCase().includes(q));

  const selecionar = (id: string) => {
    const l = linhas.find((x) => x.id === id);
    if (l) setNovo({ ...novo, contrato_linha_id: l.id, item_qqp: l.codigo, descricao: l.descricao, unidade: l.unidade, preco_unitario: Number(l.preco_unitario), classificacao: l.classificacao });
  };

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: orcamentoId,
        descricao: novo.descricao,
        categoria: "outros",
        quantidade: novo.quantidade,
        unidade: novo.unidade,
        preco_unitario: novo.preco_unitario,
        ordem: itens.length,
        item_qqp: novo.item_qqp,
        classificacao: novo.classificacao,
        contrato_linha_id: novo.contrato_linha_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itens", orcamentoId] });
      setNovo(vazio);
      setBusca("");
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

  const soma = (f: (i: ItemOrcamento) => boolean) => itens.filter(f).reduce((s, i) => s + Number(i.preco_total ?? 0), 0);
  const totalForn = soma((i) => i.classificacao === "fornecimento");
  const totalServ = soma((i) => i.classificacao === "servico");
  const total = soma(() => true);
  const semClass = total - totalForn - totalServ;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h3 className="text-sm font-semibold">Itens da proposta (QQP)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Resumo label="Total de Fornecimento" valor={totalForn} />
          <Resumo label="Total de Serviços" valor={totalServ} />
          <Resumo label="Valor Total do Orçamento" valor={total} destaque extra={semClass > 0.005 ? `Sem classificação: ${brl(semClass)}` : undefined} />
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Item QQP</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-28">Classificação</TableHead>
                <TableHead className="w-20">Qtd</TableHead>
                <TableHead className="w-16">Un.</TableHead>
                <TableHead className="w-28">Unitário</TableHead>
                <TableHead className="w-28">Total</TableHead>
                {editable && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 8 : 7} className="text-center text-muted-foreground py-4">Nenhum item.</TableCell>
                </TableRow>
              ) : (
                itens.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.item_qqp ?? "—"}</TableCell>
                    <TableCell className="text-sm">{i.descricao}</TableCell>
                    <TableCell className="text-xs">{classLabel(i.classificacao)}</TableCell>
                    <TableCell>{Number(i.quantidade)}</TableCell>
                    <TableCell>{i.unidade}</TableCell>
                    <TableCell>{brl(i.preco_unitario)}</TableCell>
                    <TableCell className="font-medium">{brl(i.preco_total)}</TableCell>
                    {editable && (
                      <TableCell>
                        <Button size="icon" variant="ghost" aria-label="Excluir item" onClick={() => delMut.mutate(i.id)}>
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
          <div className="space-y-2 pt-2">
            {linhas.length > 0 ? (
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-xs">Buscar linha QQP</Label>
                  <Input placeholder="Código ou descrição" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className="col-span-12 sm:col-span-8 space-y-1">
                  <Label className="text-xs">Selecionar linha QQP do contrato</Label>
                  <Select value={novo.contrato_linha_id ?? ""} onValueChange={selecionar}>
                    <SelectTrigger><SelectValue placeholder={`${filtradas.length} linha(s) disponível(is)`} /></SelectTrigger>
                    <SelectContent>
                      {filtradas.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.codigo} · {l.descricao} · {l.unidade} · {brl(l.preco_unitario)} · {classLabel(l.classificacao)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Este contrato não tem linhas QQP importadas — preencha o item manualmente.</p>
            )}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label className="text-xs">Item</Label>
                <Input value={novo.item_qqp ?? ""} onChange={(e) => setNovo({ ...novo, item_qqp: e.target.value || null })} />
              </div>
              <div className="col-span-10 sm:col-span-4 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
              </div>
              <div className="col-span-6 sm:col-span-2 space-y-1">
                <Label className="text-xs">Classificação</Label>
                <Select value={novo.classificacao ?? ""} onValueChange={(v) => setNovo({ ...novo, classificacao: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecimento">Fornecimento</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <Label className="text-xs">Qtd</Label>
                <Input type="number" step="0.001" value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: Number(e.target.value) })} />
              </div>
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <Label className="text-xs">Un.</Label>
                <Input value={novo.unidade} onChange={(e) => setNovo({ ...novo, unidade: e.target.value })} />
              </div>
              <div className="col-span-9 sm:col-span-2 space-y-1">
                <Label className="text-xs">R$ Unit.</Label>
                <Input type="number" step="0.01" value={novo.preco_unitario} onChange={(e) => setNovo({ ...novo, preco_unitario: Number(e.target.value) })} />
              </div>
              <div className="col-span-3 sm:col-span-1">
                <Button size="icon" aria-label="Adicionar item" onClick={() => addMut.mutate()} disabled={addMut.isPending || !novo.descricao}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Resumo({ label, valor, destaque, extra }: { label: string; valor: number; destaque?: boolean; extra?: string }) {
  return (
    <div className={`rounded-md border p-3 ${destaque ? "bg-muted" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{brl(valor)}</div>
      {extra && <div className="text-xs text-muted-foreground">{extra}</div>}
    </div>
  );
}
