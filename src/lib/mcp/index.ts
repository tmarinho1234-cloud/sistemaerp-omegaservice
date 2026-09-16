import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listarDemandas from "./tools/listar-demandas";
import detalharDemanda from "./tools/detalhar-demanda";
import listarSolicitacoes from "./tools/listar-solicitacoes";
import registrarAtividadeNaoPrevista from "./tools/registrar-atividade-nao-prevista";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "flowright-erp",
  title: "Flowright ERP",
  version: "0.1.0",
  instructions:
    "Ferramentas do ERP industrial (POMG). Use `listar_demandas` para ver as demandas aprovadas e seus status de PCP, `detalhar_demanda` para conjuntos, atividades, databook, romaneios e medições de um POMG, `listar_solicitacoes` para o pipeline de orçamentos e `registrar_atividade_nao_prevista` para lançar uma atividade ou ensaio surgido na produção. Cada chamada age como o usuário conectado, respeitando suas permissões.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listarDemandas, detalharDemanda, listarSolicitacoes, registrarAtividadeNaoPrevista],
});
