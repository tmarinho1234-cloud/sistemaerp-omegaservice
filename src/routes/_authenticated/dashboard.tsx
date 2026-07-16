import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ClipboardList,
  Factory,
  ShieldCheck,
  Truck,
  Receipt,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [contratos, subAreas, equip, func] = await Promise.all([
        supabase.from("contratos").select("*", { count: "exact", head: true }),
        supabase.from("sub_areas").select("*", { count: "exact", head: true }),
        supabase.from("equipamentos").select("*", { count: "exact", head: true }),
        supabase.from("funcionarios").select("*", { count: "exact", head: true }),
      ]);
      return {
        contratos: contratos.count ?? 0,
        subAreas: subAreas.count ?? 0,
        equipamentos: equip.count ?? 0,
        funcionarios: func.count ?? 0,
      };
    },
  });

  const { data: orc } = useQuery({
    queryKey: ["dashboard-orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("status, valor_total");
      if (error) throw error;
      const rows = data ?? [];
      const by = (s: string) => rows.filter((r) => r.status === s);
      const sum = (arr: typeof rows) =>
        arr.reduce((acc, r) => acc + Number(r.valor_total ?? 0), 0);
      const aprovados = by("aprovado");
      const enviados = by("enviado");
      const reprovados = by("reprovado");
      const rascunhos = by("rascunho");
      return {
        aprovadosQtd: aprovados.length,
        enviadosQtd: enviados.length,
        reprovadosQtd: reprovados.length,
        rascunhosQtd: rascunhos.length,
        totalQtd: rows.length,
        valorAprovado: sum(aprovados),
        valorEnviado: sum(enviados),
        valorTotal: sum(rows),
      };
    },
  });

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


  const modules = [
    { title: "Orçamentos", icon: FileText, desc: "Solicitações, propostas e aprovações" },
    { title: "PCP", icon: ClipboardList, desc: "Materiais, planejamento e cronograma" },
    { title: "Produção", icon: Factory, desc: "Corte, dobra, usinagem, soldagem, pintura" },
    { title: "Qualidade", icon: ShieldCheck, desc: "Inspeções e não conformidades" },
    { title: "Expedição", icon: Truck, desc: "Romaneios, notas fiscais e entregas" },
    { title: "Medição", icon: Receipt, desc: "Faturamento e recebimentos" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do sistema. Os indicadores serão preenchidos conforme os módulos entram em operação.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Contratos" value={counts?.contratos ?? 0} />
        <StatCard label="Sub-áreas" value={counts?.subAreas ?? 0} />
        <StatCard label="Equipamentos" value={counts?.equipamentos ?? 0} />
        <StatCard label="Funcionários" value={counts?.funcionarios ?? 0} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.title}>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary grid place-items-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Em construção — disponível em fases seguintes.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
