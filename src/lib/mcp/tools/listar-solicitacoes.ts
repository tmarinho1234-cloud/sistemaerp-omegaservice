import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_solicitacoes",
  title: "Listar solicitações e propostas",
  description:
    "Lista as solicitações de orçamento com código POMG, contrato, subárea, status e a proposta vinculada (valor, situação, prazo e SLA).",
  inputSchema: {
    status: z.string().optional().describe("Filtro opcional pelo status da solicitação."),
    limite: z.number().int().min(1).max(200).default(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("solicitacoes_orcamento")
      .select(
        "pomg_codigo, numero, status, data_recebimento, prazo_cliente, escopo, contratos(numero, nome, empresa), sub_areas(codigo, nome), orcamentos(numero, status, situacao, valor_total, prazo_dias, data_sla, enviado_em)",
      )
      .order("created_at", { ascending: false })
      .limit(limite ?? 50);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { total: data?.length ?? 0, solicitacoes: data ?? [] },
    };
  },
});
