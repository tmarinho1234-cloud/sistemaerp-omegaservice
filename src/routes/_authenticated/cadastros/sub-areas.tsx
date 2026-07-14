import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage } from "@/components/crud-page";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type SubArea = {
  id: string;
  contrato_id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  ativo: boolean;
  contratos?: { nome: string; empresa: string } | null;
};

export const Route = createFileRoute("/_authenticated/cadastros/sub-areas")({
  component: SubAreasPage,
});

function SubAreasPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<SubArea> | null>(null);
  const [contratoFilter, setContratoFilter] = useState<string>("todos");

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
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["sub-areas", contratoFilter],
    queryFn: async () => {
      let q = supabase
        .from("sub_areas")
        .select("*, contratos(nome, empresa)")
        .order("nome");
      if (contratoFilter !== "todos") q = q.eq("contrato_id", contratoFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as SubArea[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<SubArea>) => {
      const payload = {
        contrato_id: v.contrato_id!,
        nome: v.nome!,
        codigo: v.codigo || null,
        descricao: v.descricao || null,
        ativo: v.ativo ?? true,
      };
      if (v.id) {
        const { error } = await supabase.from("sub_areas").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_areas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Sub-área salva");
      qc.invalidateQueries({ queryKey: ["sub-areas"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sub-área removida");
      qc.invalidateQueries({ queryKey: ["sub-areas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 max-w-xs">
        <Label className="text-xs text-muted-foreground">Filtrar por contrato</Label>
        <Select value={contratoFilter} onValueChange={setContratoFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os contratos</SelectItem>
            {contratos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.empresa} — {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CrudPage<SubArea>
        title="Sub-áreas"
        description="Sub-áreas de cada contrato (ex.: Integridade Estrutural, Ferrovia, Projetos Capital, Sobressalentes Porto)."
        rows={rows}
        loading={isLoading}
        columns={[
          {
            key: "contrato",
            header: "Contrato",
            render: (r) =>
              r.contratos ? `${r.contratos.empresa} — ${r.contratos.nome}` : "—",
          },
          { key: "nome", header: "Sub-área" },
          { key: "codigo", header: "Código" },
          {
            key: "ativo",
            header: "Status",
            render: (r) => (
              <span
                className={
                  r.ativo
                    ? "text-success text-xs font-medium"
                    : "text-muted-foreground text-xs"
                }
              >
                {r.ativo ? "Ativa" : "Inativa"}
              </span>
            ),
          },
        ]}
        onNew={() =>
          setEditing({
            ativo: true,
            contrato_id: contratoFilter !== "todos" ? contratoFilter : undefined,
          })
        }
        onEdit={(r) => setEditing(r)}
        onDelete={async (r) => {
          await deleteMut.mutateAsync(r.id);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Editar sub-área" : "Nova sub-área"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate(editing);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Contrato *</Label>
                <Select
                  value={editing.contrato_id}
                  onValueChange={(v) => setEditing({ ...editing, contrato_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Nome *</Label>
                  <Input
                    required
                    placeholder="Ex.: Integridade Estrutural"
                    value={editing.nome ?? ""}
                    onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Código</Label>
                  <Input
                    value={editing.codigo ?? ""}
                    onChange={(e) => setEditing({ ...editing, codigo: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={editing.descricao ?? ""}
                  onChange={(e) => setEditing({ ...editing, descricao: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.ativo ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, ativo: v })}
                />
                <Label>Ativa</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMut.isPending || !editing.contrato_id}>
                  {saveMut.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
