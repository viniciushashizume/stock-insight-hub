import { useEffect, useState } from 'react';
import { DollarSign, Package, Layers, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ScatterChartComponent } from '@/components/ScatterChart';
import { fetchDadosClusters, calcularEstatisticas, ItemEstoque } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Overview() {
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
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const stats = calcularEstatisticas(dados);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Dashboard de inteligência de estoque hospitalar</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Valor Total em Estoque"
          value={`R$ ${stats.valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Valor total investido em estoque"
        />
        <KPICard
          title="Total de Itens Analisados"
          value={stats.totalItens}
          icon={Package}
          description="Itens cadastrados no sistema"
        />
        <KPICard
          title="Clusters Identificados"
          value={stats.numeroClusters}
          icon={Layers}
          description="Padrões de consumo detectados"
        />
        <KPICard
          title="Itens Críticos"
          value={stats.itensCriticos}
          icon={AlertTriangle}
          description="Cluster de alto risco"
        />
      </div>

      <ScatterChartComponent data={dados} />
    </div>
  );
}
