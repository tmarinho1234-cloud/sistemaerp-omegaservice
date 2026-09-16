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
          aquisicao_materiais: boolean
          created_at: string
          data_analise: string
          horas_estimadas: number | null
          id: string
          materiais: string | null
          parecer: string
          prazo_aquisicao_dias: number | null
          processos: string | null
          responsavel_id: string | null
          solicitacao_id: string
          updated_at: string
          viavel: boolean
        }
        Insert: {
          aquisicao_materiais?: boolean
          created_at?: string
          data_analise?: string
          horas_estimadas?: number | null
          id?: string
          materiais?: string | null
          parecer: string
          prazo_aquisicao_dias?: number | null
          processos?: string | null
          responsavel_id?: string | null
          solicitacao_id: string
          updated_at?: string
          viavel?: boolean
        }
        Update: {
          aquisicao_materiais?: boolean
          created_at?: string
          data_analise?: string
          horas_estimadas?: number | null
          id?: string
          materiais?: string | null
          parecer?: string
          prazo_aquisicao_dias?: number | null
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
      apontamentos_producao: {
        Row: {
          conjunto_id: string
          created_at: string
          created_by: string | null
          equipamento_id: string | null
          etapa_id: string | null
          fim: string | null
          funcionario_id: string | null
          id: string
          inicio: string
          observacoes: string | null
          pedido_id: string
          peso_executado_kg: number | null
          processo: string
          quantidade_executada: number
          status: string
          updated_at: string
        }
        Insert: {
          conjunto_id: string
          created_at?: string
          created_by?: string | null
          equipamento_id?: string | null
          etapa_id?: string | null
          fim?: string | null
          funcionario_id?: string | null
          id?: string
          inicio?: string
          observacoes?: string | null
          pedido_id: string
          peso_executado_kg?: number | null
          processo: string
          quantidade_executada?: number
          status?: string
          updated_at?: string
        }
        Update: {
          conjunto_id?: string
          created_at?: string
          created_by?: string | null
          equipamento_id?: string | null
          etapa_id?: string | null
          fim?: string | null
          funcionario_id?: string | null
          id?: string
          inicio?: string
          observacoes?: string | null
          pedido_id?: string
          peso_executado_kg?: number | null
          processo?: string
          quantidade_executada?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apontamentos_producao_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_producao_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_producao_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "cronograma_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_producao_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_nao_previstas: {
        Row: {
          conjunto_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          observacao: string | null
          pedido_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          observacao?: string | null
          pedido_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          pedido_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_nao_previstas_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_nao_previstas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
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
      cronograma_etapas: {
        Row: {
          conjunto_id: string
          created_at: string
          fim_previsto: string | null
          id: string
          inicio_previsto: string | null
          ordem: number
          peso_percentual: number
          processo: string
          progresso: number
          status: string
          updated_at: string
        }
        Insert: {
          conjunto_id: string
          created_at?: string
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          ordem?: number
          peso_percentual?: number
          processo: string
          progresso?: number
          status?: string
          updated_at?: string
        }
        Update: {
          conjunto_id?: string
          created_at?: string
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          ordem?: number
          peso_percentual?: number
          processo?: string
          progresso?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_etapas_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      databook_relatorios: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string | null
          nome_ensaio: string | null
          observacoes: string | null
          pedido_id: string
          status: string
          storage_path: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          nome_ensaio?: string | null
          observacoes?: string | null
          pedido_id: string
          status?: string
          storage_path?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          nome_ensaio?: string | null
          observacoes?: string | null
          pedido_id?: string
          status?: string
          storage_path?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "databook_relatorios_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      demanda_requisitos: {
        Row: {
          created_at: string
          id: string
          nome_ensaio: string | null
          solicitacao_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_ensaio?: string | null
          solicitacao_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_ensaio?: string | null
          solicitacao_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "demanda_requisitos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_orcamento"
            referencedColumns: ["id"]
          },
        ]
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
      inspecoes_qualidade: {
        Row: {
          conjunto_id: string
          created_at: string
          data_inspecao: string
          id: string
          inspetor_id: string | null
          observacoes: string | null
          pedido_id: string
          reinspecao_de: string | null
          resultado: string
          tipo: string
          updated_at: string
        }
        Insert: {
          conjunto_id: string
          created_at?: string
          data_inspecao?: string
          id?: string
          inspetor_id?: string | null
          observacoes?: string | null
          pedido_id: string
          reinspecao_de?: string | null
          resultado?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          conjunto_id?: string
          created_at?: string
          data_inspecao?: string
          id?: string
          inspetor_id?: string | null
          observacoes?: string | null
          pedido_id?: string
          reinspecao_de?: string | null
          resultado?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_qualidade_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecoes_qualidade_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecoes_qualidade_reinspecao_de_fkey"
            columns: ["reinspecao_de"]
            isOneToOne: false
            referencedRelation: "inspecoes_qualidade"
            referencedColumns: ["id"]
          },
        ]
      }
      medicoes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          numero: string
          observacoes: string | null
          pedido_id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          romaneio_id: string | null
          status: string
          updated_at: string
          valor_medido: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          pedido_id: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          romaneio_id?: string | null
          status?: string
          updated_at?: string
          valor_medido?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          pedido_id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          romaneio_id?: string | null
          status?: string
          updated_at?: string
          valor_medido?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          acao_corretiva: string | null
          conjunto_id: string
          created_at: string
          descricao: string
          exige_retrabalho: boolean
          id: string
          inspecao_id: string
          pedido_id: string
          status: string
          updated_at: string
        }
        Insert: {
          acao_corretiva?: string | null
          conjunto_id: string
          created_at?: string
          descricao: string
          exige_retrabalho?: boolean
          id?: string
          inspecao_id: string
          pedido_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          acao_corretiva?: string | null
          conjunto_id?: string
          created_at?: string
          descricao?: string
          exige_retrabalho?: boolean
          id?: string
          inspecao_id?: string
          pedido_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          created_at: string
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          medicao_id: string | null
          numero: string
          observacoes: string | null
          pedido_id: string
          status: string
          updated_at: string
          valor: number
          valor_recebido: number
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          medicao_id?: string | null
          numero: string
          observacoes?: string | null
          pedido_id: string
          status?: string
          updated_at?: string
          valor?: number
          valor_recebido?: number
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          medicao_id?: string | null
          numero?: string
          observacoes?: string | null
          pedido_id?: string
          status?: string
          updated_at?: string
          valor?: number
          valor_recebido?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_medicao_id_fkey"
            columns: ["medicao_id"]
            isOneToOne: false
            referencedRelation: "medicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
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
      orcamento_conjunto_atividades: {
        Row: {
          atividade: string
          conjunto_id: string
          created_at: string
          id: string
          nome_extra: string | null
          ordem: number
        }
        Insert: {
          atividade: string
          conjunto_id: string
          created_at?: string
          id?: string
          nome_extra?: string | null
          ordem?: number
        }
        Update: {
          atividade?: string
          conjunto_id?: string
          created_at?: string
          id?: string
          nome_extra?: string | null
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_conjunto_atividades_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "orcamento_conjuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_conjuntos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          peso_kg: number | null
          quantidade: number
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id: string
          ordem?: number
          peso_kg?: number | null
          quantidade?: number
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          peso_kg?: number | null
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_conjuntos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_historico: {
        Row: {
          acao: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          orcamento_id: string
          solicitacao_id: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          acao: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          orcamento_id: string
          solicitacao_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          acao?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          orcamento_id?: string
          solicitacao_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_historico_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_historico_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_orcamento"
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
          data_sla: string | null
          enviado_em: string | null
          id: string
          motivo_reprovacao: string | null
          numero: string
          pomg_codigo: string | null
          prazo_dias: number | null
          prazo_execucao_dias: number | null
          respondido_em: string | null
          situacao: string
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
          data_sla?: string | null
          enviado_em?: string | null
          id?: string
          motivo_reprovacao?: string | null
          numero: string
          pomg_codigo?: string | null
          prazo_dias?: number | null
          prazo_execucao_dias?: number | null
          respondido_em?: string | null
          situacao?: string
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
          data_sla?: string | null
          enviado_em?: string | null
          id?: string
          motivo_reprovacao?: string | null
          numero?: string
          pomg_codigo?: string | null
          prazo_dias?: number | null
          prazo_execucao_dias?: number | null
          respondido_em?: string | null
          situacao?: string
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
      paralisacoes: {
        Row: {
          apontamento_id: string | null
          conjunto_id: string | null
          created_at: string
          created_by: string | null
          detalhe: string | null
          duracao_horas: number | null
          equipamento_id: string | null
          fim: string | null
          id: string
          inicio: string
          motivo: string
          pedido_id: string
        }
        Insert: {
          apontamento_id?: string | null
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          detalhe?: string | null
          duracao_horas?: number | null
          equipamento_id?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          motivo: string
          pedido_id: string
        }
        Update: {
          apontamento_id?: string | null
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          detalhe?: string | null
          duracao_horas?: number | null
          equipamento_id?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          motivo?: string
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paralisacoes_apontamento_id_fkey"
            columns: ["apontamento_id"]
            isOneToOne: false
            referencedRelation: "apontamentos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paralisacoes_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paralisacoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paralisacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pcp_planos: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim_prevista: string | null
          data_inicio: string | null
          id: string
          observacoes: string | null
          pedido_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          pedido_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pcp_planos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: true
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pcp_reprogramacoes: {
        Row: {
          conjunto_id: string | null
          created_at: string
          created_by: string | null
          data_anterior: string | null
          id: string
          impacto_dias: number
          motivo: string
          nova_data: string
          pedido_id: string
        }
        Insert: {
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          data_anterior?: string | null
          id?: string
          impacto_dias?: number
          motivo: string
          nova_data: string
          pedido_id: string
        }
        Update: {
          conjunto_id?: string | null
          created_at?: string
          created_by?: string | null
          data_anterior?: string | null
          id?: string
          impacto_dias?: number
          motivo?: string
          nova_data?: string
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pcp_reprogramacoes_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pcp_reprogramacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_conjunto_atividades: {
        Row: {
          atividade: string
          conjunto_id: string
          created_at: string
          id: string
          nome_extra: string | null
          observacoes: string | null
          ordem: number
          pedido_id: string
          peso_executado_kg: number
          quantidade_executada: number
          status: string
          updated_at: string
        }
        Insert: {
          atividade: string
          conjunto_id: string
          created_at?: string
          id?: string
          nome_extra?: string | null
          observacoes?: string | null
          ordem?: number
          pedido_id: string
          peso_executado_kg?: number
          quantidade_executada?: number
          status?: string
          updated_at?: string
        }
        Update: {
          atividade?: string
          conjunto_id?: string
          created_at?: string
          id?: string
          nome_extra?: string | null
          observacoes?: string | null
          ordem?: number
          pedido_id?: string
          peso_executado_kg?: number
          quantidade_executada?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_conjunto_atividades_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_conjunto_atividades_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_conjuntos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          fim_previsto: string | null
          id: string
          inicio_previsto: string | null
          liberado_qualidade: boolean
          orcamento_conjunto_id: string | null
          pedido_id: string
          peso_fabricado_kg: number
          peso_kg: number | null
          prioridade: number
          progresso: number
          quantidade: number
          quantidade_fabricada: number
          status: string
          tag: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          liberado_qualidade?: boolean
          orcamento_conjunto_id?: string | null
          pedido_id: string
          peso_fabricado_kg?: number
          peso_kg?: number | null
          prioridade?: number
          progresso?: number
          quantidade?: number
          quantidade_fabricada?: number
          status?: string
          tag: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          liberado_qualidade?: boolean
          orcamento_conjunto_id?: string | null
          pedido_id?: string
          peso_fabricado_kg?: number
          peso_kg?: number | null
          prioridade?: number
          progresso?: number
          quantidade?: number
          quantidade_fabricada?: number
          status?: string
          tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_conjuntos_orcamento_conjunto_id_fkey"
            columns: ["orcamento_conjunto_id"]
            isOneToOne: false
            referencedRelation: "orcamento_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_conjuntos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
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
          data_inicio_producao: string | null
          data_sla: string | null
          id: string
          numero: string
          observacoes: string | null
          orcamento_id: string | null
          pcp_status: string
          pomg_codigo: string | null
          prazo_dias: number | null
          prazo_entrega: string | null
          producao_iniciada: boolean
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
          data_inicio_producao?: string | null
          data_sla?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          orcamento_id?: string | null
          pcp_status?: string
          pomg_codigo?: string | null
          prazo_dias?: number | null
          prazo_entrega?: string | null
          producao_iniciada?: boolean
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
          data_inicio_producao?: string | null
          data_sla?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          orcamento_id?: string | null
          pcp_status?: string
          pomg_codigo?: string | null
          prazo_dias?: number | null
          prazo_entrega?: string | null
          producao_iniciada?: boolean
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
      pomg_sequencias: {
        Row: {
          ano: number
          ultimo: number
        }
        Insert: {
          ano: number
          ultimo?: number
        }
        Update: {
          ano?: number
          ultimo?: number
        }
        Relationships: []
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
      romaneio_itens: {
        Row: {
          conjunto_id: string
          created_at: string
          id: string
          peso_kg: number | null
          quantidade: number
          romaneio_id: string
        }
        Insert: {
          conjunto_id: string
          created_at?: string
          id?: string
          peso_kg?: number | null
          quantidade: number
          romaneio_id: string
        }
        Update: {
          conjunto_id?: string
          created_at?: string
          id?: string
          peso_kg?: number | null
          quantidade?: number
          romaneio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "romaneio_itens_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneio_notas: {
        Row: {
          conjunto_id: string | null
          created_at: string
          data_emissao: string | null
          id: string
          numero: string
          observacoes: string | null
          peso_kg: number | null
          romaneio_id: string
          valor: number | null
        }
        Insert: {
          conjunto_id?: string | null
          created_at?: string
          data_emissao?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          peso_kg?: number | null
          romaneio_id: string
          valor?: number | null
        }
        Update: {
          conjunto_id?: string | null
          created_at?: string
          data_emissao?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          peso_kg?: number | null
          romaneio_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "romaneio_notas_conjunto_id_fkey"
            columns: ["conjunto_id"]
            isOneToOne: false
            referencedRelation: "pedido_conjuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_notas_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios: {
        Row: {
          created_at: string
          created_by: string | null
          data_romaneio: string
          destino: string | null
          id: string
          numero: string
          observacoes: string | null
          pedido_id: string
          status: string
          transporte: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_romaneio?: string
          destino?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          pedido_id: string
          status?: string
          transporte?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_romaneio?: string
          destino?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          pedido_id?: string
          status?: string
          transporte?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
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
          pomg_codigo: string | null
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
          pomg_codigo?: string | null
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
          pomg_codigo?: string | null
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
      has_any_business_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      proximo_pomg: { Args: never; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
