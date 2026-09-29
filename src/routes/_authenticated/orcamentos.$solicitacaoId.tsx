import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailEmpty, DetailShell } from "@/components/detail-page";
import { useSincronizacaoTempoReal } from "@/components/operations";
import {
  AnaliseTab,
  AprovacaoTab,
  ConjuntosTab,
  PropostaTab,
  STATUS_LABEL,
  STATUS_VARIANT,
  SolicitacaoTab,
  formatDate,
  type Solicitacao,
} from "./orcamentos.index";

export const Route = createFileRoute("/_authenticated/orcamentos/$solicitacaoId")({
  head: () => ({
    meta: [
      { title: "Demanda de orçamento | Omega Service ERP" },
      { name: "description", content: "Solicitação, conjuntos, análise técnica, proposta e aprovação da demanda POMG." },
      { property: "og:title", content: "Demanda de orçamento | Omega Service ERP" },
      { property: "og:description", content: "Solicitação, conjuntos, análise técnica, proposta e aprovação da demanda POMG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrcamentoDetalhePage,
});

function OrcamentoDetalhePage() {
  const { solicitacaoId } = Route.useParams();
  const navigate = useNavigate();
  useSincronizacaoTempoReal();

  const { data: lista = [] } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_orcamento")
        .select("*, contratos(numero), sub_areas(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Solicitacao[];
    },
  });

  const { data: sol, isLoading } = useQuery({
    queryKey: ["solicitacao", solicitacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_orcamento")
        .select("*, contratos(numero), sub_areas(nome)")
        .eq("id", solicitacaoId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Solicitacao) ?? null;
    },
  });

  const indice = lista.findIndex((s) => s.id === solicitacaoId);
  const anterior = indice > 0 ? lista[indice - 1] : undefined;
  const proximo = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : undefined;

  const voltar = () => navigate({ to: "/orcamentos" });

  if (!sol) {
    return <DetailEmpty modulo="Orçamentos" onBack={voltar} message={isLoading ? "Carregando demanda..." : "Solicitação não encontrada."} />;
  }

  return (
    <DetailShell
      modulo="Orçamentos"
      title={sol.pomg_codigo ?? sol.numero}
      badges={<Badge variant={STATUS_VARIANT[sol.status]}>{STATUS_LABEL[sol.status]}</Badge>}
      subtitle={`${sol.contratos?.numero ?? "—"}${sol.sub_areas?.nome ? ` · ${sol.sub_areas.nome}` : ""} · recebida em ${formatDate(sol.data_recebimento)}`}
      onBack={voltar}
      onPrev={anterior ? () => navigate({ to: "/orcamentos/$solicitacaoId", params: { solicitacaoId: anterior.id } }) : undefined}
      onNext={proximo ? () => navigate({ to: "/orcamentos/$solicitacaoId", params: { solicitacaoId: proximo.id } }) : undefined}
    >
      <Tabs defaultValue="solicitacao">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="solicitacao">Solicitação</TabsTrigger>
          <TabsTrigger value="conjuntos">Conjuntos</TabsTrigger>
          <TabsTrigger value="analise">Análise</TabsTrigger>
          <TabsTrigger value="proposta">Proposta</TabsTrigger>
          <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
        </TabsList>
        <TabsContent value="solicitacao" className="mt-4 space-y-4">
          <SolicitacaoTab sol={sol} />
        </TabsContent>
        <TabsContent value="conjuntos" className="mt-4">
          <ConjuntosTab sol={sol} />
        </TabsContent>
        <TabsContent value="analise" className="mt-4">
          <AnaliseTab solicitacaoId={sol.id} />
        </TabsContent>
        <TabsContent value="proposta" className="mt-4">
          <PropostaTab sol={sol} />
        </TabsContent>
        <TabsContent value="aprovacao" className="mt-4">
          <AprovacaoTab sol={sol} />
        </TabsContent>
      </Tabs>
    </DetailShell>
  );
}
