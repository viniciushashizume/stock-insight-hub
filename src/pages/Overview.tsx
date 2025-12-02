import { useEffect, useState, useMemo } from 'react';
import { DollarSign, Package, Layers, AlertTriangle, BarChart3 } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ScatterChartComponent } from '@/components/ScatterChart';
import { fetchDadosClusters, calcularEstatisticas, ItemEstoque } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Cores dos clusters consistentes com o CSS global
const CLUSTER_COLORS = [
  'hsl(var(--cluster-0))',
  'hsl(var(--cluster-1))',
  'hsl(var(--cluster-2))',
  'hsl(var(--cluster-3))',
  'hsl(var(--cluster-4))',
];

export default function Overview() {
  const [dados, setDados] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>("Todos");
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

  // Extrai a lista de grupos únicos para o filtro
  const gruposDisponiveis = useMemo(() => {
    const grupos = new Set(dados.map(item => item.grupo));
    return Array.from(grupos).sort();
  }, [dados]);

  // Filtra os dados com base na seleção
  const dadosFiltrados = useMemo(() => {
    if (grupoSelecionado === "Todos") return dados;
    return dados.filter(item => item.grupo === grupoSelecionado);
  }, [dados, grupoSelecionado]);

  // Calcula estatísticas baseadas nos dados filtrados (KPIS dinâmicos)
  const stats = calcularEstatisticas(dadosFiltrados);

  // Prepara dados para o gráfico de distribuição de clusters
  const dadosDistribuicao = useMemo(() => {
    const contagem: Record<number, number> = {};
    dadosFiltrados.forEach(item => {
      contagem[item.cluster_id] = (contagem[item.cluster_id] || 0) + 1;
    });

    return Object.entries(contagem).map(([clusterId, count]) => ({
      name: `Cluster ${clusterId}`,
      clusterId: Number(clusterId),
      quantidade: count,
    })).sort((a, b) => a.clusterId - b.clusterId);
  }, [dadosFiltrados]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Dashboard de inteligência de estoque hospitalar</p>
        </div>
        
        {/* Seletor de Grupo */}
        <div className="w-full md:w-64">
          <Select value={grupoSelecionado} onValueChange={setGrupoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Grupos</SelectItem>
              {gruposDisponiveis.map(grupo => (
                <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Dinâmicos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Valor em Estoque (Filtro)"
          value={`R$ ${stats.valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Valor financeiro dos itens selecionados"
        />
        <KPICard
          title="Itens no Grupo"
          value={stats.totalItens}
          icon={Package}
          description="Quantidade de SKUs listados"
        />
        <KPICard
          title="Grupos Ativos"
          value={grupoSelecionado === "Todos" ? stats.numeroGrupos : 1}
          icon={Layers}
          description={grupoSelecionado === "Todos" ? "Total de categorias" : "Grupo único selecionado"}
        />
        <KPICard
          title="Itens Críticos"
          value={stats.itensCriticos}
          icon={AlertTriangle}
          description="Itens de alto valor e baixo giro"
        />
      </div>

      {/* Gráfico de Distribuição de Clusters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição de Clusters
          </CardTitle>
          <CardDescription>
            Quantidade de itens por cluster em: <strong>{grupoSelecionado}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDistribuicao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {dadosDistribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.clusterId % CLUSTER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Dispersão (Scatter) */}
      <ScatterChartComponent data={dadosFiltrados} />
    </div>
  );
}