import { useState, useMemo } from 'react';
import { InsightSeasonalityData } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart 
} from 'recharts';
import { ArrowUpRight, Minus, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  data: InsightSeasonalityData[];
}

// Interfaces auxiliares para tipagem segura
interface SazonalChartData {
    name: string;
    mes: number;
    currentYear: number;
    prevYear: number;
    [key: number]: number; // Permite acesso dinâmico aos anos (ex: 2024: 100)
}

interface LinearChartData {
    periodo: string;
    qt_consumo: number;
    limite_inf: number;
    limite_sup: number;
    range: [number, number];
}

export function SeasonalityAnalysis({ data }: Props) {
  // Garante que data é um array para evitar crash se vier undefined
  const safeData = Array.isArray(data) ? data : [];
  
  const [selectedItem, setSelectedItem] = useState<InsightSeasonalityData | null>(safeData[0] || null);
  const [filter, setFilter] = useState<'ALL' | 'Sazonal/Pico' | 'Estável/Linear'>('ALL');

  const filteredList = useMemo(() => {
    if (filter === 'ALL') return safeData;
    return safeData.filter(item => item.classificacao === filter);
  }, [safeData, filter]);

  // Atualiza seleção quando a lista muda
  useMemo(() => {
    if (filteredList.length > 0 && (!selectedItem || !filteredList.find(i => i.id_produto === selectedItem.id_produto))) {
        setSelectedItem(filteredList[0]);
    }
  }, [filteredList, filter]);

  // --- LÓGICA SEGURA DE TRANSFORMAÇÃO DE DADOS ---
  const chartData = useMemo<SazonalChartData[] | LinearChartData[]>(() => {
    if (!selectedItem || !selectedItem.historico || !Array.isArray(selectedItem.historico)) return [];

    if (selectedItem.classificacao === 'Sazonal/Pico') {
        const meses = [1,2,3,4,5,6,7,8,9,10,11,12];
        const mesesNomes = ['J','F','M','A','M','J','J','A','S','O','N','D'];
        
        // Extrai anos únicos e ordena decrescente
        const anos = Array.from(new Set(selectedItem.historico.map(h => h.ano))).filter(a => a).sort((a,b) => b-a);
        
        // Fallback seguro: se não tiver ano, usa 0 para não quebrar o gráfico
        const anoAtual = anos[0] || 0;
        const anoAnterior = anos[1] || (anoAtual > 0 ? anoAtual - 1 : 0);

        return meses.map((mes, idx) => {
            const dadoAtual = selectedItem.historico.find(h => h.ano === anoAtual && h.mes === mes);
            const dadoAnterior = selectedItem.historico.find(h => h.ano === anoAnterior && h.mes === mes);
            
            return {
                name: mesesNomes[idx],
                mes: mes,
                [anoAnterior]: dadoAnterior ? dadoAnterior.qt_consumo : 0,
                [anoAtual]: dadoAtual ? dadoAtual.qt_consumo : 0,
                currentYear: anoAtual,
                prevYear: anoAnterior
            } as SazonalChartData;
        });
    } else {
        // Modo Linear
        return selectedItem.historico.map(h => ({
            periodo: h.periodo_str || `${h.mes}/${h.ano}`, // Fallback para periodo_str
            qt_consumo: h.qt_consumo || 0,
            limite_inf: (selectedItem.media || 0) * 0.8,
            limite_sup: (selectedItem.media || 0) * 1.2,
            range: [(selectedItem.media || 0) * 0.8, (selectedItem.media || 0) * 1.2] 
        })) as LinearChartData[];
    }
  }, [selectedItem]);

  // Função auxiliar para pegar o nome do ano de forma segura
  const getYearLabel = (idx: number, key: 'currentYear' | 'prevYear') => {
      const item = (chartData as SazonalChartData[])[0];
      if (!item) return "";
      return item[key]?.toString();
  };

  // Função auxiliar para pegar o dataKey de forma segura
  const getDataKey = (key: 'currentYear' | 'prevYear') => {
      const item = (chartData as SazonalChartData[])[0];
      if (!item) return ""; // Retorna string vazia se falhar, o que evita o crash do Recharts
      return item[key]; 
  };

  // Verifica se temos dados válidos para plotar
  const hasValidData = selectedItem && chartData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      
      {/* Coluna Esquerda: Lista de Itens */}
      <Card className="col-span-1 flex flex-col h-full border-muted">
        <CardHeader className="pb-3 bg-muted/20">
          <CardTitle className="text-lg">Campeões Encontrados</CardTitle>
          <div className="flex gap-2 pt-2">
            <Button 
                variant={filter === 'ALL' ? "secondary" : "ghost"} 
                size="sm" onClick={() => setFilter('ALL')} className="text-xs h-7">Todos</Button>
            <Button 
                variant={filter === 'Sazonal/Pico' ? "secondary" : "ghost"} 
                size="sm" onClick={() => setFilter('Sazonal/Pico')} className="text-xs h-7 text-orange-700">Sazonais</Button>
            <Button 
                variant={filter === 'Estável/Linear' ? "secondary" : "ghost"} 
                size="sm" onClick={() => setFilter('Estável/Linear')} className="text-xs h-7 text-green-700">Lineares</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col p-2 gap-1">
              {filteredList.map((item) => (
                <button
                  key={item.id_produto}
                  onClick={() => setSelectedItem(item)}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition-all border ${
                    selectedItem?.id_produto === item.id_produto
                      ? "bg-white shadow-sm border-primary/40 ring-1 ring-primary/10"
                      : "hover:bg-muted/50 border-transparent"
                  }`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-semibold text-sm truncate w-40 text-foreground">{item.nome}</span>
                    {item.classificacao === 'Sazonal/Pico' && <ArrowUpRight className="h-4 w-4 text-orange-500" />}
                    {item.classificacao === 'Estável/Linear' && <Minus className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal text-muted-foreground">{item.grupo}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                        {item.classificacao === 'Sazonal/Pico' 
                            ? `PICO ${item.razao_pico?.toFixed(1) || '0.0'}x` 
                            : `CV ${((item.cv || 0) * 100).toFixed(0)}%`}
                    </span>
                  </div>
                </button>
              ))}
              {filteredList.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado nesta categoria.
                  </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna Direita: Gráfico Detalhado */}
      <Card className="col-span-1 lg:col-span-2 flex flex-col h-full overflow-hidden">
        {hasValidData ? (
          <>
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        {selectedItem.nome}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                        {selectedItem.grupo} 
                        <span className="text-muted-foreground/30">|</span> 
                        Consumo Médio: <span className="font-mono font-medium text-foreground">{selectedItem.media?.toFixed(0) || 0}</span>
                    </CardDescription>
                </div>
                <Badge 
                    className={`px-3 py-1 text-sm ${
                        selectedItem.classificacao === 'Sazonal/Pico' ? "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100" :
                        selectedItem.classificacao === 'Estável/Linear' ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" :
                        "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                >
                    {selectedItem.classificacao}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 min-h-0 pt-6 flex flex-col">
                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {selectedItem.classificacao === 'Sazonal/Pico' ? (
                            /* GRÁFICO 1: SAZONALIDADE (Ano Atual vs Anterior) */
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                />
                                <Line 
                                    name={getYearLabel(0, 'prevYear')}
                                    type="monotone" 
                                    dataKey={getDataKey('prevYear')}
                                    stroke="#94a3b8" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: "#94a3b8" }}
                                />
                                <Line 
                                    name={getYearLabel(0, 'currentYear')}
                                    type="monotone" 
                                    dataKey={getDataKey('currentYear')}
                                    stroke="#f97316" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                                    dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                                />
                                {/* Marcador de Pico - Lógica Segura com reduce */}
                                <ReferenceLine 
                                    x={(chartData as SazonalChartData[]).reduce((prev, current) => {
                                        const cYear = current.currentYear;
                                        const valPrev = (prev[cYear] as number) || 0;
                                        const valCurr = (current[cYear] as number) || 0;
                                        return valPrev > valCurr ? prev : current;
                                    }, (chartData as SazonalChartData[])[0] || { name: '' }).name} 
                                    stroke="gold" 
                                    strokeWidth={4} 
                                    strokeOpacity={0.5}
                                    label={{ value: 'PICO', fill: '#b45309', fontSize: 10, fontWeight: 'bold' }}
                                />
                            </LineChart>
                        ) : (
                            /* GRÁFICO 2: LINEARIDADE (Faixa Segura) */
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="periodo" tick={{fontSize: 10}} tickMargin={10} minTickGap={30} />
                                <YAxis domain={['dataMin * 0.8', 'dataMax * 1.1']} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                
                                <Area 
                                    type="monotone" 
                                    dataKey="range" 
                                    stroke="none" 
                                    fill="#22c55e" 
                                    fillOpacity={0.15} 
                                    name="Faixa Segura"
                                />
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="qt_consumo" 
                                    stroke="#15803d" 
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#15803d", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    name="Consumo Real"
                                />
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted flex items-start gap-3">
                    {selectedItem.classificacao === 'Sazonal/Pico' ? (
                        <>
                            <div className="bg-orange-100 p-2 rounded-full"><TrendingUp className="h-5 w-5 text-orange-600"/></div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground">Análise de Sazonalidade</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Identificamos um pico de consumo <strong>{selectedItem.razao_pico?.toFixed(1)}x</strong> maior que a média. 
                                    O gráfico compara o ano atual (laranja) com o anterior (cinza) para identificar recorrência.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="bg-green-100 p-2 rounded-full"><Minus className="h-5 w-5 text-green-600"/></div>
                             <div>
                                <h4 className="font-semibold text-sm text-foreground">Estabilidade de Demanda</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Item com comportamento linear. A área verde indica a "Faixa Segura" (Média ±20%). 
                                    Ideal para automatização de ressuprimento.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="h-8 w-8 opacity-20" />
             </div>
             <p>Selecione um item na lista para visualizar a análise.</p>
             {(!selectedItem || !selectedItem.historico) && (
                 <p className="text-xs text-muted-foreground/50">(Dados de histórico indisponíveis para o item selecionado)</p>
             )}
          </div>
        )}
      </Card>
    </div>
  );
}