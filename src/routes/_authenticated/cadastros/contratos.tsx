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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Contrato = {
  id: string;
  cliente_id: string;
  nome: string;
  numero: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  prazo_pagamento_dias: number | null;
  observacoes: string | null;
  ativo: boolean;
  clientes?: { nome: string } | null;
};

export const Route = createFileRoute("/_authenticated/cadastros/contratos")({
  component: ContratosPage,
});

function ContratosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Contrato> | null>(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*, clientes(nome)")
        .order("nome");
      if (error) throw error;
      return data as Contrato[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Contrato>) => {
      const payload = {
        cliente_id: v.cliente_id!,
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
        description="Contratos vigentes (Alumar, Vale Ferrosos, Vale Base Metals e outros)."
        rows={rows}
        loading={isLoading}
        columns={[
          { key: "nome", header: "Contrato" },
          { key: "numero", header: "Número" },
          {
            key: "cliente",
            header: "Cliente",
            render: (r) => r.clientes?.nome ?? "—",
          },
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
                <Label>Cliente *</Label>
                <Select
                  value={editing.cliente_id}
                  onValueChange={(v) => setEditing({ ...editing, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do contrato *</Label>
                <Input
                  required
                  value={editing.nome ?? ""}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                  placeholder="Ex.: Alumar, Vale Ferrosos, Vale Base Metals"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={editing.numero ?? ""}
                    onChange={(e) => setEditing({ ...editing, numero: e.target.value })}
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
