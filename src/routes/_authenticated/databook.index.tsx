import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpenCheck } from "lucide-react";
import { DemandaLista } from "@/components/demanda-lista";
import { MetricCard, ModuleHeader, REQUISITOS, useSincronizacaoTempoReal, useTodosConjuntos, usePedidos } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/databook/")({
  head: () => ({
    meta: [
      { title: "Databook | Omega Service ERP" },
      { name: "description", content: "Demandas POMG com o checklist de relatórios e ensaios reunidos no databook." },
      { property: "og:title", content: "Databook | Omega Service ERP" },
      { property: "og:description", content: "Demandas POMG com o checklist de relatórios e ensaios reunidos no databook." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DatabookListaPage,
});

type RelatorioResumo = { id: string; tipo: string; nome_ensaio: string | null; status: string };

function DatabookListaPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  const { data: relatorios = [] } = useQuery({
    queryKey: ["databook-indicadores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("databook_relatorios").select("id, tipo, nome_ensaio, status");
      if (error) throw error;
      return data as unknown as RelatorioResumo[];
    },
  });

  const total = relatorios.length;
  const pendentes = relatorios.filter((r) => r.status !== "aprovado").length;
  const porTipo = REQUISITOS.map((req) => {
    const itens = relatorios.filter((r) => r.tipo === req.value);
    const aprovados = itens.filter((r) => r.status === "aprovado").length;
    return { ...req, total: itens.length, aprovados, pendentes: itens.length - aprovados };
  }).filter((t) => t.total > 0);

  return (
    <div className="space-y-6">
      <ModuleHeader title="Databook" description="Escolha a demanda para ver os relatórios definidos, arquivos e situação." icon={BookOpenCheck} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Relatórios" value={total} detail="Total em todas as demandas" />
        <MetricCard label="Pendentes" value={pendentes} detail="Aguardando aprovação" tone={pendentes > 0 ? "warning" : "success"} />
        {porTipo.map((t) => (
          <MetricCard
            key={t.value}
            label={t.label}
            value={t.total}
            detail={`Aprovados: ${t.aprovados} · Pendentes: ${t.pendentes}`}
            tone={t.pendentes > 0 ? "warning" : "success"}
          />
        ))}
      </div>

      <DemandaLista
        titulo="Demandas com databook"
        pedidos={pedidos}
        conjuntos={conjuntos}
        vazio="Nenhuma demanda disponível."
        onSelect={(p) => navigate({ to: "/databook/$pedidoId", params: { pedidoId: p.id } })}
      />
    </div>
  );
}
