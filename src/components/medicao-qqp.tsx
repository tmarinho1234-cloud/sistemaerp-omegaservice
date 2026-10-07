import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, classLabel } from "@/components/orcamento-itens-editor";

type ItemOrc = { id: string; item_qqp: string | null; descricao: string; unidade: string; quantidade: number; preco_unitario: number; preco_total: number; classificacao: string | null };
type MedItem = { orcamento_item_id: string; valor: number; medicoes: { status: string } | null };
export type LinhaSaldo = ItemOrc & { contratado: number; faturado: number; emAberto: number; saldo: number; pct: number };

export function useLinhasMedicao(pedidoId: string, orcamentoId: string | null | undefined) {
  const { data: itens = [] } = useQuery({
    queryKey: ["itens", orcamentoId],
    enabled: Boolean(orcamentoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamento_itens").select("id, item_qqp, descricao, unidade, quantidade, preco_unitario, preco_total, classificacao").eq("orcamento_id", orcamentoId!).order("ordem");
      if (error) throw error;
      return data as ItemOrc[];
    },
  });
  const { data: medItens = [] } = useQuery({
    queryKey: ["medicao-itens", pedidoId],
    enabled: Boolean(pedidoId),
    queryFn: async () => {
      const { data, error } = await supabase.from("medicao_itens").select("orcamento_item_id, valor, medicoes!inner(status, pedido_id)").eq("medicoes.pedido_id", pedidoId);
      if (error) throw error;
      return data as unknown as MedItem[];
    },
  });
  return useMemo<LinhaSaldo[]>(
    () =>
      itens.map((i) => {
        const contratado = Number(i.preco_total ?? 0);
        const daLinha = medItens.filter((m) => m.orcamento_item_id === i.id && m.medicoes?.status !== "cancelada");
        const faturado = daLinha.filter((m) => m.medicoes?.status === "aprovada").reduce((s, m) => s + Number(m.valor), 0);
        const comprometido = daLinha.reduce((s, m) => s + Number(m.valor), 0);
        return { ...i, contratado, faturado, emAberto: comprometido - faturado, saldo: contratado - faturado, pct: contratado ? (faturado / contratado) * 100 : 0 };
      }),
    [itens, medItens],
  );
}

const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function QqpSaldoCard({ linhas }: { linhas: LinhaSaldo[] }) {
  const grupo = (c: string) => {
    const g = linhas.filter((l) => l.classificacao === c);
    const contratado = g.reduce((s, l) => s + l.contratado, 0);
    const faturado = g.reduce((s, l) => s + l.faturado, 0);
    return { contratado, faturado, saldo: contratado - faturado };
  };
  const tot = linhas.reduce((a, l) => ({ c: a.c + l.contratado, f: a.f + l.faturado }), { c: 0, f: 0 });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturamento por linha QQP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {(["fornecimento", "servico"] as const).map((c) => {
            const g = grupo(c);
            return (
              <div key={c} className="rounded-md border p-3 text-sm">
                <div className="font-semibold">{classLabel(c)}</div>
                <div className="text-xs text-muted-foreground">
                  Contratado {brl(g.contratado)} · Faturado {brl(g.faturado)} · Saldo {brl(g.saldo)} · {pct(g.contratado ? (g.faturado / g.contratado) * 100 : 0)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item QQP</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Und</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead className="text-right">Contratado</TableHead>
                <TableHead className="text-right">Já faturado</TableHead>
                <TableHead className="text-right">Saldo a faturar</TableHead>
                <TableHead className="text-right">% Faturado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">O orçamento desta demanda não tem linhas.</TableCell></TableRow>
              ) : (
                linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.item_qqp ?? "—"}</TableCell>
                    <TableCell className="text-sm">{l.descricao}</TableCell>
                    <TableCell>{l.unidade}</TableCell>
                    <TableCell className="text-xs">{classLabel(l.classificacao)}</TableCell>
                    <TableCell className="text-right">{brl(l.contratado)}</TableCell>
                    <TableCell className="text-right">{brl(l.faturado)}</TableCell>
                    <TableCell className="text-right font-medium">{brl(l.saldo)}</TableCell>
                    <TableCell className="text-right">{pct(l.pct)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {linhas.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">{brl(tot.c)}</TableCell>
                  <TableCell className="text-right">{brl(tot.f)}</TableCell>
                  <TableCell className="text-right">{brl(tot.c - tot.f)}</TableCell>
                  <TableCell className="text-right">{pct(tot.c ? (tot.f / tot.c) * 100 : 0)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">"Já faturado" soma as medições aprovadas de cada linha.</p>
      </CardContent>
    </Card>
  );
}

type Entrada = { qtd: string; pct: string };

export function NovaMedicaoQqpDialog({ open, onOpenChange, pedidoId, linhas }: { open: boolean; onOpenChange: (o: boolean) => void; pedidoId: string; linhas: LinhaSaldo[] }) {
  const qc = useQueryClient();
  const [cab, setCab] = useState({ numero: "", inicio: "", fim: "", observacoes: "" });
  const [ent, setEnt] = useState<Record<string, Entrada>>({});

  const valorDe = (l: LinhaSaldo) => {
    const e = ent[l.id];
    if (!e) return 0;
    if (e.qtd) return Number(e.qtd) * Number(l.preco_unitario);
    if (e.pct) return (Number(e.pct) / 100) * l.contratado;
    return 0;
  };
  const disponivel = (l: LinhaSaldo) => l.contratado - l.faturado - l.emAberto;
  const total = linhas.reduce((s, l) => s + valorDe(l), 0);
  const excede = linhas.some((l) => valorDe(l) > disponivel(l) + 0.005);

  const criar = useMutation({
    mutationFn: async () => {
      const itens = linhas.filter((l) => valorDe(l) > 0);
      if (!itens.length) throw new Error("Informe a quantidade ou o percentual de pelo menos uma linha");
      const { data: med, error } = await supabase
        .from("medicoes")
        .insert({ pedido_id: pedidoId, numero: cab.numero || `MED-${Date.now().toString().slice(-8)}`, periodo_inicio: cab.inicio || null, periodo_fim: cab.fim || null, valor_medido: Math.round(total * 100) / 100, observacoes: cab.observacoes || null })
        .select("id")
        .single();
      if (error) throw error;
      const rows = itens.map((l) => {
        const v = valorDe(l);
        return {
          medicao_id: med.id,
          orcamento_item_id: l.id,
          quantidade: Number(l.preco_unitario) ? v / Number(l.preco_unitario) : 0,
          percentual: l.contratado ? (v / l.contratado) * 100 : 0,
          valor: Math.round(v * 100) / 100,
        };
      });
      const { error: e2 } = await supabase.from("medicao_itens").insert(rows);
      if (e2) {
        await supabase.from("medicoes").delete().eq("id", med.id);
        throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Medição criada");
      setCab({ numero: "", inicio: "", fim: "", observacoes: "" });
      setEnt({});
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["medicoes", pedidoId] });
      qc.invalidateQueries({ queryKey: ["medicao-itens", pedidoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova medição por linha QQP</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Número</Label><Input value={cab.numero} onChange={(e) => setCab({ ...cab, numero: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Início do período</Label><Input type="date" value={cab.inicio} onChange={(e) => setCab({ ...cab, inicio: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Fim do período</Label><Input type="date" value={cab.fim} onChange={(e) => setCab({ ...cab, fim: e.target.value })} /></div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item QQP</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Classif.</TableHead>
                <TableHead className="text-right">Saldo disponível</TableHead>
                <TableHead className="w-28">Qtd medida</TableHead>
                <TableHead className="w-24">% medido</TableHead>
                <TableHead className="text-right">Valor da medição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => {
                const v = valorDe(l);
                const over = v > disponivel(l) + 0.005;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.item_qqp ?? "—"}</TableCell>
                    <TableCell className="text-sm">{l.descricao} <span className="text-xs text-muted-foreground">({l.unidade} · {brl(l.preco_unitario)})</span></TableCell>
                    <TableCell className="text-xs">{classLabel(l.classificacao)}</TableCell>
                    <TableCell className="text-right">{brl(disponivel(l))}</TableCell>
                    <TableCell><Input type="number" step="0.001" value={ent[l.id]?.qtd ?? ""} onChange={(e) => setEnt({ ...ent, [l.id]: { qtd: e.target.value, pct: "" } })} /></TableCell>
                    <TableCell><Input type="number" step="0.01" value={ent[l.id]?.pct ?? ""} onChange={(e) => setEnt({ ...ent, [l.id]: { qtd: "", pct: e.target.value } })} /></TableCell>
                    <TableCell className={`text-right font-medium ${over ? "text-destructive" : ""}`}>{brl(v)}{over && <div className="text-xs">Acima do saldo</div>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>Total da medição</TableCell>
                <TableCell className="text-right">{brl(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div className="space-y-1.5"><Label>Observações</Label><Textarea value={cab.observacoes} onChange={(e) => setCab({ ...cab, observacoes: e.target.value })} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending || excede || total <= 0}>Criar medição</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
