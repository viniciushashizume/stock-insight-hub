import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemEstoque } from '@/services/api';
import { Search } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ItemsTableProps {
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

export function ItemsTable({ data }: ItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCluster = selectedCluster === 'all' || item.cluster_id.toString() === selectedCluster;
      return matchesSearch && matchesCluster;
    });
  }, [data, searchTerm, selectedCluster]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explorador de Itens</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clusters</SelectItem>
              {[0, 1, 2, 3, 4].map(id => (
                <SelectItem key={id} value={id.toString()}>
                  Cluster {id} - {CLUSTER_NAMES[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nome do Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cluster
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Custo Unitário
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Consumo Médio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estoque Atual
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredData.map((item) => (
                  <tr 
                    key={item.id_produto} 
                    className="hover:bg-muted/50 transition-colors border-l-4"
                    style={{ borderLeftColor: CLUSTER_COLORS[item.cluster_id] }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                      {item.id_produto}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: CLUSTER_COLORS[item.cluster_id],
                          color: CLUSTER_COLORS[item.cluster_id]
                        }}
                      >
                        {item.cluster_id}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      R$ {item.custo_unitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      {item.consumo_medio_mensal}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      {item.qt_estoque}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Exibindo {filteredData.length} de {data.length} itens
        </div>
      </CardContent>
    </Card>
  );
}
