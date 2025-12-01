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

// Cores para diferenciar clusters visualmente
const CLUSTER_COLORS = [
  'hsl(var(--cluster-0))',
  'hsl(var(--cluster-1))',
  'hsl(var(--cluster-2))',
  'hsl(var(--cluster-3))',
  'hsl(var(--cluster-4))',
];

export function ItemsTable({ data }: ItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');

  // Extrair lista única de grupos para o filtro
  const grupos = useMemo(() => {
    // Garante que item.grupo exista antes de acessar
    const uniqueGroups = new Set(data.map(item => item.grupo || 'Outros'));
    return Array.from(uniqueGroups).sort();
  }, [data]);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Uso de Optional Chaining (?.) e fallback para string vazia para evitar crash
      const nomeItem = item.nome || '';
      const matchesSearch = nomeItem.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'all' || item.grupo === selectedGroup;
      const matchesCluster = selectedCluster === 'all' || item.cluster_id?.toString() === selectedCluster;
      return matchesSearch && matchesGroup && matchesCluster;
    });
  }, [data, searchTerm, selectedGroup, selectedCluster]);

  // Resetar cluster quando mudar o grupo
  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    setSelectedCluster('all');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explorador de Itens</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedGroup} onValueChange={handleGroupChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Grupos</SelectItem>
              {grupos.map(grupo => (
                <SelectItem key={grupo} value={grupo}>
                  {grupo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por Cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clusters</SelectItem>
              {[0, 1, 2, 3, 4].map(id => (
                <SelectItem key={id} value={id.toString()}>
                  Cluster {id}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Produto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Cluster</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Custo Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Consumo Médio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Estoque</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredData.map((item) => (
                  <tr 
                    key={item.id_produto} 
                    className="hover:bg-muted/50 transition-colors border-l-4"
                    style={{ borderLeftColor: CLUSTER_COLORS[(item.cluster_id || 0) % CLUSTER_COLORS.length] }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                      {item.id_produto}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[150px] truncate" title={item.grupo}>
                      {item.grupo}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: CLUSTER_COLORS[(item.cluster_id || 0) % CLUSTER_COLORS.length],
                          color: CLUSTER_COLORS[(item.cluster_id || 0) % CLUSTER_COLORS.length]
                        }}
                      >
                        {item.cluster_id}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      R$ {(item.custo_unitario || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      {(item.consumo_medio_mensal || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                      {(item.qt_estoque || 0).toLocaleString('pt-BR')}
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