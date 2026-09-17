import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage } from "@/components/crud-page";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { dateBr } from "@/components/operations";

type Feriado = { id: string; data: string; nome: string; ativo: boolean };

export const Route = createFileRoute("/_authenticated/cadastros/feriados")({
  head: () => ({
    meta: [
      { title: "Feriados | Omega Service ERP" },
      { name: "description", content: "Cadastro de feriados usados no cálculo de dias úteis do PCP e da aquisição de materiais." },
      { property: "og:title", content: "Feriados | Omega Service ERP" },
      { property: "og:description", content: "Cadastro de feriados usados no cálculo de dias úteis do PCP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeriadosPage,
});

function FeriadosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Feriado> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["feriados-cadastro"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feriados").select("*").order("data");
      if (error) throw error;
      return data as unknown as Feriado[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Feriado>) => {
      const payload = { data: v.data!, nome: v.nome!, ativo: v.ativo ?? true };
      if (v.id) {
        const { error } = await supabase.from("feriados").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("feriados").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Feriado salvo");
      qc.invalidateQueries({ queryKey: ["feriados-cadastro"] });
      qc.invalidateQueries({ queryKey: ["feriados"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feriados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feriado removido");
      qc.invalidateQueries({ queryKey: ["feriados-cadastro"] });
      qc.invalidateQueries({ queryKey: ["feriados"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <CrudPage<Feriado>
        title="Feriados"
        description="Datas desconsideradas no cálculo de dias úteis (aquisição de materiais e prazos do PCP)."
        rows={rows}
        loading={isLoading}
        columns={[
          { key: "data", header: "Data", render: (r) => dateBr(r.data) },
          { key: "nome", header: "Feriado" },
          { key: "ativo", header: "Situação", render: (r) => <span className="text-xs font-medium">{r.ativo ? "Ativo" : "Inativo"}</span> },
        ]}
        onNew={() => setEditing({ ativo: true })}
        onEdit={(r) => setEditing(r)}
        onDelete={async (r) => {
          await deleteMut.mutateAsync(r.id);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar feriado" : "Novo feriado"}</DialogTitle>
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
                <Label>Data *</Label>
                <Input type="date" required value={editing.data ?? ""} onChange={(e) => setEditing({ ...editing, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input required value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex.: Independência" />
              </div>
              <div className="space-y-2">
                <Label>Situação</Label>
                <Select value={String(editing.ativo ?? true)} onValueChange={(v) => setEditing({ ...editing, ativo: v === "true" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMut.isPending}>
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
