import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemEstoque } from '@/services/api';
import { Activity, ClipboardList, AlertCircle } from 'lucide-react';
import { CLUSTER_DEFINITIONS, DEFAULT_DEFINITION } from '@/config/clusterDefinitions';

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
  
  // Lógica para buscar a definição correta baseada no Grupo e no ID do Cluster
  const groupConfig = CLUSTER_DEFINITIONS[grupoNome];
  const clusterConfig = groupConfig ? groupConfig[clusterId] : null;
  
  // Se não achar configuração específica, usa o padrão
  const definition = clusterConfig || {
    ...DEFAULT_DEFINITION,
    title: `Cluster ${clusterId} (Padrão)`, // Mantém o ID se não tiver nome
  };

  const mediaCluster = {
    custoTotal: items.reduce((acc, item) => acc + (item.custo_total || 0), 0) / (items.length || 1),
    consumo: items.reduce((acc, item) => acc + item.consumo_medio_mensal, 0) / (items.length || 1),
    custoUnitario: items.reduce((acc, item) => acc + item.custo_unitario, 0) / (items.length || 1),
    estoque: items.reduce((acc, item) => acc + item.qt_estoque, 0) / (items.length || 1)
  };

  return (
    <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: color }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5" style={{ color: color }} />
              {definition.title}
            </CardTitle>
            <CardDescription className="mt-1 font-medium text-foreground/80">
              {definition.description}
            </CardDescription>
            <CardDescription className="text-xs mt-1">
              Grupo: {grupoNome} | Cluster ID: {clusterId}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {items.length} Itens
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Métricas do Cluster */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-muted/30 p-3 rounded-md border border-muted">
            <p className="text-xs text-muted-foreground uppercase font-bold">Custo Unit. Médio</p>
            <p className="text-lg font-semibold">R$ {mediaCluster.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md border border-muted">
            <p className="text-xs text-muted-foreground uppercase font-bold">Consumo Médio</p>
            <p className="text-lg font-semibold">{mediaCluster.consumo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} un</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md border border-muted">
            <p className="text-xs text-muted-foreground uppercase font-bold">Valor Total</p>
            <p className="text-lg font-semibold">R$ {mediaCluster.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md border border-muted">
            <p className="text-xs text-muted-foreground uppercase font-bold">Estoque Médio</p>
            <p className="text-lg font-semibold">{mediaCluster.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} un</p>
          </div>
        </div>

        {/* Seção de Ações Logísticas (Substituindo os Exemplos) */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300">
                <ClipboardList className="h-4 w-4" />
                Plano de Ação Logística Recomendado
            </h4>
            
            {definition.actions.length > 0 ? (
                <ul className="space-y-2">
                    {definition.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span>{action}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                    <AlertCircle className="h-4 w-4" />
                    Nenhuma ação definida para este perfil.
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}