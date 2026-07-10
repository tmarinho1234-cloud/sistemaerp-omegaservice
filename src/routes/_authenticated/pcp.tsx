import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_authenticated/pcp")({
  component: () => (
    <ModulePlaceholder
      title="PCP — Planejamento e Controle da Produção"
      description="Levantamento de materiais, planejamento, cronograma e estrutura Pedido/Conjunto/Peça com TAG."
      phase="Fase 3"
    />
  ),
});
