import { useEffect, useState } from 'react';
import { ClusterInsights } from '@/components/ClusterInsights';
import { fetchDadosClusters, agruparPorCluster, ItemEstoque } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Clusters() {
  const [dados, setDados] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDadosClusters();
        setDados(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do estoque.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando análise de clusters...</p>
        </div>
      </div>
    );
  }

  const clustersMap = agruparPorCluster(dados);
  const mediaGeral = {
    custoTotal: dados.reduce((acc, item) => acc + (item.custo_total || 0), 0) / dados.length,
    consumo: dados.reduce((acc, item) => acc + item.consumo_medio_mensal, 0) / dados.length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Clusters</h1>
        <p className="text-muted-foreground mt-1">
          Insights detalhados dos padrões identificados pelo algoritmo K-Means
        </p>
      </div>

      <div className="space-y-6">
        {[0, 1, 2, 3, 4].map(clusterId => {
          const items = clustersMap.get(clusterId) || [];
          if (items.length === 0) return null;
          
          return (
            <ClusterInsights
              key={clusterId}
              clusterId={clusterId}
              items={items}
              mediaGeral={mediaGeral}
            />
          );
        })}
      </div>
    </div>
  );
}
