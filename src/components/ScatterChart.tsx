import { useState, useMemo } from 'react';
import { ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [useLogScale, setUseLogScale] = useState(true);

  if (!data || data.length === 0) return null;

  const uniqueClusters = Array.from(new Set(data.map(d => d.cluster_id))).sort();

  // Tratamento de dados para escala logarítmica (não aceita 0)
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Se usar log, substitui 0 por um valor mínimo (0.1) para não quebrar o gráfico
      consumo_visual: useLogScale && d.consumo_medio_mensal <= 0 ? 0.1 : d.consumo_medio_mensal,
      custo_visual: useLogScale && d.custo_unitario <= 0 ? 0.1 : d.custo_unitario,
    }));
  }, [data, useLogScale]);

  // Médias para as linhas de referência
  const avgConsumo = useMemo(() => data.reduce((acc, curr) => acc + curr.consumo_medio_mensal, 0) / data.length, [data]);
  const avgCusto = useMemo(() => data.reduce((acc, curr) => acc + curr.custo_unitario, 0) / data.length, [data]);

  // --- LÓGICA DE MARGEM (PADDING) ---
  const getDomainWithPadding = (values: number[], isLog: boolean) => {
    if (values.length === 0) return ['auto', 'auto'];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (isLog) {
      // Para logaritmo, usamos multiplicadores para dar margem
      // Evita log(0) forçando o mínimo a ser pelo menos 0.05 se o dado for muito baixo
      const safeMin = min <= 0 ? 0.1 : min;
      return [safeMin * 0.5, max * 2]; // Margem maior no topo para log
    } else {
      // Para linear, usamos porcentagem do range
      const range = max - min || (max || 1); // fallback se max == min
      const padding = range * 0.1; // 10% de margem
      
      // Se o mínimo for 0, tentamos manter perto de 0, mas permitimos um pequeno negativo visual
      // para a bolinha não cortar se estiver exatamente na linha do zero
      return [min - padding, max + padding];
    }
  };

  // Calcula os domínios com margem baseados nos dados visuais
  const xValues = chartData.map(d => d.consumo_visual);
  const yValues = chartData.map(d => d.custo_visual);
  
  const xDomain = getDomainWithPadding(xValues, useLogScale);
  const yDomain = getDomainWithPadding(yValues, useLogScale);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 z-50 text-sm max-w-[250px]">
          <p className="font-bold text-foreground mb-1 truncate">{item.nome || 'Item sem nome'}</p>
          <div className="flex justify-between items-center mb-2">
             <Badge variant="secondary" className="text-[10px] h-5">{item.grupo}</Badge>
             <span className="text-xs text-muted-foreground">ID: {item.id_produto}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Consumo:</span>
            <span className="font-mono text-foreground text-right">{item.consumo_medio_mensal.toLocaleString()} un</span>
            <span>Custo Unit:</span>
            <span className="font-mono text-foreground text-right">R$ {item.custo_unitario.toFixed(2)}</span>
            <span>Total:</span>
            <span className="font-mono text-foreground text-right font-semibold">R$ {(item.custo_total || 0).toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Análise de Dispersão (Matriz de Valor)</CardTitle>
            <CardDescription>
              Relação entre Consumo (Eixo X) e Custo Unitário (Eixo Y)
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 border p-2 rounded-md bg-muted/30">
            <Switch 
              id="log-mode" 
              checked={useLogScale} 
              onCheckedChange={setUseLogScale} 
            />
            <Label htmlFor="log-mode" className="cursor-pointer text-sm">
              Escala Logarítmica
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsScatter margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              
              <XAxis 
                type="number" 
                dataKey="consumo_visual" 
                name="Consumo" 
                scale={useLogScale ? "log" : "linear"}
                domain={xDomain as [number, number]}
                label={{ value: 'Consumo Médio (un)', position: 'insideBottom', offset: -10, className: "fill-muted-foreground text-xs" }}
                className="text-xs font-mono"
                tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val.toLocaleString()}
                allowDataOverflow={true} 
              />
              
              <YAxis 
                type="number" 
                dataKey="custo_visual" 
                name="Custo" 
                scale={useLogScale ? "log" : "linear"}
                domain={yDomain as [number, number]}
                label={{ value: 'Custo Unit. (R$)', angle: -90, position: 'insideLeft', className: "fill-muted-foreground text-xs" }}
                className="text-xs font-mono"
                tickFormatter={(val) => `R$ ${val}`}
                allowDataOverflow={true}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="top" height={36} />

              <ReferenceLine x={avgConsumo} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Média Consumo", position: 'insideTopRight', fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine y={avgCusto} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Média Custo", position: 'insideRight', fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />

              {uniqueClusters.map((clusterId) => (
                <Scatter
                  key={clusterId}
                  name={`Cluster ${clusterId}`}
                  data={chartData.filter(item => item.cluster_id === clusterId)}
                  fill={CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]}
                  shape="circle"
                  fillOpacity={0.7}
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </RechartsScatter>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <span>Quadrante Superior Direito: Alto Custo & Alto Consumo (Críticos)</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}