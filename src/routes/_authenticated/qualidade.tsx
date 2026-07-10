import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/qualidade")({
  component: () => (
    <ModulePlaceholder
      title="Qualidade"
      description="Inspeções dimensional, de soldagem e pintura; controle de não conformidades e retrabalho."
      phase="Fase 5"
    />
  ),
});
