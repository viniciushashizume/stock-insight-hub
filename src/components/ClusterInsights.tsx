import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemEstoque } from '@/services/api';
import { Activity } from 'lucide-react';

interface ClusterInsightsProps {
  clusterId: number;
  items: ItemEstoque[];
  grupoNome: string;
}

const CLUSTER_COLORS = [
  'hsl(var(--cluster-0))',
  'hsl(var(--cluster-1))',
  'hsl(var(--cluster-2))',
  'hsl(var(--cluster-3))',
  'hsl(var(--cluster-4))',
];

export function ClusterInsights({ clusterId, items, grupoNome }: ClusterInsightsProps) {
  const color = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
  
  const mediaCluster = {
    custoTotal: items.reduce((acc, item) => acc + (item.custo_total || 0), 0) / items.length,
    consumo: items.reduce((acc, item) => acc + item.consumo_medio_mensal, 0) / items.length,
    custoUnitario: items.reduce((acc, item) => acc + item.custo_unitario, 0) / items.length,
    estoque: items.reduce((acc, item) => acc + item.qt_estoque, 0) / items.length
  };

  // Prepara dados para o gráfico comparando este cluster
  const chartData = [
    {
      name: 'Médias do Cluster',
      'Custo Unitário': mediaCluster.custoUnitario,
      // Normalizamos visualmente para caber no gráfico se necessário, ou usamos log scale, 
      // mas aqui manteremos simples por enquanto
    }
  ];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: color }} />
              Cluster {clusterId}
            </CardTitle>
            <CardDescription className="mt-2">
              {items.length} itens neste cluster ({grupoNome})
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {items.length} Itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Custo Unitário Médio</p>
            <p className="text-lg font-semibold">R$ {mediaCluster.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Consumo Médio (un)</p>
            <p className="text-lg font-semibold">{mediaCluster.consumo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Custo Total Médio</p>
            <p className="text-lg font-semibold">R$ {mediaCluster.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Estoque Médio</p>
            <p className="text-lg font-semibold">{mediaCluster.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Exemplos de Itens neste Cluster:</h4>
            <div className="flex flex-wrap gap-2">
                {items.slice(0, 5).map(item => (
                    <Badge key={item.id_produto} variant="outline" className="text-xs">
                        {item.nome}
                    </Badge>
                ))}
                {items.length > 5 && <span className="text-xs text-muted-foreground self-center">...e mais {items.length - 5}</span>}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}