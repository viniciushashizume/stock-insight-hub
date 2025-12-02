// src/config/clusterDefinitions.ts

export interface ClusterDefinition {
  title: string;
  description: string;
  actions: string[];
}

export interface GroupDefinitions {
  [clusterId: number]: ClusterDefinition;
}

export interface ClusterConfig {
  [groupName: string]: GroupDefinitions;
}

// ========================================================================
// ÁREA DE EDIÇÃO: Altere aqui os textos, títulos e ações
// ========================================================================

export const CLUSTER_DEFINITIONS: ClusterConfig = {
  "Medicamentos": {
    0: {
      title: "Cluster 0: Medicamentos de Alto Giro e Baixo Custo",
      description: "Medicamentos do dia a dia: analgésicos simples, soros fisiológicos ou soluções básicas.",
      actions: [
        "Focar em contratos de fornecimento contínuo e automatização de reposição.",
        "Foco Logístico para manejar o estoque físico, já que ocupam um volume muito grande.",
      ]
    },
    1: {
      title: "Cluster 1: Medicamento de Alto Custo",
      description: "Item Identificado: Spinraza.",
      actions: [
        "Avaliar a possibilidade de compra programada estritamente alinhada às datas de aplicação no paciente, evitando capital parado.",
        "Controle rigoroso de acesso, temperatura e validade. Uma perda desse medicamento representa um prejuízo de quase meio milhão de reais.",
      ]
    },
    2: {
      title: "Cluster 2: Estoque Central de Medicamentos",
      description: "Esse cluster contém a grande maioria dos medicamentos especializados, antibióticos, quimioterápicos ou medicamentos de uso hospitalar",
      actions: [
        "O estoque médio de 12 unidades para um consumo de 2.749 é um fator que indica um perigo logistico. A cobertura de estoque parece insuficiente para suprir a demanda.",
        "A alta rotatividade exige uma reposição de suprimentos muito ágil para que não falte medicamentos.",
      ]
    }
  },
  "Materiais Hospitalares": {
    0: {
      title: "Cluster 0: Materiais de Rotina Hospitalar",
      description: "Insumos cirúrgicos padrão e materiais de enfermagem.",
      actions: [
        "O estoque médio (10,4) parece muito baixo comparado ao consumo médio (5.375).",
        "Isso sugere uma rotatividade extremamente alta ou um risco iminente de falta de material.",
      ]
    },
    1: {
      title: "Cluster 1: Itens de Alto Giro e Baixo Custo",
      description: "Materiais descartáveis de uso massivo e contínuo",
      actions: [
        "Foco total em negociação de volume.",
        "Automatizar a reposição para evitar ruptura operacional, já que são itens básicos.",
      ]
    },
    2: {
      title: "Cluster 2: Outlier de Alto Valor",
      description: "Bomba de Infusão de Insulina Medtronic Minimed 780G MMT- 1896BP",
      actions: [
        "Tratamento individualizado. Não deve entrar em regras de reposição automática.",
        "Avaliar criticidade clínica e financeira antes de qualquer movimentação.",
      ]
    }
  },

  "Bens e Materiais de Manutenção e Conservação": {
    0: {
      title: "Cluster 0: Itens Críticos de Alto Valor",
      description: "Equipamentos ou peças de reposição de custo elevado e baixa saída (apenas 10 itens).",
      actions: [
        "Alerta de Risco: O estoque médio (2 un) está exatamente igual ao consumo médio (2 un). Isso deixa zero margem de segurança para atrasos de fornecedores.",
        "Devido ao alto custo unitário (R$ 698,01), a compra não deve ser massiva, mas o ponto de reposição precisa ser ajustado para evitar a indisponibilidade desses itens críticos."
      ]
    },
    1: {
      title: "Cluster 1: Itens de Rotina e Manutenção Geral",
      description: "Cluster predominante (213 itens) representando a rotina operacional com custos intermediários.",
      actions: [
        "Gestão Saudável: O estoque médio (5 un) cobre o consumo (4 un) com uma pequena margem de segurança. Ideal para reposição automática.",
        "Como concentra a maior variedade de itens, o foco deve ser na redução da base de fornecedores e contratos de fornecimento contínuo para reduzir o trabalho administrativo."
      ]
    },
    2: {
      title: "Cluster 2: Consumíveis de Baixo Valor (Curva C)",
      description: "Itens de valor unitário irrisório (R$ 0,10) e alta rotatividade.",
      actions: [
        "Eficiência Operacional: O custo de processar um pedido de compra aqui é provavelmente maior que o valor do material. Comprar em grandes lotes (caixas fechadas) para longos períodos.",
        "O alto volume de estoque (372 un) é plenamente justificável pelo baixíssimo custo financeiro, servindo como proteção contra flutuações de demanda."
      ]
    }
},

"Dietas": {
    0: {
      title: "Cluster 0: Dietas Especializadas de Uso Esporádico",
      description: "Maior variedade de itens (43) com consumo moderado e custo unitário médio (R$ 57,11).",
      actions: [
        "Equilíbrio de Estoque: O estoque médio (27 un) está bem alinhado ao consumo (22 un), indicando uma gestão eficiente.",
        "Atenção à Validade: Como são itens de nutrição e alimentação, o foco deve ser o controle rigoroso de datas de validade para evitar perdas de produtos."
      ]
    },
    1: {
      title: "Cluster 1: Insumos de Alto Giro e Baixo Custo",
      description: "Item específico (Mistura Nutritiva Parental) com custo unitário irrisório (R$ 0,50) mas altíssimo volume.",
      actions: [
        "Risco de Ruptura: O estoque médio (2.088 un) é exatamente igual ao consumo médio (2.088 un). Isso indica uma operação um pouco arriscada.",
        "Ação Recomendada: Aumentar ligeiramente o estoque de segurança."
      ]
    },
    2: {
      title: "Cluster 2: Alta Relevância Financeira",
      description: "Apenas 3 itens que concentram um Valor Total desproporcionalmente alto (R$ 151.976,43).",
      actions: [
        "Investigação de Custo: Há uma discrepância notável entre o custo unitário médio baixo (R$ 6,44) e o valor total massivo. Isso sugere que o consumo real pode ser muito maior que a média indicada.",
        "Devido ao alto impacto financeiro (mais de 10x o valor dos outros clusters somados), estes 3 itens exigem auditoria imediata de contratos e negociação direta com fornecedores."
      ]
    }
},

"Gasoterapia": {
    0: {
      title: "Cluster 0: Itens de Baixa Rotatividade e Risco de Abastecimento",
      description: "Pequeno grupo (3 itens) com custo unitário mais elevado (R$ 63,41) e baixo volume.",
      actions: [
        "Risco Crítico de Ruptura: O estoque médio (8 un) é exatamente igual ao consumo médio (8 un). Qualquer atraso na entrega resultará na falta imediata do produto.",
        "Ação: Estabelecer um estoque de segurança mínimo imediatamente. A operação está rodando no limite sem margem para variabilidade de demanda."
      ]
    },
    1: {
      title: "Cluster 1: Oxigênio Líquido (Item Estratégico)",
      description: "Representa um único item (Oxigênio Líquido) que, apesar do baixo custo unitário, domina o orçamento do setor (R$ 366.566,33).",
      actions: [
        "Impacto Financeiro: Este único item representa mais de 80% do valor total do grupo. Qualquer negociação de centavos aqui gera o maior impacto de economia no setor.",
        "Gestão Eficiente: Diferente dos outros clusters, aqui o estoque médio (127 un) supera o consumo (103 un), indicando uma margem de segurança de ~23%, o que é adequado para um item vital."
      ]
    },
    2: {
      title: "Cluster 2: Itens Complementares de Giro Moderado",
      description: "Itens intermediários com custo médio de R$ 32,22.",
      actions: [
        "Ajuste de Estoque: Assim como no Cluster 0, o estoque (28 un) está perigosamente próximo do consumo (27 un).",
        "Recomendação: Aumentar ligeiramente o ponto de pedido. O custo de manter 10% a mais de estoque aqui é baixo (aprox. R$ 3.000) comparado ao risco de deixar um paciente sem suporte gasométrico secundário."
      ]
    }
},
"Gêneros Alimentícios": {
    0: {
      title: "Cluster 0: Itens de Alto Impacto Orçamentário",
      description: "Grupo reduzido (12 itens) que concentra a maior parte do gasto total (R$ 40.500,18), indicando serem os insumos principais da dieta (ex: carnes, lácteos).",
      actions: [
        "Gestão Crítica (Just-in-Time): O estoque médio (70 un) cobre o consumo (66 un) com uma margem mínima. Para alimentos perecíveis, isso é positivo para evitar perdas, mas exige fornecedores extremamente pontuais.",
        "Qualquer variação no consumo ou atraso na entrega resultará em falta imediata, dado o baixo nível de estocagem de segurança."
      ]
    },
    1: {
      title: "Cluster 1: Cauda Longa - Diversidade com Baixo Gasto",
      description: "Representa a maioria dos itens cadastrados (82), mas com um Valor Total (R$ 3.488,35) muito baixo comparado ao Cluster 0.",
      actions: [
        "Simplificação: O custo administrativo de gerir 82 itens diferentes para um valor financeiro tão baixo é alto. Avaliar a possibilidade de reduzir a variedade do cardápio.",
        "Estoque Saudável: O estoque (22 un) é superior ao consumo (17 un), oferecendo uma boa margem de segurança para itens que provavelmente são não-perecíveis ou de validade longa."
      ]
    },
    2: {
      title: "Cluster 2: Item de Volume Operacional (Adoçante)",
      description: "Item unitário de custo irrelevante (R$ 0,04) mas com consumo massivo (7.624 un).",
      actions: [
        "Ação Imediata: Aumentar o estoque mínimo."
      ]
    }
}, 

"Impressos e Material de Expediente": {
    0: {
      title: "Cluster 0: Cauda Longa - Alta Variedade e Baixo Valor",
      description: "Este cluster agrupa a vasta maioria dos itens (252 tipos) que, somados, têm um impacto financeiro irrelevante (R$ 2.933,70) comparado ao total do grupo.",
      actions: [
        "Racionalização de Cadastro: Manter 252 itens diferentes para um gasto total tão baixo sugere excesso de especificidade (ex: muitas cores de canetas, tipos de papel desnecessários). A ação recomendada é padronizar itens para reduzir a variedade.",
        "Gestão Simplificada: O estoque (13 un) está muito próximo do consumo (12 un). Embora o risco financeiro seja baixo, a falta de itens básicos de escritório gera chamados desnecessários. Recomenda-se aumentar o estoque de segurança para reduzir o esforço de reposição contínua."
      ]
    },
    1: {
      title: "Cluster 1: Consumíveis de Alto Giro (Etiquetas/Formulários)",
      description: "Apenas 2 itens de custo unitário ínfimo (R$ 0,10) mas com consumo muito elevado (3.532 un).",
      actions: [
        "Risco de Abastecimento: O estoque médio (3.532 un) é exatamente igual ao consumo médio. Isso significa que a operação 'zera' o estoque periodicamente, o que é perigoso para insumos de alto volume.",
        "Eficiência de Compra: Dado o custo unitário de R$ 0,10, o custo processual de emitir um pedido é maior que o do produto. A compra deve ser semestral ou anual, mantendo estoques muito mais altos para evitar paradas por falta de material barato."
      ]
    },
    2: {
      title: "Cluster 2: Foco da Auditoria Financeira",
      description: "Apenas 3 itens concentram R$ 130.617,11, um valor desproporcionalmente alto comparado ao custo unitário médio apresentado (R$ 7,76) e ao consumo moderado (148 un).",
      actions: [
        "Ação Imediata: Auditoria detalhada nestes 3 itens. Eles representam a quase totalidade do orçamento do grupo e exigem controle rigoroso, diferente dos clipes e papéis dos outros clusters."
      ]
    }
},

"Kits Médicos / Cirúrgicos": {
    0: {
      title: "Cluster 0: Diversidade com Estoque Crítico",
      description: "Agrupa 29 itens de custo intermediário (R$ 57,03) mas com giro unitário extremamente baixo (1 un).",
      actions: [
        "Risco Cirúrgico: O estoque médio (1 un) é idêntico ao consumo médio. Em ambiente cirúrgico, não ter margem de segurança significa cancelamento de procedimento se houver qualquer avaria no material no momento do uso.",
        "Ação: Estabelecer estoque mínimo de pelo menos 2 ou 3 unidades para itens vitais, desvinculando a compra da demanda imediata."
      ]
    },
    1: {
      title: "Cluster 1: Item de Apoio (Campo Cirúrgico)",
      description: "Item único de valor irrisório (R$ 1,62) e baixo impacto financeiro total.",
      actions: [
        "Eficiência Logística: O custo de processamento de compra supera o valor do produto. Recomenda-se compra anual ou semestral para evitar trâmites administrativos frequentes.",
        "Ajuste de Estoque: Manter apenas 9 unidades em estoque para um item que custa menos de 2 reais é ineficiente. Aumentar o estoque para reduzir a frequência de reposição."
      ]
    },
    2: {
      title: "Cluster 2: Anomalia Grave de Dados (Avental)",
      description: "Um único item (Avental Cirúrgico G) apresenta um Valor Total de R$ 565.057,32, totalmente incompatível com o consumo médio informado (2 un) e custo unitário (R$ 10,70).",
      actions: [
        "Erro de Cadastro/Conversão: Matematicamente, para atingir R$ 565k com custo de R$ 10,70, o volume real deveria ser superior a 52.000 unidades, não 2. Provavelmente o sistema está lendo 'Caixas' na entrada e 'Unidades' na saída, ou o valor total está somando um histórico muito longo incorretamente.",
        "Auditoria Imediata: Este item sozinho distorce todo o orçamento de Kits. É necessário corrigir a unidade de medida no cadastro para que o algoritmo de reposição funcione corretamente."
      ]
    }
},

"Materiais de Laboratório": {
    0: {
      title: "Cluster 0: Itens Críticos de Alto Valor Agregado",
      description: "Grupo de 18 itens com alto custo unitário médio (R$ 2.394,19), provavelmente reagentes específicos ou peças de equipamentos.",
      actions: [
        "Risco de Indisponibilidade: O estoque médio (1 un) é idêntico ao consumo médio (1 un). Para itens de laboratório, onde a falta de um reagente para a rotina de exames, operar sem margem de segurança é crítico.",
        "Ação: Negociar contratos de consignação ou entregas programadas com fornecedores, dado o alto valor investido (R$ 72k) para um giro tão baixo."
      ]
    },
    1: {
      title: "Cluster 1: Cauda Longa - Alta Variedade e Baixo Giro",
      description: "Representa a vasta maioria dos itens (407), mas com um Valor Total acumulado muito baixo (R$ 8.303,89) frente à quantidade de códigos ativos.",
      actions: [
        "Saneamento de Cadastro: Manter 407 itens diferentes para movimentar apenas R$ 8 mil sugere um cadastro inchado (itens obsoletos ou duplicados). Recomendada revisão técnica para inativar códigos sem uso.",
        "Gestão: O estoque (10 un) cobre o consumo (9 un), o que é adequado para itens de baixo impacto."
      ]
    },
    2: {
      title: "Cluster 2: Consumíveis de Alto Impacto (Curva A)",
      description: "Apenas 7 itens de custo unitário baixo (R$ 1,12) que acumulam o maior valor total do grupo (R$ 100.523,16).",
      actions: [
        "Inconsistência de Volume: O valor total de R$ 100k é desproporcional ao cálculo simples de Custo (1,12) x Consumo (488). Isso indica que o volume real de compra é muito superior à média de consumo apresentada, ou há um erro nos dados.",
        "Ajuste de Estoque: O estoque médio (495 un) está perigosamente próximo do consumo médio (488 un). Tratando-se de itens baratos (R$ 1,12) e essenciais, o estoque deveria ser significativamente aumentado (para 2x ou 3x o consumo) para eliminar risco de ruptura sem impacto financeiro relevante."
      ]
    }
},

"Materiais de uso e consumo": {
    0: {
      title: "Cluster 0: Itens de Consumo Geral (Limpeza/Copa)",
      description: "Agrupa a diversidade do setor (67 itens) com custo médio razoável (R$ 15,09), representando materiais de expediente e limpeza.",
      actions: [
        "Estoque no Limite: O estoque médio (49 un) está perigosamente alinhado ao consumo médio (48 un).",
        "Ação: Aumentar o nível de estoque de segurança."
      ]
    },
    1: {
      title: "Cluster 1: Item de Volume",
      description: "Item identificado: Embalagem plastica preta. Item de valor unitário desprezível (R$ 0,06) mas com alto volume de movimentação.",
      actions: [
        "O estoque (4.250 un) é idêntico ao consumo. Isso sugere que o item chega e acaba no mesmo ciclo.",
        "Custo de Pedido: Emitir pedidos frequentes para um item de 6 centavos é ineficiente. Recomenda-se comprar grandes lotes (ex: estoque para 3 ou 6 meses) para reduzir o custo administrativo, já que o custo de estocagem é baixo."
      ]
    },
    2: {
      title: "Cluster 2: Erro Crítico de Dados (Copo Descartável)",
      description: "Um único item apresenta um Valor Total de R$ 82.184,06, o que é absurdo para 'Copo plástico descartável' com consumo médio de apenas 6 unidades.",
      actions: [
        "Verificação de cadastro. Talvez algum erro está inflando artificialmente o orçamento do setor."
      ]
    }
},

"OPME": {
    0: {
      title: "Cluster 0: Erro de Cadastro (Item Fantasma)",
      description: "Item identificado com estoque físico alto (300 un) mas custo e consumo zerados.",
      actions: [
        "Este cluster representa 'sujeira' no banco de dados. Ter 300 unidades de algo que custa R$ 0,00 e não é consumido distorce a acuracidade do inventário.",
      ]
    },
    1: {
      title: "Cluster 1: Materiais de Custo Intermediário",
      description: "Pequeno grupo (4 itens) com custo relevante (R$ 414,52) e demanda pontual.",
      actions: [
        "Gestão de Consignado: O estoque (1 un) iguala o consumo (1 un). Em OPME, isso é padrão se o material for consignado (pago apenas no uso).",
        "Atenção Financeira: Se estes itens forem de estoque próprio (comprados antecipadamente), manter apenas 1 unidade é arriscado para cirurgias de urgência. Recomenda-se migrar para modelo de consignação para evitar capital parado ou falta de material."
      ]
    },
    2: {
      title: "Cluster 2: Inconsistência Financeira Grave",
      description: "Agrupa 11 itens com alto custo unitário médio (R$ 979,67), mas um Valor Total irrelevante (R$ 1.537,96).",
      actions: [
        "Provavelmente é um indicativo de estoque parado, já que mesmo com o alto custo unitário, o valor total e o consumo são baixos.",
      ]
    }
},

"SAD - Home Care": {
    0: {
      title: "Cluster 0: Itens de Baixíssima Relevância Financeira",
      description: "Agrupa uma alta quantidade de itens (54) que, somados, representam um valor financeiro irrisório (R$ 548,63).",
      actions: [
        "Custo Administrativo Elevado: O esforço de gestão para controlar 54 itens distintos que movimentam apenas R$ 500,00 é desproporcional. Provavelmente são itens obsoletos ou sobras de tratamentos encerrados.",
        "Ação: Realizar uma revisão de portfólio para inativar ou descartar itens que não têm mais utilidade clínica, limpando o cadastro."
      ]
    },
    1: {
      title: "Cluster 1: Medicamento Crítico (Levetiracetam)",
      description: "Item único de alto custo unitário (R$ 103,93) e impacto orçamentário significativo (R$ 36.232,59). Medicamento para tratamento de epilepsia.",
      actions: [
        "O estoque médio (4 un) é exatamente igual ao consumo médio (4 un). Tratando-se de um anticonvulsivante, a falta do medicamento pode gerar internações de emergência, custando muito mais que o próprio remédio.",
        "Anomalia de Consumo: O Valor Total acumulado (R$ 36k) sugere um histórico de uso muito maior do que a média atual (4 un) indica. É necessário verificar se houve desabastecimento recente que derrubou a média artificialmente."
      ]
    },
    2: {
      title: "Cluster 2: Consumível Básico (Luvas)",
      description: "Item de proteção padrão com custo unitário muito baixo (R$ 0,15).",
      actions: [
        "Ação Recomendada: Aumentar o estoque de segurança para cobrir 2 ou 3 meses de demanda. O impacto financeiro de triplicar o estoque seria menor que R$ 100,00, eliminando o risco de faltar EPI básico para a equipe de enfermagem domiciliar."
      ]
    }
},

"Uniformes e E.P.I.": {
    0: {
      title: "Cluster 0: Itens de Proteção de Giro Lento",
      description: "Grupo com 26 itens de custo médio relevante (R$ 73,69) e baixa saída (3 un).",
      actions: [
        "O estoque médio (4 un) está muito próximo do consumo médio (3 un). Para EPIs, isso é arriscado, pois a falta de um equipamento obrigatório pode impedir um funcionário de trabalhar.",
        "Recomendação: Estabelecer um estoque mínimo de segurança ligeiramente maior (ex: 6 a 10 unidades)."
      ]
    },
    1: {
      title: "Cluster 1: Cadastro Inchado / Itens Obsoletos",
      description: "Este cluster agrupa a vasta maioria dos itens (268) com um comportamento estranho: custo unitário alto (R$ 91,76) mas um Valor Total acumulado ínfimo (R$ 1.138,76).",
      actions: [
        "Saneamento de Dados: Matematicamente, ter 268 itens de R$ 90,00 resultaria em um valor de estoque muito maior que R$ 1.000,00. Isso sugere que a maioria desses itens tem estoque zero ou são cadastros antigos sem movimentação real.",
        "Ação: Realizar uma limpeza na base de dados, inativando itens que não são comprados há mais de 12 meses para focar a gestão no que é realmente utilizado.",
        "Talvez também seja uma inconsistência da clusterização, visto que esse grupo obteve o menor score em comparação com os outros."
      ]
    },
    2: {
      title: "Cluster 2: Anomalia Financeira (Protetor Auditivo)",
      description: "Item único de baixíssimo custo (R$ 0,99) e consumo moderado.",
      actions: [
        "Erro de Valor: O Valor Total apresentado (R$ 8.852,67) é incompatível com o consumo (108 un) x custo (R$ 0,99), que daria cerca de R$ 107,00. O sistema está registrando um valor 80 vezes maior que o real.",
        "Causa Provável: Possível erro na unidade de medida de entrada (ex: o sistema deu entrada no valor de uma caixa com 100 unidades como se fosse o valor unitário). Auditoria fiscal necessária para corrigir o custo médio."
      ]
    }
}

};

// Configuração padrão caso o grupo ou cluster não esteja definido acima
export const DEFAULT_DEFINITION: ClusterDefinition = {
  title: "Análise Pendente",
  description: "Cluster sem classificação específica.",
  actions: [
    "Analisar perfil de consumo",
    "Categorizar manualmente",
    "Definir política de estoque"
  ]
};