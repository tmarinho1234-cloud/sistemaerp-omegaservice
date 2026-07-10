import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/expedicao")({
  component: () => (
    <ModulePlaceholder
      title="Expedição"
      description="Romaneios, notas fiscais, entregas próprias ou retiradas pelo cliente."
      phase="Fase 6"
    />
  ),
});
