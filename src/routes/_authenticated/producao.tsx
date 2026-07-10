import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/producao")({
  component: () => (
    <ModulePlaceholder
      title="Produção"
      description="Acompanhamento por Pedido, Conjunto e Processo (corte, dobra, usinagem, soldagem, pintura) e Plano de Perdas."
      phase="Fase 4"
    />
  ),
});
