import { useState, useMemo } from 'react';
import { InsightSeasonalityData } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowUpRight, Activity, Minus } from 'lucide-react';

interface Props {
  data: InsightSeasonalityData[];
}

export function SeasonalityAnalysis({ data }: Props) {
  const [selectedItem, setSelectedItem] = useState<InsightSeasonalityData | null>(data[0] || null);
  const [filter, setFilter] = useState<'ALL' | 'Sazonal/Pico' | 'Estável/Linear'>('ALL');

  // Filtra a lista lateral
  const filteredList = useMemo(() => {
    if (filter === 'ALL') return data;
    return data.filter(item => item.classificacao === filter);
  }, [data, filter]);

  // Atualiza o item selecionado se a lista mudar e o selecionado não estiver nela
  useMemo(() => {
    if (filteredList.length > 0 && (!selectedItem || !filteredList.find(i => i.id_produto === selectedItem.id_produto))) {
        setSelectedItem(filteredList[0]);
    }
  }, [filteredList]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      
      {/* Coluna Esquerda: Lista de Itens */}
      <Card className="col-span-1 flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Seletor de Itens</CardTitle>
          <div className="flex gap-2 pt-2">
            <Button 
                variant={filter === 'ALL' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter('ALL')}
                className="text-xs h-7"
            >
                Todos
            </Button>
            <Button 
                variant={filter === 'Sazonal/Pico' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter('Sazonal/Pico')}
                className="text-xs h-7"
            >
                Sazonais
            </Button>
            <Button 
                variant={filter === 'Estável/Linear' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter('Estável/Linear')}
                className="text-xs h-7"
            >
                Lineares
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
              {filteredList.map((item) => (
                <button
                  key={item.id_produto}
                  onClick={() => setSelectedItem(item)}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition-colors border ${
                    selectedItem?.id_produto === item.id_produto
                      ? "bg-accent border-primary/50"
                      : "hover:bg-muted border-transparent"
                  }`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-medium text-sm truncate w-40">{item.nome}</span>
                    {item.classificacao === 'Sazonal/Pico' && <ArrowUpRight className="h-4 w-4 text-orange-500" />}
                    {item.classificacao === 'Estável/Linear' && <Minus className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5">{item.grupo}</Badge>
                    <span className="text-xs text-muted-foreground">
                        {item.classificacao === 'Sazonal/Pico' 
                            ? `Pico ${item.razao_pico.toFixed(1)}x` 
                            : `CV ${item.cv.toFixed(2)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna Direita: Gráfico Detalhado */}
      <Card className="col-span-1 lg:col-span-2 flex flex-col h-full">
        {selectedItem ? (
          <>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {selectedItem.nome}
                    </CardTitle>
                    <CardDescription>{selectedItem.grupo}</CardDescription>
                </div>
                <Badge 
                    className={
                        selectedItem.classificacao === 'Sazonal/Pico' ? "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200" :
                        selectedItem.classificacao === 'Estável/Linear' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" :
                        "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }
                >
                    {selectedItem.classificacao}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
                <div className="flex gap-6 mb-6">
                    <div>
                        <p className="text-xs text-muted-foreground">Média Mensal</p>
                        <p className="text-xl font-bold">{selectedItem.media_consumo.toFixed(0)} un</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Razão de Pico</p>
                        <p className="text-xl font-bold">{selectedItem.razao_pico.toFixed(1)}x</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Estabilidade (CV)</p>
                        <p className="text-xl font-bold">{selectedItem.cv.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedItem.historico} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="periodo_str" 
                                tick={{fontSize: 12}} 
                                tickMargin={10}
                            />
                            <YAxis tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                formatter={(value: number) => [value.toLocaleString(), "Consumo"]}
                            />
                            
                            {/* Linha da Média */}
                            <ReferenceLine y={selectedItem.media_consumo} stroke="#888" strokeDasharray="3 3" label={{ value: 'Média', fontSize: 10, fill: '#888' }} />
                            
                            {/* Faixa Segura para Lineares */}
                            {selectedItem.classificacao === 'Estável/Linear' && (
                                <ReferenceLine y={selectedItem.media_consumo * 1.2} stroke="green" strokeOpacity={0.2} label={{ value: '+20%', fontSize: 10, fill: 'green' }} />
                            )}
                            {selectedItem.classificacao === 'Estável/Linear' && (
                                <ReferenceLine y={selectedItem.media_consumo * 0.8} stroke="green" strokeOpacity={0.2} label={{ value: '-20%', fontSize: 10, fill: 'green' }} />
                            )}

                            <Line 
                                type="monotone" 
                                dataKey="qt_consumo" 
                                stroke={selectedItem.classificacao === 'Sazonal/Pico' ? "#f97316" : "#22c55e"} 
                                strokeWidth={3}
                                dot={{ r: 4, fill: "white", strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                    {selectedItem.classificacao === 'Sazonal/Pico' 
                        ? "Este item apresenta picos de consumo muito acima da média. Recomenda-se estoque de segurança dinâmico." 
                        : selectedItem.classificacao === 'Estável/Linear' 
                        ? "Este item possui consumo previsível. Ideal para contratos de fornecimento contínuo."
                        : "Item com comportamento padrão ou irregular sem classificação específica."}
                </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione um item na lista para ver o gráfico.
          </div>
        )}
      </Card>
    </div>
  );
}