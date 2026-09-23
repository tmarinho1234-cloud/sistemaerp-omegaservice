import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { DemandaLista } from "@/components/demanda-lista";
import { ModuleHeader, useSincronizacaoTempoReal, useTodosConjuntos, usePedidos } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/medicao/")({
  head: () => ({
    meta: [
      { title: "Medição | Omega Service ERP" },
      { name: "description", content: "Demandas com medições, notas fiscais, vencimentos e pagamentos vinculados ao POMG." },
      { property: "og:title", content: "Medição | Omega Service ERP" },
      { property: "og:description", content: "Demandas com medições, notas fiscais, vencimentos e pagamentos vinculados ao POMG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedicaoListaPage,
});

function MedicaoListaPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  return (
    <div className="space-y-6">
      <ModuleHeader title="Medição" description="Escolha a demanda para ver medições, faturamento, pagamentos e encerramento." icon={Receipt} />
      <DemandaLista
        titulo="Demandas para medição"
        pedidos={pedidos}
        conjuntos={conjuntos}
        vazio="Nenhuma demanda disponível."
        onSelect={(p) => navigate({ to: "/medicao/$pedidoId", params: { pedidoId: p.id } })}
      />
    </div>
  );
}
