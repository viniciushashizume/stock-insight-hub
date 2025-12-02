import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightRiskData } from '@/services/api';

interface RiskScatterChartProps {
  data: InsightRiskData[];
  cvLimit: number;
  coverageLimit: number;
  isLogScale?: boolean; // <--- CORREÇÃO: Adicionado
}

export function RiskScatterChart({ data, cvLimit, coverageLimit, isLogScale = false }: RiskScatterChartProps) {
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border rounded-md p-3 shadow-lg text-sm">
          <p className="font-bold mb-1">{item.nome}</p>
          <Badge variant={item.is_critical ? "destructive" : "secondary"} className="mb-2">
            {item.grupo}
          </Badge>
          <div className="grid grid-cols-2 gap-x-4 text-muted-foreground text-xs">
            <span>Variabilidade (CV):</span>
            <span className="text-foreground font-mono">{item.cv_consumo.toFixed(2)}</span>
            <span>Cobertura:</span>
            <span className="text-foreground font-mono">{item.cobertura_meses.toFixed(1)} meses</span>
            <span>Custo Acum.:</span>
            <span className="text-foreground font-mono">R$ {item.custo_total_acumulado.toLocaleString()}</span>
          </div>
          {item.is_critical && (
            <p className="text-red-500 font-bold mt-2 text-xs">⚠️ RISCO DE RUPTURA</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Zona de Risco: Itens Instáveis</CardTitle>
                <CardDescription>
                CV {'>'} {cvLimit} (Instável) & Cobertura {'<'} {coverageLimit} Mês
                </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Crítico</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded-full"></div> Normal</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              
              <XAxis 
                type="number" 
                dataKey="cv_consumo" 
                name="CV" 
                label={{ value: 'Variabilidade da Demanda (CV)', position: 'bottom', offset: 0 }}
                domain={[0, 'auto']}
              />
              <YAxis 
                type="number" 
                dataKey="cobertura_meses" 
                name="Cobertura" 
                label={{ value: 'Meses de Estoque', angle: -90, position: 'insideLeft' }}
                // CORREÇÃO: Lógica para suportar Log Scale ou Zoom Fixo
                scale={isLogScale ? "log" : "auto"}
                domain={isLogScale ? [0.01, 'auto'] : [0, 3]}
                allowDataOverflow={!isLogScale} // Só corta no zoom se não for log
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              <ReferenceArea 
                x1={cvLimit} 
                y1={0} 
                y2={coverageLimit} 
                fill="red" 
                fillOpacity={0.1} 
                stroke="red"
                strokeOpacity={0.2}
                label={{ value: "ZONA DE RUPTURA", position: 'insideTopRight', fill: 'red', fontSize: 12 }}
              />
              
              <ReferenceLine y={coverageLimit} stroke="red" strokeDasharray="3 3" label={{value: "1 Mês", position: "insideBottomRight", fill: "red", fontSize: 10}} />

              <Scatter name="Itens" data={data}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.is_critical ? '#ef4444' : '#60a5fa'} 
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}