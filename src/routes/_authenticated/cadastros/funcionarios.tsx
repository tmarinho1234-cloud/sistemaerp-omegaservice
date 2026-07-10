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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Funcionario = {
  id: string;
  matricula: string;
  nome: string;
  funcao: string | null;
  setor: string | null;
  ativo: boolean;
  data_admissao: string | null;
  observacoes: string | null;
};

export const Route = createFileRoute("/_authenticated/cadastros/funcionarios")({
  component: FuncionariosPage,
});

function FuncionariosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Funcionario> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funcionarios").select("*").order("nome");
      if (error) throw error;
      return data as Funcionario[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Funcionario>) => {
      const payload = {
        matricula: v.matricula!,
        nome: v.nome!,
        funcao: v.funcao || null,
        setor: v.setor || null,
        ativo: v.ativo ?? true,
        data_admissao: v.data_admissao || null,
        observacoes: v.observacoes || null,
      };
      if (v.id) {
        const { error } = await supabase.from("funcionarios").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("funcionarios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Funcionário salvo");
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Funcionário removido");
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <CrudPage<Funcionario>
        title="Funcionários"
        description="Cadastro de colaboradores para apontamentos, absenteísmo e responsabilidade de processos."
        rows={rows}
        loading={isLoading}
        columns={[
          { key: "matricula", header: "Matrícula" },
          { key: "nome", header: "Nome" },
          { key: "funcao", header: "Função" },
          { key: "setor", header: "Setor" },
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
        onNew={() => setEditing({ ativo: true })}
        onEdit={(r) => setEditing(r)}
        onDelete={async (r) => {
          await deleteMut.mutateAsync(r.id);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Editar funcionário" : "Novo funcionário"}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Matrícula *</Label>
                  <Input
                    required
                    value={editing.matricula ?? ""}
                    onChange={(e) => setEditing({ ...editing, matricula: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data admissão</Label>
                  <Input
                    type="date"
                    value={editing.data_admissao ?? ""}
                    onChange={(e) => setEditing({ ...editing, data_admissao: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={editing.nome ?? ""}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input
                    value={editing.funcao ?? ""}
                    onChange={(e) => setEditing({ ...editing, funcao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Input
                    value={editing.setor ?? ""}
                    onChange={(e) => setEditing({ ...editing, setor: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.ativo ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, ativo: v })}
                />
                <Label>Ativo</Label>
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
