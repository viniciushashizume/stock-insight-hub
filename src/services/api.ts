export interface ItemEstoque {
  id_produto: number;
  nome: string;
  grupo: string; // Novo campo para o Grupo de Material
  custo_unitario: number;
  consumo_medio_mensal: number;
  qt_estoque: number;
  cluster_id: number;
  custo_total?: number;
}

// Dados de exemplo estruturados conforme os grupos do seu arquivo kmeans_cluster.txt
// Isso serve de fallback se a API falhar ou para testes visuais imediatos
const MOCK_DATA: ItemEstoque[] = [
  // Materiais Hospitalares (Cluster 0, 1, 2)
  { id_produto: 1, nome: "Luvas Cirúrgicas", grupo: "Materiais Hospitalares", custo_unitario: 45.50, consumo_medio_mensal: 5375, qt_estoque: 2400, cluster_id: 0 },
  { id_produto: 2, nome: "Seringa 10ml", grupo: "Materiais Hospitalares", custo_unitario: 0.50, consumo_medio_mensal: 338000, qt_estoque: 5000, cluster_id: 1 },
  { id_produto: 3, nome: "Cateter Especial", grupo: "Materiais Hospitalares", custo_unitario: 17800.00, consumo_medio_mensal: 1, qt_estoque: 1, cluster_id: 2 },
  
  // Medicamentos
  { id_produto: 4, nome: "Dipirona 500mg", grupo: "Medicamentos", custo_unitario: 10.24, consumo_medio_mensal: 12160, qt_estoque: 900, cluster_id: 0 },
  { id_produto: 5, nome: "Antibiótico Beta", grupo: "Medicamentos", custo_unitario: 876.84, consumo_medio_mensal: 2749, qt_estoque: 12, cluster_id: 2 },
  { id_produto: 6, nome: "Imunoglobulina", grupo: "Medicamentos", custo_unitario: 362228.00, consumo_medio_mensal: 24, qt_estoque: 1, cluster_id: 1 },

  // Dietas
  { id_produto: 7, nome: "Dieta Enteral Padrão", grupo: "Dietas", custo_unitario: 57.11, consumo_medio_mensal: 265, qt_estoque: 27, cluster_id: 0 },
  { id_produto: 8, nome: "Suplemento Hiperproteico", grupo: "Dietas", custo_unitario: 6.44, consumo_medio_mensal: 19156, qt_estoque: 353, cluster_id: 2 },

  // Mat. Limpeza
  { id_produto: 9, nome: "Detergente Enzimático", grupo: "Material de Limpeza e Higiene", custo_unitario: 38.75, consumo_medio_mensal: 777, qt_estoque: 3, cluster_id: 0 },
  
  // OPME
  { id_produto: 10, nome: "Prótese de Quadril", grupo: "OPME", custo_unitario: 979.67, consumo_medio_mensal: 1.7, qt_estoque: 1, cluster_id: 2 }
];

export async function fetchDadosClusters(): Promise<ItemEstoque[]> {
  try {
    // Tenta buscar da API real
    const response = await fetch('http://localhost:8000/api/dados-clusters');
    
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API');
    }
    
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      // Garante o cálculo se não vier do back
      custo_total: item.custo_total || (item.custo_unitario * item.consumo_medio_mensal)
    }));
  } catch (error) {
    console.warn('API não disponível ou erro de conexão. Usando dados de fallback para interface.', error);
    // Retorna fallback estruturado
    return MOCK_DATA.map(item => ({
      ...item,
      custo_total: item.custo_unitario * item.consumo_medio_mensal
    }));
  }
}

export function calcularEstatisticas(dados: ItemEstoque[]) {
  const valorTotalEstoque = dados.reduce((acc, item) => acc + (item.custo_unitario * item.qt_estoque), 0);
  const totalItens = dados.length;
  // Conta grupos únicos
  const numeroGrupos = new Set(dados.map(item => item.grupo)).size;
  // Exemplo de regra crítica genérica (pode ser ajustada)
  const itensCriticos = dados.filter(item => item.custo_unitario > 1000 && item.qt_estoque < 5).length;
  
  return {
    valorTotalEstoque,
    totalItens,
    numeroGrupos,
    itensCriticos
  };
}

export function agruparPorGrupoECluster(dados: ItemEstoque[]) {
  const estrutura: Record<string, Record<number, ItemEstoque[]>> = {};
  
  dados.forEach(item => {
    if (!estrutura[item.grupo]) {
      estrutura[item.grupo] = {};
    }
    if (!estrutura[item.grupo][item.cluster_id]) {
      estrutura[item.grupo][item.cluster_id] = [];
    }
    estrutura[item.grupo][item.cluster_id].push(item);
  });
  
  return estrutura;
}