import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { DemandaLista } from "@/components/demanda-lista";
import { ModuleHeader, useSincronizacaoTempoReal, useTodosConjuntos, usePedidos } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/expedicao/")({
  head: () => ({
    meta: [
      { title: "Expedição | Omega Service ERP" },
      { name: "description", content: "Demandas com conjuntos prontos para entrega, romaneios e notas fiscais por POMG." },
      { property: "og:title", content: "Expedição | Omega Service ERP" },
      { property: "og:description", content: "Demandas com conjuntos prontos para entrega, romaneios e notas fiscais por POMG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExpedicaoListaPage,
});

function ExpedicaoListaPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  return (
    <div className="space-y-6">
      <ModuleHeader title="Expedição" description="Escolha a demanda para ver saldos por conjunto, romaneios e notas fiscais." icon={Truck} />
      <DemandaLista
        titulo="Demandas para expedição"
        pedidos={pedidos}
        conjuntos={conjuntos}
        vazio="Nenhuma demanda disponível."
        onSelect={(p) => navigate({ to: "/expedicao/$pedidoId", params: { pedidoId: p.id } })}
      />
    </div>
  );
}
