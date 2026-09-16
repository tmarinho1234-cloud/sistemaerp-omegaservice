import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_demandas",
  title: "Listar demandas (POMG)",
  description:
    "Lista as demandas aprovadas (pedidos) com código POMG, contrato, subárea, status do PCP, prazo/SLA e avanço.",
  inputSchema: {
    status_pcp: z
      .string()
      .optional()
      .describe("Filtro opcional de status do PCP: nao_iniciado, aguardando_material, em_fabricacao, ag_entrega, entregue, paralisada"),
    contrato: z.string().optional().describe("Filtro opcional por número ou nome do contrato."),
    limite: z.number().int().min(1).max(200).default(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status_pcp, contrato, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("pedidos")
      .select(
        "pomg_codigo, numero, status, pcp_status, data_emissao, prazo_entrega, prazo_dias, data_sla, valor_total, producao_iniciada, data_inicio_producao, contratos(numero, nome, empresa), sub_areas(codigo, nome)",
      )
      .order("created_at", { ascending: false })
      .limit(limite ?? 50);
    if (status_pcp) query = query.eq("pcp_status", status_pcp);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    type Row = NonNullable<typeof data>[number];
    const filtradas = (data ?? []).filter((r: Row) => {
      if (!contrato) return true;
      const c = r.contratos as { numero?: string; nome?: string } | null;
      const alvo = contrato.toLowerCase();
      return (c?.numero ?? "").toLowerCase().includes(alvo) || (c?.nome ?? "").toLowerCase().includes(alvo);
    });

    return {
      content: [{ type: "text", text: JSON.stringify(filtradas, null, 2) }],
      structuredContent: { total: filtradas.length, demandas: filtradas },
    };
  },
});
