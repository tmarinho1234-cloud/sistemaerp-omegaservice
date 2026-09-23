import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { DemandaLista } from "@/components/demanda-lista";
import { ModuleHeader, useSincronizacaoTempoReal, useTodosConjuntos, usePedidos } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/qualidade/")({
  head: () => ({
    meta: [
      { title: "Qualidade | Omega Service ERP" },
      { name: "description", content: "Demandas em acompanhamento da qualidade, com inspeções, não conformidades e liberação." },
      { property: "og:title", content: "Qualidade | Omega Service ERP" },
      { property: "og:description", content: "Demandas em acompanhamento da qualidade, com inspeções, não conformidades e liberação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QualidadeListaPage,
});

function QualidadeListaPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Qualidade"
        description="Escolha a demanda para ver os conjuntos, os relatórios definidos na análise técnica e as não conformidades."
        icon={ShieldCheck}
      />
      <DemandaLista
        titulo="Demandas para inspeção"
        pedidos={pedidos}
        conjuntos={conjuntos}
        vazio="Nenhuma demanda disponível."
        onSelect={(p) => navigate({ to: "/qualidade/$pedidoId", params: { pedidoId: p.id } })}
      />
    </div>
  );
}
