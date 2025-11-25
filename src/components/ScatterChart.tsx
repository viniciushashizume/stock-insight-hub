import { ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
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

const CLUSTER_NAMES: Record<number, string> = {
  0: "Alto Giro / Custo Médio",
  1: "Alto Giro / Baixo Custo",
  2: "Alto Custo / Baixo Giro",
  3: "Crítico / Uso Esporádico",
  4: "Moderado / Balanceado"
};

export function ScatterChartComponent({ data }: ScatterChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <p className="font-semibold text-foreground mb-2">{item.nome}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Consumo Médio:</span> {item.consumo_medio_mensal} un/mês
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Custo Unitário:</span> R$ {item.custo_unitario.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Cluster:</span> {CLUSTER_NAMES[item.cluster_id]}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Análise de Dispersão: Consumo vs Custo</CardTitle>
        <CardDescription>
          Visualização dos padrões de consumo e custo por cluster K-Means
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <RechartsScatter>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              type="number" 
              dataKey="consumo_medio_mensal" 
              name="Consumo Médio Mensal"
              label={{ value: 'Consumo Médio Mensal (unidades)', position: 'insideBottom', offset: -5 }}
              className="text-muted-foreground"
            />
            <YAxis 
              type="number" 
              dataKey="custo_unitario" 
              name="Custo Unitário"
              label={{ value: 'Custo Unitário (R$)', angle: -90, position: 'insideLeft' }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => CLUSTER_NAMES[parseInt(value.split(' ')[1])]}
            />
            {[0, 1, 2, 3, 4].map((clusterId) => (
              <Scatter
                key={clusterId}
                name={`Cluster ${clusterId}`}
                data={data.filter(item => item.cluster_id === clusterId)}
                fill={CLUSTER_COLORS[clusterId]}
                shape="circle"
              />
            ))}
          </RechartsScatter>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
