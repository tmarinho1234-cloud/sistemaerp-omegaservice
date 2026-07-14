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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Contrato = {
  id: string;
  empresa: string;
  nome: string;
  numero: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  prazo_pagamento_dias: number | null;
  observacoes: string | null;
  ativo: boolean;
};

export const Route = createFileRoute("/_authenticated/cadastros/contratos")({
  component: ContratosPage,
});

function ContratosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Contrato> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .order("empresa");
      if (error) throw error;
      return data as Contrato[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Contrato>) => {
      const payload = {
        empresa: v.empresa!,
        nome: v.nome!,
        numero: v.numero || null,
        data_inicio: v.data_inicio || null,
        data_fim: v.data_fim || null,
        prazo_pagamento_dias: v.prazo_pagamento_dias ?? 30,
        observacoes: v.observacoes || null,
        ativo: v.ativo ?? true,
      };
      if (v.id) {
        const { error } = await supabase.from("contratos").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contratos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Contrato salvo");
      qc.invalidateQueries({ queryKey: ["contratos"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contratos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contrato removido");
      qc.invalidateQueries({ queryKey: ["contratos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <CrudPage<Contrato>
        title="Contratos"
        description="Contratos vigentes (Alumar, Vale Ferrosos, Vale Base Metals e outros). Sub-áreas são cadastradas separadamente."
        rows={rows}
        loading={isLoading}
        columns={[
          { key: "empresa", header: "Empresa" },
          { key: "nome", header: "Contrato" },
          { key: "numero", header: "Número" },
          { key: "data_inicio", header: "Início" },
          { key: "data_fim", header: "Fim" },
          {
            key: "ativo",
            header: "Status",
            render: (r) => (
              <span className={r.ativo ? "text-success text-xs font-medium" : "text-muted-foreground text-xs"}>
                {r.ativo ? "Ativo" : "Inativo"}
              </span>
            ),
          },
        ]}
        onNew={() => setEditing({ ativo: true, prazo_pagamento_dias: 30 })}
        onEdit={(r) => setEditing(r)}
        onDelete={async (r) => {
          await deleteMut.mutateAsync(r.id);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar contrato" : "Novo contrato"}</DialogTitle>
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
                <Label>Empresa *</Label>
                <Input
                  required
                  placeholder="Ex.: Vale, Alumar"
                  value={editing.empresa ?? ""}
                  onChange={(e) => setEditing({ ...editing, empresa: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do contrato *</Label>
                <Input
                  required
                  value={editing.nome ?? ""}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                  placeholder="Ex.: Vale Metálicos, Alumar Refinaria"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={editing.numero ?? ""}
                    onChange={(e) => setEditing({ ...editing, numero: e.target.value })}
                    placeholder="Ex.: 278"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo pagto (dias)</Label>
                  <Input
                    type="number"
                    value={editing.prazo_pagamento_dias ?? 30}
                    onChange={(e) =>
                      setEditing({ ...editing, prazo_pagamento_dias: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="date"
                    value={editing.data_inicio ?? ""}
                    onChange={(e) => setEditing({ ...editing, data_inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="date"
                    value={editing.data_fim ?? ""}
                    onChange={(e) => setEditing({ ...editing, data_fim: e.target.value })}
                  />
                </div>
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
