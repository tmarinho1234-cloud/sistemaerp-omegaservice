import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/orcamentos")({
  component: () => (
    <ModulePlaceholder
      title="Orçamentos"
      description="Recebimento de solicitações, análise técnica, propostas comerciais e aprovações."
      phase="Fase 2"
    />
  ),
});
