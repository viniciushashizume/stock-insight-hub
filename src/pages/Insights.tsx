import { useEffect, useState, useMemo } from 'react';
import { 
  fetchInsightRisco, 
  fetchInsightSazonalidade, 
  fetchInsightEstrategia, 
  fetchInsightInflacao, // Certifique-se que está importado
  InsightRiskData, 
  InsightSeasonalityData, 
  StrategyResponse,
  ItemStrategy,
  InflationResponse
} from '@/services/api';
import { RiskScatterChart } from '@/components/RiskScatterChart';
import { SeasonalityAnalysis } from '@/components/SeasonalityAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarClock, LayoutGrid, DollarSign, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label as RechartsLabel, Legend, Cell, LineChart, Line } from 'recharts';

export default function Insights() {
  const [riskData, setRiskData] = useState<InsightRiskData[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<InsightSeasonalityData[]>([]);
  const [strategyData, setStrategyData] = useState<StrategyResponse | null>(null);
  const [inflationData, setInflationData] = useState<InflationResponse | null>(null);
  const [riskMeta, setRiskMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Controle da Escala Logarítmica
  const [isLogScale, setIsLogScale] = useState(false); // Default false para risco

  useEffect(() => {
    async function load() {
      try {
        const [riskRes, seasonalRes, strategyRes, inflationRes] = await Promise.all([
            fetchInsightRisco(),
            fetchInsightSazonalidade(),
            fetchInsightEstrategia(),
            fetchInsightInflacao()
        ]);
        
        setRiskData(Array.isArray(riskRes.data) ? riskRes.data : []);
        setRiskMeta(riskRes.meta || {});
        setSeasonalityData(Array.isArray(seasonalRes) ? seasonalRes : []);
        setStrategyData(strategyRes);
        setInflationData(inflationRes);
        
      } catch (e) {
        console.error("Erro crítico ao carregar insights:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ... (getMatrixValue e formatYAxis) ...
  const getMatrixValue = (row: string, col: string) => {
    return strategyData?.matrix?.[col]?.[row] || 0;
  };

  const formatYAxis = (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
      return value.toString();
  };

  // CORREÇÃO AQUI: Retorno do useMemo agora sempre tem o formato correto { data: [], lines: [] }
  const inflationChartData = useMemo(() => {
    if (!inflationData?.history) return { data: [], lines: [] };
    
    const groupedByDate: Record<string, any> = {};
    const items = new Set<string>();

    inflationData.history.forEach(h => {
        const date = h.data_str.substring(0, 7); // YYYY-MM
        if (!groupedByDate[date]) {
            groupedByDate[date] = { name: date };
        }
        groupedByDate[date][h.ds_material_hospital] = h.custo_unitario;
        items.add(h.ds_material_hospital);
    });

    return {
        data: Object.values(groupedByDate).sort((a, b) => a.name.localeCompare(b.name)),
        lines: Array.from(items)
    };
  }, [inflationData]);

  const colors = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

  if (loading) {
    return <div className="p-8 flex justify-center">Carregando análises avançadas...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights de IA</h1>
          <p className="text-muted-foreground mt-1">
            Análises preditivas e detecção de anomalias
          </p>
        </div>
      </div>

      <Tabs defaultValue="risco" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risco">Risco de Ruptura</TabsTrigger>
          <TabsTrigger value="sazonalidade">Sazonalidade</TabsTrigger>
          <TabsTrigger value="estrategia">Estratégia ABC/XYZ</TabsTrigger>
          <TabsTrigger value="inflacao">Inflação de Custos</TabsTrigger> 
        </TabsList>

        <TabsContent value="risco" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{riskMeta?.total_criticos || 0}</div>
                <p className="text-xs text-muted-foreground">
                    Alto risco de falta com demanda instável
                </p>
                </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                    <CardTitle>Matriz de Risco</CardTitle>
                    <CardDescription>
                        Relação entre Instabilidade (CV) e Cobertura de Estoque
                    </CardDescription>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="log-scale" checked={isLogScale} onCheckedChange={setIsLogScale} />
                    <Label htmlFor="log-scale">Escala Log (Geral)</Label>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="pl-0">
                {/* CORREÇÃO: Passando a prop que agora existe no componente */}
                <RiskScatterChart 
                    data={riskData} 
                    cvLimit={riskMeta?.zona_risco?.cv_min || 0.8} 
                    coverageLimit={riskMeta?.zona_risco?.cobertura_max || 1.0}
                    isLogScale={isLogScale} 
                />
             </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Detalhamento de Itens Críticos</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Grupo</TableHead>
                            <TableHead className="text-right">Consumo Médio</TableHead>
                            <TableHead className="text-right">CV (Instab.)</TableHead>
                            <TableHead className="text-right">Cobertura (Meses)</TableHead>
                            <TableHead className="text-right">Custo Total</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {riskData.filter(i => i.is_critical).slice(0, 10).map((item) => (
                            <TableRow key={item.id_produto}>
                                <TableCell className="font-medium text-xs">{item.nome}</TableCell>
                                <TableCell className="text-xs">{item.grupo}</TableCell>
                                {/* CORREÇÃO: Consumo Médio agora existe na interface */}
                                <TableCell className="text-right">{item.consumo_medio.toFixed(1)}</TableCell>
                                <TableCell className="text-right text-red-600 font-bold">{item.cv_consumo.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-red-600 font-bold">{item.cobertura_meses.toFixed(2)}</TableCell>
                                <TableCell className="text-right">R$ {item.custo_total_acumulado.toLocaleString()}</TableCell>
                                <TableCell><Badge variant="destructive">Crítico</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sazonalidade" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
                <SeasonalityAnalysis data={seasonalityData} />
            </div>
        </TabsContent>

        <TabsContent value="estrategia" className="space-y-4">
           {strategyData && (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Card>
                       <CardHeader><CardTitle>Matriz ABC-XYZ</CardTitle><CardDescription>Distribuição de Itens</CardDescription></CardHeader>
                       <CardContent>
                           <div className="grid grid-cols-4 gap-2 text-center text-sm">
                               <div className="font-bold"></div>
                               <div className="font-bold text-blue-600">X (Estável)</div>
                               <div className="font-bold text-blue-600">Y (Variável)</div>
                               <div className="font-bold text-blue-600">Z (Instável)</div>

                               <div className="font-bold text-green-700 flex items-center justify-center">A (Alto Valor)</div>
                               <div className="bg-blue-100 p-4 rounded border font-bold text-lg">{getMatrixValue('A', 'X')}</div>
                               <div className="bg-blue-100 p-4 rounded border font-bold text-lg">{getMatrixValue('A', 'Y')}</div>
                               <div className="bg-red-100 p-4 rounded border font-bold text-lg text-red-700">{getMatrixValue('A', 'Z')}</div>

                               <div className="font-bold text-green-700 flex items-center justify-center">B (Médio)</div>
                               <div className="bg-blue-50 p-4 rounded border">{getMatrixValue('B', 'X')}</div>
                               <div className="bg-blue-50 p-4 rounded border">{getMatrixValue('B', 'Y')}</div>
                               <div className="bg-orange-50 p-4 rounded border">{getMatrixValue('B', 'Z')}</div>

                               <div className="font-bold text-green-700 flex items-center justify-center">C (Baixo)</div>
                               <div className="bg-green-50 p-4 rounded border">{getMatrixValue('C', 'X')}</div>
                               <div className="bg-green-50 p-4 rounded border">{getMatrixValue('C', 'Y')}</div>
                               <div className="bg-gray-50 p-4 rounded border">{getMatrixValue('C', 'Z')}</div>
                           </div>
                       </CardContent>
                   </Card>
                   
                   <Card>
                        <CardHeader>
                            <CardTitle>Top "Zumbis" de Estoque</CardTitle>
                            {/* CORREÇÃO: Usando entidade HTML &gt; em vez de > solto */}
                            <CardDescription>Itens parados com alto valor imobilizado (&gt; 90 dias)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Dias</TableHead><TableHead className="text-right">Valor Parado</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {strategyData.zombies.map(z => (
                                        <TableRow key={z.id_item}>
                                            <TableCell className="text-xs">{z.ds_material}</TableCell>
                                            <TableCell className="text-right font-bold text-red-500">{z.dias_cobertura.toFixed(0)}</TableCell>
                                            <TableCell className="text-right">R$ {z.valor_imobilizado.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                   </Card>
               </div>
               
               <Card>
                  <CardHeader><CardTitle>Eficiência de Capital</CardTitle><CardDescription>Dias de Cobertura vs Valor Imobilizado</CardDescription></CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="dias_cobertura" name="Dias Cobertura" unit="d" domain={[0, 365]} />
                            <YAxis type="number" dataKey="valor_imobilizado" name="Valor" unit="R$" tickFormatter={formatYAxis} />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <ReferenceLine x={30} stroke="green" label="Meta 30d" />
                            <ReferenceLine x={90} stroke="red" label="Risco" />
                            <Scatter name="Itens" data={strategyData.scatter_data} fill="#8884d8">
                                {strategyData.scatter_data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.dias_cobertura > 90 ? '#ef4444' : (entry.dias_cobertura < 15 ? '#eab308' : '#22c55e')} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
               </Card>
             </>
           )}
        </TabsContent>

        <TabsContent value="inflacao" className="space-y-4">
            {inflationData && (
                <div className="grid grid-cols-1 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-red-500" />
                                Evolução de Preços (Top 5 Inflação)
                            </CardTitle>
                            <CardDescription>
                                Variação do Custo Unitário Médio mês a mês
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={inflationChartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis 
                                        label={{ value: 'Preço Médio (R$)', angle: -90, position: 'insideLeft' }} 
                                        tickFormatter={(val) => `R$ ${val}`}
                                    />
                                    <RechartsTooltip 
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                                        labelFormatter={(label) => `Mês: ${label}`}
                                    />
                                    <Legend />
                                    {inflationChartData.lines.map((itemKey, index) => (
                                        <Line 
                                            key={itemKey}
                                            type="monotone" 
                                            dataKey={itemKey} 
                                            stroke={colors[index % colors.length]} 
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ranking de Inflação Interna</CardTitle>
                            <CardDescription>Itens que mais aumentaram de preço no período analisado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Inflação Acumulada</TableHead>
                                        <TableHead className="text-right">Ação Sugerida</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inflationData.top_items.map((item) => (
                                        <TableRow key={item.id_item}>
                                            <TableCell className="font-medium">{item.ds_material_hospital}</TableCell>
                                            <TableCell className="text-right text-red-600 font-bold">
                                                +{item.inflacao_acumulada.toFixed(2)}%
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {item.inflacao_acumulada > 100 ? "Renegociação Urgente" : "Monitorar Fornecedor"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}