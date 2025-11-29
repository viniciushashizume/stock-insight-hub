import { ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ItemEstoque } from '@/services/api';

interface ScatterChartProps {
  data: ItemEstoque[];
}

const CLUSTER_COLORS = [
  'hsl(var(--cluster-0))',
  'hsl(var(--cluster-1))',
  'hsl(var(--cluster-2))',
  'hsl(var(--cluster-3))',
  'hsl(var(--cluster-4))',
];

export function ScatterChartComponent({ data }: ScatterChartProps) {
  // Pegamos os clusters únicos presentes nos dados
  const uniqueClusters = Array.from(new Set(data.map(d => d.cluster_id))).sort();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 z-50">
          <p className="font-semibold text-foreground mb-1">{item.nome}</p>
          <p className="text-xs text-muted-foreground mb-2">{item.grupo}</p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Consumo:</span> {item.consumo_medio_mensal} un
            </p>
            <p>
              <span className="font-medium">Custo Unit:</span> R$ {item.custo_unitario.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Cluster:</span> {item.cluster_id}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Análise de Dispersão Geral</CardTitle>
        <CardDescription>
          Visualização de consumo vs custo unitário para todos os grupos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <RechartsScatter margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              type="number" 
              dataKey="consumo_medio_mensal" 
              name="Consumo" 
              label={{ value: 'Consumo Médio (un)', position: 'insideBottom', offset: -10 }}
              className="text-xs"
            />
            <YAxis 
              type="number" 
              dataKey="custo_unitario" 
              name="Custo" 
              label={{ value: 'Custo Unit. (R$)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {uniqueClusters.map((clusterId) => (
              <Scatter
                key={clusterId}
                name={`Cluster ${clusterId}`}
                data={data.filter(item => item.cluster_id === clusterId)}
                fill={CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]}
                shape="circle"
              />
            ))}
          </RechartsScatter>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}