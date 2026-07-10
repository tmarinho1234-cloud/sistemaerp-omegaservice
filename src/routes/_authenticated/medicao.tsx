import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/medicao")({
  component: () => (
    <ModulePlaceholder
      title="Medição"
      description="Faturamento e recebimentos: acompanhamento de notas fiscais e previsão de pagamentos."
      phase="Fase 6"
    />
  ),
});
