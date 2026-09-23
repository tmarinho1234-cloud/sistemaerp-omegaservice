import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck } from "lucide-react";
import { DemandaLista } from "@/components/demanda-lista";
import { ModuleHeader, useSincronizacaoTempoReal, useTodosConjuntos, usePedidos } from "@/components/operations";

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

function DatabookListaPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  return (
    <div className="space-y-6">
      <ModuleHeader title="Databook" description="Escolha a demanda para ver os relatórios definidos, arquivos e situação." icon={BookOpenCheck} />
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
