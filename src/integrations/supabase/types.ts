export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analises_tecnicas: {
        Row: {
          created_at: string
          data_analise: string
          horas_estimadas: number | null
          id: string
          materiais: string | null
          parecer: string
          processos: string | null
          responsavel_id: string | null
          solicitacao_id: string
          updated_at: string
          viavel: boolean
        }
        Insert: {
          created_at?: string
          data_analise?: string
          horas_estimadas?: number | null
          id?: string
          materiais?: string | null
          parecer: string
          processos?: string | null
          responsavel_id?: string | null
          solicitacao_id: string
          updated_at?: string
          viavel?: boolean
        }
        Update: {
          created_at?: string
          data_analise?: string
          horas_estimadas?: number | null
          id?: string
          materiais?: string | null
          parecer?: string
          processos?: string | null
          responsavel_id?: string | null
          solicitacao_id?: string
          updated_at?: string
          viavel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "analises_tecnicas_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_orcamento"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_linhas_preco: {
        Row: {
          codigo: string
          contrato_id: string
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          preco_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          codigo: string
          contrato_id: string
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          contrato_id?: string
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_linhas_preco_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          empresa: string
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          prazo_pagamento_dias: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa: string
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          prazo_pagamento_dias?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa?: string
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          prazo_pagamento_dias?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          setor: string | null
          status: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          setor?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          setor?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          data_admissao: string | null
          funcao: string | null
          id: string
          matricula: string
          nome: string
          observacoes: string | null
          setor: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_admissao?: string | null
          funcao?: string | null
          id?: string
          matricula: string
          nome: string
          observacoes?: string | null
          setor?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_admissao?: string | null
          funcao?: string | null
          id?: string
          matricula?: string
          nome?: string
          observacoes?: string | null
          setor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orcamento_anexos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nome: string
          orcamento_id: string
          storage_path: string
          tamanho: number | null
          tipo: string | null
          uploaded_by: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          nome: string
          orcamento_id: string
          storage_path: string
          tamanho?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nome?: string
          orcamento_id?: string
          storage_path?: string
          tamanho?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_anexos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          categoria: Database["public"]["Enums"]["qqp_categoria"]
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          peso_kg: number | null
          preco_total: number | null
          preco_unitario: number
          quantidade: number
          unidade: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["qqp_categoria"]
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          peso_kg?: number | null
          preco_total?: number | null
          preco_unitario?: number
          quantidade?: number
          unidade?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["qqp_categoria"]
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          peso_kg?: number | null
          preco_total?: number | null
          preco_unitario?: number
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          arquivo_path: string | null
          condicoes_comerciais: string | null
          created_at: string
          created_by: string | null
          enviado_em: string | null
          id: string
          motivo_reprovacao: string | null
          numero: string
          prazo_execucao_dias: number | null
          respondido_em: string | null
          solicitacao_id: string
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          validade: string | null
          valor_total: number
        }
        Insert: {
          arquivo_path?: string | null
          condicoes_comerciais?: string | null
          created_at?: string
          created_by?: string | null
          enviado_em?: string | null
          id?: string
          motivo_reprovacao?: string | null
          numero: string
          prazo_execucao_dias?: number | null
          respondido_em?: string | null
          solicitacao_id: string
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_total?: number
        }
        Update: {
          arquivo_path?: string | null
          condicoes_comerciais?: string | null
          created_at?: string
          created_by?: string | null
          enviado_em?: string | null
          id?: string
          motivo_reprovacao?: string | null
          numero?: string
          prazo_execucao_dias?: number | null
          respondido_em?: string | null
          solicitacao_id?: string
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_orcamento"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          contrato_id: string | null
          created_at: string
          created_by: string | null
          data_emissao: string
          id: string
          numero: string
          observacoes: string | null
          orcamento_id: string | null
          prazo_entrega: string | null
          status: Database["public"]["Enums"]["pedido_status"]
          sub_area_id: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          id?: string
          numero: string
          observacoes?: string | null
          orcamento_id?: string | null
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          sub_area_id?: string | null
          updated_at?: string
          valor_total?: number
        }
        Update: {
          contrato_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          id?: string
          numero?: string
          observacoes?: string | null
          orcamento_id?: string | null
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          sub_area_id?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_sub_area_id_fkey"
            columns: ["sub_area_id"]
            isOneToOne: false
            referencedRelation: "sub_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          matricula: string | null
          nome: string
          setor: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          matricula?: string | null
          nome: string
          setor?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          matricula?: string | null
          nome?: string
          setor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      solicitacao_anexos: {
        Row: {
          created_at: string
          id: string
          nome: string
          solicitacao_id: string
          storage_path: string
          tamanho: number | null
          tipo: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          solicitacao_id: string
          storage_path: string
          tamanho?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          solicitacao_id?: string
          storage_path?: string
          tamanho?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_anexos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_orcamento"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_orcamento: {
        Row: {
          contrato_id: string
          created_at: string
          created_by: string | null
          data_recebimento: string
          escopo: string
          id: string
          numero: string
          observacoes: string | null
          prazo_cliente: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["solicitacao_status"]
          sub_area_id: string | null
          updated_at: string
        }
        Insert: {
          contrato_id: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string
          escopo: string
          id?: string
          numero: string
          observacoes?: string | null
          prazo_cliente?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["solicitacao_status"]
          sub_area_id?: string | null
          updated_at?: string
        }
        Update: {
          contrato_id?: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string
          escopo?: string
          id?: string
          numero?: string
          observacoes?: string | null
          prazo_cliente?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["solicitacao_status"]
          sub_area_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_orcamento_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_orcamento_sub_area_id_fkey"
            columns: ["sub_area_id"]
            isOneToOne: false
            referencedRelation: "sub_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_areas: {
        Row: {
          ativo: boolean
          codigo: string | null
          contrato_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          contrato_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          contrato_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_areas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "orcamentos"
        | "pcp"
        | "producao"
        | "qualidade"
        | "expedicao"
        | "medicao"
        | "viewer"
      orcamento_status: "rascunho" | "enviado" | "aprovado" | "reprovado"
      pedido_status: "aberto" | "em_producao" | "concluido" | "cancelado"
      qqp_categoria: "kg" | "hora" | "m2" | "formato_a1" | "diaria" | "outros"
      solicitacao_status:
        | "recebida"
        | "em_analise"
        | "orcamento_em_elaboracao"
        | "enviada"
        | "aprovada"
        | "reprovada"
        | "convertida_pedido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "orcamentos",
        "pcp",
        "producao",
        "qualidade",
        "expedicao",
        "medicao",
        "viewer",
      ],
      orcamento_status: ["rascunho", "enviado", "aprovado", "reprovado"],
      pedido_status: ["aberto", "em_producao", "concluido", "cancelado"],
      qqp_categoria: ["kg", "hora", "m2", "formato_a1", "diaria", "outros"],
      solicitacao_status: [
        "recebida",
        "em_analise",
        "orcamento_em_elaboracao",
        "enviada",
        "aprovada",
        "reprovada",
        "convertida_pedido",
      ],
    },
  },
} as const
