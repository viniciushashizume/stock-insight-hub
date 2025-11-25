export interface ItemEstoque {
  id_produto: number;
  nome: string;
  custo_unitario: number;
  consumo_medio_mensal: number;
  qt_estoque: number;
  cluster_id: number;
  descricao_cluster: string;
  custo_total?: number;
}

const MOCK_DATA: ItemEstoque[] = [
  { id_produto: 1, nome: "Luvas Cirúrgicas (Caixa)", custo_unitario: 45.50, consumo_medio_mensal: 850, qt_estoque: 2400, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 2, nome: "Soro Fisiológico 500ml", custo_unitario: 3.20, consumo_medio_mensal: 1500, qt_estoque: 5000, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 3, nome: "Cateter Venoso Central", custo_unitario: 320.00, consumo_medio_mensal: 45, qt_estoque: 120, cluster_id: 2, descricao_cluster: "Alto Custo / Baixo Giro" },
  { id_produto: 4, nome: "Máscara N95 (Unidade)", custo_unitario: 8.50, consumo_medio_mensal: 600, qt_estoque: 1800, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 5, nome: "Gaze Estéril (Pacote)", custo_unitario: 12.00, consumo_medio_mensal: 450, qt_estoque: 1200, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 6, nome: "Desfibrilador Descartável", custo_unitario: 4500.00, consumo_medio_mensal: 2, qt_estoque: 8, cluster_id: 3, descricao_cluster: "Crítico / Uso Esporádico" },
  { id_produto: 7, nome: "Seringa 10ml (Caixa)", custo_unitario: 18.00, consumo_medio_mensal: 950, qt_estoque: 3000, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 8, nome: "Agulha Hipodérmica 21G", custo_unitario: 0.35, consumo_medio_mensal: 2000, qt_estoque: 6500, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 9, nome: "Equipamento Monitorização Cardíaca", custo_unitario: 8500.00, consumo_medio_mensal: 1, qt_estoque: 3, cluster_id: 3, descricao_cluster: "Crítico / Uso Esporádico" },
  { id_produto: 10, nome: "Atadura Elástica (Rolo)", custo_unitario: 6.80, consumo_medio_mensal: 320, qt_estoque: 900, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 11, nome: "Fio de Sutura 4-0", custo_unitario: 55.00, consumo_medio_mensal: 180, qt_estoque: 450, cluster_id: 2, descricao_cluster: "Alto Custo / Baixo Giro" },
  { id_produto: 12, nome: "Álcool 70% (Litro)", custo_unitario: 8.90, consumo_medio_mensal: 800, qt_estoque: 2200, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 13, nome: "Coletor Perfurocortante 3L", custo_unitario: 14.50, consumo_medio_mensal: 280, qt_estoque: 750, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 14, nome: "Endoprótese Vascular", custo_unitario: 15000.00, consumo_medio_mensal: 3, qt_estoque: 5, cluster_id: 3, descricao_cluster: "Crítico / Uso Esporádico" },
  { id_produto: 15, nome: "Esparadrapo (Rolo)", custo_unitario: 4.20, consumo_medio_mensal: 500, qt_estoque: 1400, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 16, nome: "Lâmina Bisturi N°15", custo_unitario: 1.80, consumo_medio_mensal: 650, qt_estoque: 1800, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 17, nome: "Kit Intubação Traqueal", custo_unitario: 280.00, consumo_medio_mensal: 55, qt_estoque: 150, cluster_id: 2, descricao_cluster: "Alto Custo / Baixo Giro" },
  { id_produto: 18, nome: "Compressa Cirúrgica (Pacote)", custo_unitario: 22.00, consumo_medio_mensal: 380, qt_estoque: 1000, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 19, nome: "Dreno Torácico", custo_unitario: 450.00, consumo_medio_mensal: 12, qt_estoque: 35, cluster_id: 2, descricao_cluster: "Alto Custo / Baixo Giro" },
  { id_produto: 20, nome: "Equipo Soro Macrogotas", custo_unitario: 2.50, consumo_medio_mensal: 1200, qt_estoque: 3500, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 21, nome: "Oxímetro de Pulso Digital", custo_unitario: 650.00, consumo_medio_mensal: 8, qt_estoque: 25, cluster_id: 2, descricao_cluster: "Alto Custo / Baixo Giro" },
  { id_produto: 22, nome: "Protetor Facial (Face Shield)", custo_unitario: 15.00, consumo_medio_mensal: 420, qt_estoque: 1100, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 23, nome: "Prótese Cardíaca", custo_unitario: 45000.00, consumo_medio_mensal: 1, qt_estoque: 2, cluster_id: 3, descricao_cluster: "Crítico / Uso Esporádico" },
  { id_produto: 24, nome: "Solução Antisséptica (Litro)", custo_unitario: 28.00, consumo_medio_mensal: 350, qt_estoque: 900, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 25, nome: "Termômetro Digital", custo_unitario: 45.00, consumo_medio_mensal: 95, qt_estoque: 250, cluster_id: 4, descricao_cluster: "Moderado / Balanceado" },
  { id_produto: 26, nome: "Tiras Reagentes Glicemia (Caixa)", custo_unitario: 85.00, consumo_medio_mensal: 220, qt_estoque: 580, cluster_id: 4, descricao_cluster: "Moderado / Balanceado" },
  { id_produto: 27, nome: "Tubo Orotraqueal 7.5", custo_unitario: 35.00, consumo_medio_mensal: 110, qt_estoque: 300, cluster_id: 4, descricao_cluster: "Moderado / Balanceado" },
  { id_produto: 28, nome: "Scalp 21G (Unidade)", custo_unitario: 1.20, consumo_medio_mensal: 850, qt_estoque: 2400, cluster_id: 1, descricao_cluster: "Alto Giro / Baixo Custo" },
  { id_produto: 29, nome: "Avental Cirúrgico Descartável", custo_unitario: 12.50, consumo_medio_mensal: 550, qt_estoque: 1500, cluster_id: 0, descricao_cluster: "Alto Giro / Custo Médio" },
  { id_produto: 30, nome: "Implante Ortopédico Placa Titânio", custo_unitario: 8200.00, consumo_medio_mensal: 4, qt_estoque: 10, cluster_id: 3, descricao_cluster: "Crítico / Uso Esporádico" },
];

export async function fetchDadosClusters(): Promise<ItemEstoque[]> {
  try {
    const response = await fetch('http://localhost:8000/api/dados-clusters');
    
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API');
    }
    
    const data = await response.json();
    return data.map((item: ItemEstoque) => ({
      ...item,
      custo_total: item.custo_unitario * item.consumo_medio_mensal
    }));
  } catch (error) {
    console.warn('API não disponível, usando dados mockados:', error);
    return MOCK_DATA.map(item => ({
      ...item,
      custo_total: item.custo_unitario * item.consumo_medio_mensal
    }));
  }
}

export function calcularEstatisticas(dados: ItemEstoque[]) {
  const valorTotalEstoque = dados.reduce((acc, item) => acc + (item.custo_unitario * item.qt_estoque), 0);
  const totalItens = dados.length;
  const numeroClusters = new Set(dados.map(item => item.cluster_id)).size;
  const itensCriticos = dados.filter(item => item.cluster_id === 3).length;
  
  return {
    valorTotalEstoque,
    totalItens,
    numeroClusters,
    itensCriticos
  };
}

export function agruparPorCluster(dados: ItemEstoque[]) {
  const clusters = new Map<number, ItemEstoque[]>();
  
  dados.forEach(item => {
    if (!clusters.has(item.cluster_id)) {
      clusters.set(item.cluster_id, []);
    }
    clusters.get(item.cluster_id)?.push(item);
  });
  
  return clusters;
}
