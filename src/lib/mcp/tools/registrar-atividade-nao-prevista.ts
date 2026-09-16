import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "registrar_atividade_nao_prevista",
  title: "Registrar atividade não prevista",
  description:
    "Registra uma atividade ou ensaio não previsto surgido durante a produção, vinculado a uma demanda POMG.",
  inputSchema: {
    pomg_codigo: z.string().trim().min(1).describe("Código POMG da demanda."),
    nome: z.string().trim().min(1).describe("Nome da atividade ou ensaio."),
    descricao: z.string().trim().optional(),
    observacao: z.string().trim().optional(),
    status: z
      .enum(["pendente", "em_andamento", "concluida"])
      .default("pendente")
      .optional()
      .describe("Situação da atividade."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ pomg_codigo, nome, descricao, observacao, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    const { data: pedido, error: erroPedido } = await supabase
      .from("pedidos")
      .select("id")
      .eq("pomg_codigo", pomg_codigo)
      .maybeSingle();
    if (erroPedido) return { content: [{ type: "text", text: erroPedido.message }], isError: true };
    if (!pedido)
      return {
        content: [{ type: "text", text: `Nenhuma demanda encontrada para ${pomg_codigo}.` }],
        isError: true,
      };

    const { data, error } = await supabase
      .from("atividades_nao_previstas")
      .insert({
        pedido_id: pedido.id,
        nome,
        descricao: descricao ?? null,
        observacao: observacao ?? null,
        status: status ?? "pendente",
        created_by: ctx.getUserId() ?? null,
      })
      .select("id, nome, status")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: `Atividade "${nome}" registrada em ${pomg_codigo}.` }],
      structuredContent: { atividade: data },
    };
  },
});
