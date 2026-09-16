import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "detalhar_demanda",
  title: "Detalhar demanda",
  description:
    "Detalha uma demanda pelo código POMG: dados do pedido, conjuntos com peso e avanço, atividades, relatórios do databook, romaneios e medições.",
  inputSchema: {
    pomg_codigo: z.string().trim().min(1).describe("Código POMG da demanda, ex. POMG-001-2026."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ pomg_codigo }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(
        "id, pomg_codigo, numero, status, pcp_status, data_emissao, prazo_entrega, prazo_dias, data_sla, valor_total, producao_iniciada, data_inicio_producao, contratos(numero, nome, empresa), sub_areas(codigo, nome)",
      )
      .eq("pomg_codigo", pomg_codigo)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!pedido)
      return {
        content: [{ type: "text", text: `Nenhuma demanda aprovada encontrada para ${pomg_codigo}.` }],
        isError: true,
      };

    const [conjuntos, atividades, relatorios, romaneios, medicoes] = await Promise.all([
      supabase
        .from("pedido_conjuntos")
        .select(
          "id, codigo, tag, descricao, quantidade, quantidade_fabricada, peso_kg, peso_fabricado_kg, status, progresso, liberado_qualidade, inicio_previsto, fim_previsto",
        )
        .eq("pedido_id", pedido.id)
        .order("codigo"),
      supabase
        .from("pedido_conjunto_atividades")
        .select("conjunto_id, atividade, nome_extra, status, quantidade_executada, ordem")
        .eq("pedido_id", pedido.id)
        .order("ordem"),
      supabase
        .from("databook_relatorios")
        .select("tipo, nome_ensaio, status, nome_arquivo")
        .eq("pedido_id", pedido.id),
      supabase.from("romaneios").select("numero, data_romaneio, destino, status").eq("pedido_id", pedido.id),
      supabase
        .from("medicoes")
        .select("numero, periodo_inicio, periodo_fim, valor_medido, status")
        .eq("pedido_id", pedido.id),
    ]);

    const payload = {
      demanda: pedido,
      conjuntos: conjuntos.data ?? [],
      atividades: atividades.data ?? [],
      databook: relatorios.data ?? [],
      romaneios: romaneios.data ?? [],
      medicoes: medicoes.data ?? [],
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
