import { useEffect, useState, useMemo } from 'react';
import { 
  fetchInsightRisco, 
  fetchInsightSazonalidade, 
  fetchInsightEstrategia, 
  InsightRiskData, 
  InsightSeasonalityData, 
  StrategyResponse,
  ItemStrategy 
} from '@/services/api';
import { RiskScatterChart } from '@/components/RiskScatterChart';
import { SeasonalityAnalysis } from '@/components/SeasonalityAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarClock, LayoutGrid, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label as RechartsLabel, Legend, Cell } from 'recharts';

export default function Insights() {
  const [riskData, setRiskData] = useState<InsightRiskData[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<InsightSeasonalityData[]>([]);
  const [strategyData, setStrategyData] = useState<StrategyResponse | null>(null);
  const [riskMeta, setRiskMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Controle da Escala Logarítmica
  const [isLogScale, setIsLogScale] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [riskRes, seasonalRes, strategyRes] = await Promise.all([
            fetchInsightRisco(),
            fetchInsightSazonalidade(),
            fetchInsightEstrategia()
        ]);
        
        setRiskData(Array.isArray(riskRes.data) ? riskRes.data : []);
        setRiskMeta(riskRes.meta || {});
        setSeasonalityData(Array.isArray(seasonalRes) ? seasonalRes : []);
        setStrategyData(strategyRes);
        
      } catch (e) {
        console.error("Erro crítico ao carregar insights:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scatterDataGrouped = useMemo(() => {
    if (!strategyData?.scatter_data) return { a: [], b: [], c: [] };
    
    // Tratamento para evitar erro de Log(0) ou Log(negativo)
    const safeData = strategyData.scatter_data.map(d => ({
        ...d,
        valor_imobilizado: d.valor_imobilizado <= 0 ? 0.01 : d.valor_imobilizado
    }));

    const groups: { a: ItemStrategy[], b: ItemStrategy[], c: ItemStrategy[] } = { a: [], b: [], c: [] };
    
    safeData.forEach(item => {
        if (item.Classe_ABC === 'A') groups.a.push(item);
        else if (item.Classe_ABC === 'B') groups.b.push(item);
        else groups.c.push(item);
    });
    return groups;
  }, [strategyData]);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processando inteligência de estoque...</p>
        </div>
    </div>
  );

  const MatrixCell = ({ count, label, subtext, colorClass }: any) => (
    <div className={`p-4 rounded-lg border ${colorClass} flex flex-col items-center justify-center text-center h-28`}>
        <span className="text-2xl font-bold">{count || 0}</span>
        <span className="text-xs font-bold uppercase mt-1">{label}</span>
        <span className="text-[10px] opacity-80 mt-1 leading-tight">{subtext}</span>
    </div>
  );

  const getMatrixCount = (row: string, col: string) => {
    return strategyData?.matrix?.[col]?.[row] || 0;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${value}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Central de Insights</h1>
        <p className="text-muted-foreground mt-1">
          Análise avançada de comportamento, riscos e eficiência de capital.
        </p>
      </div>

      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="risk" className="flex gap-2 items-center">
            <AlertTriangle className="h-4 w-4" /> 
            Risco de Ruptura
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="flex gap-2 items-center">
            <CalendarClock className="h-4 w-4" /> 
            Padrões de Consumo
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex gap-2 items-center">
             <LayoutGrid className="h-4 w-4" />
             Estratégia & Eficiência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-6 mt-6">
            <RiskScatterChart data={riskData} cvLimit={riskMeta?.zona_risco?.cv_min || 0.8} coverageLimit={riskMeta?.zona_risco?.cobertura_max || 1.0} />
        </TabsContent>

        <TabsContent value="seasonality" className="space-y-6 mt-6">
            <SeasonalityAnalysis data={seasonalityData} />
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6 mt-6">
            
            {/* PARTE A: MATRIZ ABC-XYZ */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Matriz ABC-XYZ</CardTitle>
                        <CardDescription>Onde focar o esforço de gestão?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-start-2 text-center text-xs font-bold text-muted-foreground">X (Estável)</div>
                            <div className="col-start-3 text-center text-xs font-bold text-muted-foreground">Z (Instável)</div>

                            <div className="flex items-center justify-center text-xs font-bold text-muted-foreground -rotate-90">A (Alto $)</div>
                            <MatrixCell 
                                count={getMatrixCount('A', 'X')} 
                                label="AX" 
                                subtext="Contratos Just-in-Time" 
                                colorClass="bg-blue-100 text-blue-900 border-blue-200"
                            />
                            <MatrixCell 
                                count={getMatrixCount('A', 'Z') + getMatrixCount('A', 'Y')} 
                                label="AZ/AY" 
                                subtext="Foco TOTAL do Gestor" 
                                colorClass="bg-red-100 text-red-900 border-red-200 ring-2 ring-red-400 ring-offset-2"
                            />

                            <div className="flex items-center justify-center text-xs font-bold text-muted-foreground -rotate-90">C (Baixo $)</div>
                            <MatrixCell 
                                count={getMatrixCount('C', 'X')} 
                                label="CX" 
                                subtext="Reposição Automática" 
                                colorClass="bg-green-100 text-green-900 border-green-200"
                            />
                            <MatrixCell 
                                count={getMatrixCount('C', 'Z') + getMatrixCount('C', 'Y')} 
                                label="CZ/CY" 
                                subtext="Estoque de Segurança" 
                                colorClass="bg-gray-100 text-gray-700 border-gray-200"
                            />
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground space-y-1">
                            <p><strong>AX:</strong> Item caro e previsível. Negocie entregas programadas.</p>
                            <p><strong>AZ:</strong> Item caro e imprevisível. Risco alto de sobrar ($ parado) ou faltar.</p>
                            <p><strong>CX:</strong> Item barato e previsível. Automatize e esqueça.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* PARTE B: SCATTERPLOT DE EFICIÊNCIA */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600"/>
                                    Eficiência de Estoque
                                </CardTitle>
                                <CardDescription>
                                    Relação entre Dias de Cobertura (X) e Valor Imobilizado (Y).
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="log-scale" 
                                    checked={isLogScale}
                                    onCheckedChange={setIsLogScale}
                                />
                                <Label htmlFor="log-scale" className="text-sm font-medium">
                                    Escala Log
                                </Label>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* AJUSTE 1: Aumentei margin left para 80 para afastar o rótulo dos números */}
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 80 }}>
                                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                                <XAxis 
                                    type="number" 
                                    dataKey="dias_cobertura" 
                                    name="Dias de Cobertura" 
                                    unit="d" 
                                    domain={[0, 180]}
                                    tickLine={false}
                                    axisLine={false}
                                    // AJUSTE 2: Padding para afastar dados das bordas laterais
                                    padding={{ left: 20, right: 20 }}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    label={{ value: 'Dias de Cobertura (Estoque)', position: 'insideBottom', offset: -20, fill: '#6b7280', fontSize: 12 }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="valor_imobilizado" 
                                    name="Valor Imobilizado" 
                                    unit="R$" 
                                    scale={isLogScale ? "log" : "auto"}
                                    domain={isLogScale ? ['auto', 'auto'] : [0, 'auto']}
                                    allowDataOverflow={true} 
                                    tickLine={false}
                                    axisLine={false}
                                    // AJUSTE 2: Padding para afastar dados das bordas superior/inferior
                                    padding={{ top: 20, bottom: 20 }}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickFormatter={formatYAxis}
                                    // AJUSTE 3: Label posicionado com 'insideLeft' mas com a margem esquerda aumentada
                                    label={{ 
                                        value: 'Valor Imobilizado', 
                                        angle: -90, 
                                        position: 'insideLeft', 
                                        fill: '#6b7280', 
                                        fontSize: 12,
                                        style: { textAnchor: 'middle' }
                                    }}
                                />
                                <RechartsTooltip 
                                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            let headerColor = "text-gray-700";
                                            if (data.Classe_ABC === 'A') headerColor = "text-red-600";
                                            if (data.Classe_ABC === 'B') headerColor = "text-amber-600";
                                            if (data.Classe_ABC === 'C') headerColor = "text-emerald-600";

                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-md text-sm">
                                                    <p className={`font-bold ${headerColor} mb-1`}>{data.ds_material}</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <span>Classe:</span>
                                                        <span className="font-medium text-foreground">{data.Classe_ABC}{data.Classe_XYZ}</span>
                                                        <span>Imobilizado:</span>
                                                        <span className="font-medium text-foreground">R$ {data.valor_imobilizado.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                                                        <span>Cobertura:</span>
                                                        <span className="font-medium text-foreground">{data.dias_cobertura.toFixed(0)} dias</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine x={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={2}>
                                    <RechartsLabel value="Meta (30d)" position="insideTopRight" fill="#10b981" fontSize={12} fontWeight="bold"/>
                                </ReferenceLine>
                                <ReferenceLine x={90} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2}>
                                    <RechartsLabel value="Alerta (>90d)" position="insideTopRight" fill="#ef4444" fontSize={12} fontWeight="bold" />
                                </ReferenceLine>
                                
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}/>

                                <Scatter name="Classe A (Alto Valor)" data={scatterDataGrouped.a} fill="#ef4444" fillOpacity={0.7}>
                                    {scatterDataGrouped.a.map((entry, index) => <Cell key={`cell-${index}`} stroke="#b91c1c" strokeWidth={1} /> )}
                                </Scatter>
                                <Scatter name="Classe B (Médio Valor)" data={scatterDataGrouped.b} fill="#f59e0b" fillOpacity={0.7}>
                                    {scatterDataGrouped.b.map((entry, index) => <Cell key={`cell-${index}`} stroke="#b45309" strokeWidth={1} /> )}
                                </Scatter>
                                <Scatter name="Classe C (Baixo Valor)" data={scatterDataGrouped.c} fill="#10b981" fillOpacity={0.6}>
                                    {scatterDataGrouped.c.map((entry, index) => <Cell key={`cell-${index}`} stroke="#047857" strokeWidth={1} /> )}
                                </Scatter>

                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* PARTE C: LISTA DE ZUMBIS */}
            <Card className="border-red-200">
                <CardHeader className="bg-red-50 rounded-t-lg">
                    <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5"/>
                        Top "Zumbis" (Estoque em Excesso {'>'} 90 dias)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Classe</TableHead>
                                <TableHead className="text-right">Dias de Cobertura</TableHead>
                                <TableHead className="text-right">Valor Parado (Imobilizado)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {strategyData?.zombies?.map((item) => (
                                <TableRow key={item.id_item}>
                                    <TableCell className="font-medium">{item.ds_material}</TableCell>
                                    <TableCell><Badge variant="outline" className={item.Classe_ABC === 'A' ? 'border-red-500 text-red-600' : ''}>{item.Classe_ABC}{item.Classe_XYZ}</Badge></TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        {item.dias_cobertura.toFixed(0)} dias
                                    </TableCell>
                                    <TableCell className="text-right text-red-800 font-medium">
                                        R$ {item.valor_imobilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!strategyData?.zombies || strategyData.zombies.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        Nenhum excesso crítico encontrado. Parabéns!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}