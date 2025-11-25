import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemEstoque } from '@/services/api';
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ClusterInsightsProps {
  clusterId: number;
  items: ItemEstoque[];
  mediaGeral: { custoTotal: number; consumo: number };
}

const CLUSTER_INFO: Record<number, { nome: string; cor: string; icon: any; recomendacao: string }> = {
  0: { 
    nome: "Alto Giro / Custo Médio", 
    cor: "hsl(var(--cluster-0))",
    icon: Activity,
    recomendacao: "Manter estoque estratégico. Avaliar contratos de fornecimento para melhor precificação."
  },
  1: { 
    nome: "Alto Giro / Baixo Custo", 
    cor: "hsl(var(--cluster-1))",
    icon: TrendingUp,
    recomendacao: "Otimizar compras em grande volume. Considerar estoque de segurança elevado."
  },
  2: { 
    nome: "Alto Custo / Baixo Giro", 
    cor: "hsl(var(--cluster-2))",
    icon: TrendingDown,
    recomendacao: "Revisar política de compras. Avaliar alternativas de fornecedores e reduzir estoque parado."
  },
  3: { 
    nome: "Crítico / Uso Esporádico", 
    cor: "hsl(var(--cluster-3))",
    icon: AlertCircle,
    recomendacao: "ATENÇÃO: Itens de alto valor com baixíssimo giro. Considerar consignação ou just-in-time."
  },
  4: { 
    nome: "Moderado / Balanceado", 
    cor: "hsl(var(--cluster-4))",
    icon: Activity,
    recomendacao: "Padrão equilibrado. Monitorar tendências de consumo para ajustes futuros."
  }
};

export function ClusterInsights({ clusterId, items, mediaGeral }: ClusterInsightsProps) {
  const info = CLUSTER_INFO[clusterId];
  const Icon = info.icon;
  
  const mediaCluster = {
    custoTotal: items.reduce((acc, item) => acc + (item.custo_total || 0), 0) / items.length,
    consumo: items.reduce((acc, item) => acc + item.consumo_medio_mensal, 0) / items.length
  };

  const chartData = [
    {
      name: 'Custo Total Médio',
      'Cluster': mediaCluster.custoTotal,
      'Média Geral': mediaGeral.custoTotal
    },
    {
      name: 'Consumo Médio',
      'Cluster': mediaCluster.consumo,
      'Média Geral': mediaGeral.consumo
    }
  ];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: info.cor }}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" style={{ color: info.cor }} />
              Cluster {clusterId} - {info.nome}
            </CardTitle>
            <CardDescription className="mt-2">
              {items.length} itens identificados neste grupo
            </CardDescription>
          </div>
          <Badge variant={clusterId === 3 ? "destructive" : "secondary"}>
            {clusterId === 3 ? "CRÍTICO" : "MONITORAR"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Recomendação:</p>
          <p className="text-sm text-muted-foreground">{info.recomendacao}</p>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Cluster" fill={info.cor} />
              <Bar dataKey="Média Geral" fill="hsl(var(--muted-foreground))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Custo Total Médio</p>
            <p className="text-lg font-semibold">R$ {mediaCluster.custoTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Consumo Médio</p>
            <p className="text-lg font-semibold">{Math.round(mediaCluster.consumo)} un/mês</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total em Estoque</p>
            <p className="text-lg font-semibold">
              R$ {items.reduce((acc, item) => acc + (item.custo_unitario * item.qt_estoque), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
