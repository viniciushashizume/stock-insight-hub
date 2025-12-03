import { useEffect, useState, useMemo } from 'react';
import { 
  fetchInsightRisco, 
  fetchInsightSazonalidade, 
  fetchInsightEstrategia, 
  fetchInsightInflacao,
  InsightRiskData, 
  InsightSeasonalityData, 
  StrategyResponse,
  InflationResponse
} from '@/services/api';
import { RiskScatterChart } from '@/components/RiskScatterChart';
import { SeasonalityAnalysis } from '@/components/SeasonalityAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, DollarSign, Target } from 'lucide-react'; // Adicionei novos ícones
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LineChart, Line } from 'recharts';

export default function Insights() {
  const [riskData, setRiskData] = useState<InsightRiskData[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<InsightSeasonalityData[]>([]);
  const [strategyData, setStrategyData] = useState<StrategyResponse | null>(null);
  const [inflationData, setInflationData] = useState<InflationResponse | null>(null);
  const [riskMeta, setRiskMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogScale, setIsLogScale] = useState(false);

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

  const getMatrixValue = (row: string, col: string) => {
    return strategyData?.matrix?.[col]?.[row] || 0;
  };

  const formatYAxis = (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
      return value.toString();
  };

  const inflationChartData = useMemo(() => {
    if (!inflationData?.history) return { data: [], lines: [] };
    
    const groupedByDate: Record<string, any> = {};
    const items = new Set<string>();

    inflationData.history.forEach(h => {
        const date = h.data_str.substring(0, 7); 
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

  const azItems = useMemo(() => {
    if (!strategyData?.scatter_data) return [];
    return strategyData.scatter_data
        .filter((item: any) => item.Classe_ABC === 'A' && item.Classe_XYZ === 'Z')
        .sort((a: any, b: any) => b.custo_total - a.custo_total);
  }, [strategyData]);

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
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full lg:w-auto h-auto">
          <TabsTrigger value="risco">Risco de Ruptura</TabsTrigger>
          <TabsTrigger value="sazonalidade">Sazonalidade</TabsTrigger>
          <TabsTrigger value="estrategia">Matriz Estratégica</TabsTrigger>
          <TabsTrigger value="eficiencia">Eficiência Financeira</TabsTrigger> {/* NOVA ABA */}
          <TabsTrigger value="inflacao">Inflação</TabsTrigger> 
        </TabsList>

        {/* --- ABA 1: RISCO --- */}
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

        {/* --- ABA 2: SAZONALIDADE --- */}
        <TabsContent value="sazonalidade" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
                <SeasonalityAnalysis data={seasonalityData} />
            </div>
        </TabsContent>

        {/* --- ABA 3: MATRIZ ESTRATÉGICA (ABC/XYZ + AZ) --- */}
        <TabsContent value="estrategia" className="space-y-4">
           {strategyData && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {/* CARD 1: MATRIZ ABC-XYZ */}
                   <Card className="h-full">
                       <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-500" />
                                Matriz ABC-XYZ
                           </CardTitle>
                           <CardDescription>Distribuição de Itens por Valor (ABC) e Previsibilidade (XYZ)</CardDescription>
                       </CardHeader>
                       <CardContent>
                           <div className="grid grid-cols-4 gap-2 text-center text-sm">
                               <div className="font-bold text-xs text-muted-foreground self-end mb-2">Classe</div>
                               <div className="font-bold text-blue-600 bg-blue-50/50 p-1 rounded">X (Estável)</div>
                               <div className="font-bold text-blue-600 bg-blue-50/50 p-1 rounded">Y (Variável)</div>
                               <div className="font-bold text-blue-600 bg-blue-50/50 p-1 rounded">Z (Instável)</div>

                               <div className="font-bold text-green-700 bg-green-50/50 p-1 rounded flex items-center justify-center">A</div>
                               <div className="bg-blue-100 p-4 rounded border font-bold text-lg flex items-center justify-center">{getMatrixValue('A', 'X')}</div>
                               <div className="bg-blue-100 p-4 rounded border font-bold text-lg flex items-center justify-center">{getMatrixValue('A', 'Y')}</div>
                               <div className="bg-red-100 p-4 rounded border-2 border-red-200 font-bold text-lg text-red-700 flex items-center justify-center shadow-sm">{getMatrixValue('A', 'Z')}</div>

                               <div className="font-bold text-green-700 bg-green-50/50 p-1 rounded flex items-center justify-center">B</div>
                               <div className="bg-blue-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('B', 'X')}</div>
                               <div className="bg-blue-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('B', 'Y')}</div>
                               <div className="bg-orange-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('B', 'Z')}</div>

                               <div className="font-bold text-green-700 bg-green-50/50 p-1 rounded flex items-center justify-center">C</div>
                               <div className="bg-green-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('C', 'X')}</div>
                               <div className="bg-green-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('C', 'Y')}</div>
                               <div className="bg-gray-50 p-4 rounded border flex items-center justify-center">{getMatrixValue('C', 'Z')}</div>
                           </div>
                           <div className="mt-4 text-xs text-muted-foreground">
                               * <strong>AZ (Vermelho):</strong> Alto valor e demanda imprevisível. Exige gestão manual.
                           </div>
                       </CardContent>
                   </Card>

                   {/* CARD 2: ITENS AZ (CRÍTICOS) */}
                   <Card className="h-full border-red-200 dark:border-red-900">
                       <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                               <AlertTriangle className="h-5 w-5" />
                               Itens AZ (Atenção Máxima)
                           </CardTitle>
                           <CardDescription>
                               Itens de <strong>Classe A</strong> (Alto Impacto Financeiro) e <strong>Classe Z</strong> (Baixa Previsibilidade).
                               <br/>Recomendação: Não usar reposição automática.
                           </CardDescription>
                       </CardHeader>
                       <CardContent>
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Item</TableHead>
                                       <TableHead className="text-right">Custo Total</TableHead>
                                       <TableHead className="text-right">Cobertura</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {azItems.length > 0 ? (
                                       azItems.slice(0, 6).map((item: any) => (
                                           <TableRow key={item.id_item}>
                                               <TableCell className="font-medium text-xs truncate max-w-[150px]" title={item.ds_material}>
                                                   {item.ds_material}
                                               </TableCell>
                                               <TableCell className="text-right font-bold text-xs">
                                                   R$ {item.custo_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                               </TableCell>
                                               <TableCell className="text-right text-xs">
                                                   {item.dias_cobertura.toFixed(0)} dias
                                               </TableCell>
                                           </TableRow>
                                       ))
                                   ) : (
                                       <TableRow>
                                           <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                               Nenhum item AZ identificado na base atual.
                                           </TableCell>
                                       </TableRow>
                                   )}
                               </TableBody>
                           </Table>
                       </CardContent>
                   </Card>
             </div>
           )}
        </TabsContent>

        {/* --- ABA 4: EFICIÊNCIA FINANCEIRA (NOVA) --- */}
        <TabsContent value="eficiencia" className="space-y-4">
            {strategyData && (
                <div className="grid grid-cols-1 gap-4">
                     {/* LINHA 1: GRÁFICO DE EFICIÊNCIA */}
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Eficiência de Capital Imobilizado
                            </CardTitle>
                            <CardDescription>
                                Relação entre Dias de Cobertura (Tempo de Estoque) vs Valor Monetário Parado.
                                <br/><span className="text-xs text-muted-foreground">Objetivo: Manter itens na área inferior esquerda (Baixo valor parado, cobertura adequada).</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="dias_cobertura" name="Dias Cobertura" unit="d" domain={[0, 365]} label={{ value: 'Dias de Cobertura', position: 'bottom', offset: 0 }} />
                                    <YAxis type="number" dataKey="valor_imobilizado" name="Valor" unit="R$" tickFormatter={formatYAxis} label={{ value: 'Valor Imobilizado (R$)', angle: -90, position: 'insideLeft' }} />
                                    <RechartsTooltip 
                                        cursor={{ strokeDasharray: '3 3' }} 
                                        formatter={(value: any, name: string) => [
                                            name === 'Valor' ? `R$ ${value.toLocaleString()}` : `${parseFloat(value).toFixed(0)} dias`, 
                                            name === 'Valor' ? 'Valor Parado' : 'Cobertura'
                                        ]}
                                        labelFormatter={() => ''}
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <ReferenceLine x={30} stroke="green" strokeDasharray="3 3" label={{ value: "Meta (30d)", position: 'insideTopRight', fill: 'green' }} />
                                    <ReferenceLine x={90} stroke="red" strokeDasharray="3 3" label={{ value: "Excesso (>90d)", position: 'insideTopRight', fill: 'red' }} />
                                    <Scatter name="Itens de Estoque" data={strategyData.scatter_data} fill="#8884d8" shape="circle">
                                        {strategyData.scatter_data.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.dias_cobertura > 90 ? '#ef4444' : (entry.dias_cobertura < 15 ? '#eab308' : '#22c55e')} 
                                                opacity={0.7}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* LINHA 2: ZUMBIS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Top "Zumbis" de Estoque</CardTitle>
                            <CardDescription>
                                Itens com giro muito lento (&gt; 90 dias) e alto capital parado. Candidatos a liquidação ou doação.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Dias Cobertura</TableHead>
                                        <TableHead className="text-right">Valor Parado</TableHead>
                                        <TableHead className="text-center">Classe ABC</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {strategyData.zombies.map(z => (
                                        <TableRow key={z.id_item}>
                                            <TableCell className="font-medium">{z.ds_material}</TableCell>
                                            <TableCell className="text-right font-bold text-red-500">{z.dias_cobertura.toFixed(0)} dias</TableCell>
                                            <TableCell className="text-right">R$ {z.valor_imobilizado.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</TableCell>
                                            <TableCell className="text-center"><Badge variant="outline">{z.Classe_ABC}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>

        {/* --- ABA 5: INFLAÇÃO --- */}
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