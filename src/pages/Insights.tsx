import { useEffect, useState } from 'react';
import { fetchInsightRisco, fetchInsightSazonalidade, InsightRiskData, InsightSeasonalityData } from '@/services/api';
import { RiskScatterChart } from '@/components/RiskScatterChart';
import { SeasonalityAnalysis } from '@/components/SeasonalityAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Package, CalendarClock, Activity, Minus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Insights() {
  const [riskData, setRiskData] = useState<InsightRiskData[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<InsightSeasonalityData[]>([]);
  const [riskMeta, setRiskMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [riskRes, seasonalRes] = await Promise.all([
            fetchInsightRisco(),
            fetchInsightSazonalidade()
        ]);
        
        // Garante que sempre seja um array, mesmo se vier null/undefined
        setRiskData(Array.isArray(riskRes.data) ? riskRes.data : []);
        setRiskMeta(riskRes.meta || {});
        setSeasonalityData(Array.isArray(seasonalRes) ? seasonalRes : []);
        
      } catch (e) {
        console.error("Erro crítico ao carregar insights:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processando dados de inteligência...</p>
        </div>
    </div>
  );

  // Ordenação segura
  const criticos = [...riskData]
    .filter(d => d.is_critical)
    .sort((a,b) => (b.custo_total_acumulado || 0) - (a.custo_total_acumulado || 0));

  // Valores seguros para os limites do gráfico (CORREÇÃO DA TELA BRANCA)
  const cvLimitSafe = riskMeta?.zona_risco?.cv_min ?? 0.8;
  const coverageLimitSafe = riskMeta?.zona_risco?.cobertura_max ?? 1.0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Central de Insights</h1>
        <p className="text-muted-foreground mt-1">
          Análise avançada de comportamento de estoque e detecção de riscos.
        </p>
      </div>

      <Tabs defaultValue="risk" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="risk" className="flex gap-2 items-center">
            <AlertTriangle className="h-4 w-4" /> 
            Risco de Ruptura
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="flex gap-2 items-center">
            <CalendarClock className="h-4 w-4" /> 
            Padrões de Consumo
          </TabsTrigger>
        </TabsList>

        {/* --- ABA 1: RISCO DE RUPTURA --- */}
        <TabsContent value="risk" className="space-y-6 mt-6">
            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4"/> Itens Críticos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{riskMeta?.total_criticos || 0}</div>
                        <p className="text-xs text-red-700 mt-1">Risco iminente de falta</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4"/> Alta Instabilidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {riskData.filter(d => d.cv_consumo > cvLimitSafe).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">CV &gt; {cvLimitSafe}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4"/> Baixo Estoque
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {riskData.filter(d => d.cobertura_meses < coverageLimitSafe).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cobertura &lt; {coverageLimitSafe} Mês</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Gráfico de Dispersão */}
            <RiskScatterChart 
                data={riskData} 
                cvLimit={cvLimitSafe} 
                coverageLimit={coverageLimitSafe} 
            />
            
            {/* Tabela de Top Críticos */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Itens em Risco (Por Impacto Financeiro)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead className="text-right">Cobertura</TableHead>
                                <TableHead className="text-right">Variabilidade (CV)</TableHead>
                                <TableHead className="text-right">Custo Acumulado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {criticos.length > 0 ? (
                                criticos.slice(0, 10).map((item) => (
                                    <TableRow key={item.id_produto}>
                                        <TableCell className="font-medium">{item.nome}</TableCell>
                                        <TableCell><Badge variant="outline">{item.grupo}</Badge></TableCell>
                                        <TableCell className="text-right text-red-600 font-bold">
                                            {item.cobertura_meses.toFixed(2)} meses
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {item.cv_consumo.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            R$ {item.custo_total_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        Nenhum item crítico encontrado com os critérios atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- ABA 2: SAZONALIDADE --- */}
        <TabsContent value="seasonality" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Picos Sazonais Detectados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">
                            {seasonalityData.filter(i => i.classificacao === 'Sazonal/Pico').length} Itens
                        </div>
                        <p className="text-xs text-orange-700 mt-1">Consumo explosivo pontual (Pico &gt; 3x Média)</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <Minus className="h-4 w-4" />
                            Demanda Linear / Estável
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">
                            {seasonalityData.filter(i => i.classificacao === 'Estável/Linear').length} Itens
                        </div>
                        <p className="text-xs text-green-700 mt-1">Previsibilidade alta (Variação &lt; 30%)</p>
                    </CardContent>
                </Card>
            </div>

            <SeasonalityAnalysis data={seasonalityData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}