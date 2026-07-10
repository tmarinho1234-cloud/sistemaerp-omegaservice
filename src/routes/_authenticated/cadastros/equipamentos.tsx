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

type Equipamento = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string | null;
  setor: string | null;
  status: string;
  observacoes: string | null;
};

const STATUS = ["disponivel", "em_uso", "manutencao", "inativo"] as const;

export const Route = createFileRoute("/_authenticated/cadastros/equipamentos")({
  component: EquipamentosPage,
});

function EquipamentosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Equipamento> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["equipamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos").select("*").order("codigo");
      if (error) throw error;
      return data as Equipamento[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Equipamento>) => {
      const payload = {
        codigo: v.codigo!,
        nome: v.nome!,
        tipo: v.tipo || null,
        setor: v.setor || null,
        status: v.status || "disponivel",
        observacoes: v.observacoes || null,
      };
      if (v.id) {
        const { error } = await supabase.from("equipamentos").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipamentos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Equipamento salvo");
      qc.invalidateQueries({ queryKey: ["equipamentos"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipamento removido");
      qc.invalidateQueries({ queryKey: ["equipamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <CrudPage<Equipamento>
        title="Equipamentos"
        description="Máquinas e equipamentos utilizados na produção."
        rows={rows}
        loading={isLoading}
        columns={[
          { key: "codigo", header: "Código" },
          { key: "nome", header: "Nome" },
          { key: "tipo", header: "Tipo" },
          { key: "setor", header: "Setor" },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <span className="text-xs font-medium capitalize">
                {r.status.replace("_", " ")}
              </span>
            ),
          },
        ]}
        onNew={() => setEditing({ status: "disponivel" })}
        onEdit={(r) => setEditing(r)}
        onDelete={async (r) => {
          await deleteMut.mutateAsync(r.id);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Editar equipamento" : "Novo equipamento"}
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
                  <Label>Código *</Label>
                  <Input
                    required
                    value={editing.codigo ?? ""}
                    onChange={(e) => setEditing({ ...editing, codigo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    required
                    value={editing.nome ?? ""}
                    onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Input
                    value={editing.tipo ?? ""}
                    onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}
                    placeholder="Corte, dobra, solda..."
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editing.status ?? "disponivel"}
                  onValueChange={(v) => setEditing({ ...editing, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
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
