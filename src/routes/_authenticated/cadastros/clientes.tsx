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

type Cliente = {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
};

export const Route = createFileRoute("/_authenticated/cadastros/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Cliente[];
    },
  });

  const filtered = rows.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const saveMut = useMutation({
    mutationFn: async (values: Partial<Cliente>) => {
      const payload = {
        nome: values.nome!,
        cnpj: values.cnpj || null,
        contato: values.contato || null,
        email: values.email || null,
        telefone: values.telefone || null,
        endereco: values.endereco || null,
        ativo: values.ativo ?? true,
      };
      if (values.id) {
        const { error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Cliente salvo");
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <CrudPage<Cliente>
        title="Clientes"
        description="Cadastro de clientes atendidos pelos contratos."
        rows={filtered}
        loading={isLoading}
        searchable
        onSearchChange={setSearch}
        columns={[
          { key: "nome", header: "Nome" },
          { key: "cnpj", header: "CNPJ" },
          { key: "contato", header: "Contato" },
          { key: "email", header: "E-mail" },
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
              {editing?.id ? "Editar cliente" : "Novo cliente"}
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
                <Label>Nome *</Label>
                <Input
                  required
                  value={editing.nome ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nome: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={editing.cnpj ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, cnpj: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Input
                    value={editing.contato ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, contato: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={editing.email ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editing.telefone ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, telefone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={editing.endereco ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, endereco: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.ativo ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, ativo: v })}
                />
                <Label>Ativo</Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
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
