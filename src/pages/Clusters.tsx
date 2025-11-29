import { useEffect, useState, useMemo } from 'react';
import { ClusterInsights } from '@/components/ClusterInsights';
import { fetchDadosClusters, agruparPorGrupoECluster, ItemEstoque } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Clusters() {
  const [dados, setDados] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDadosClusters();
        setDados(data);
        // Seleciona o primeiro grupo por padrão se houver dados
        if (data.length > 0) {
          const firstGroup = data[0].grupo;
          setSelectedGroup(firstGroup);
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do estoque.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const dadosEstruturados = useMemo(() => agruparPorGrupoECluster(dados), [dados]);
  const gruposDisponiveis = useMemo(() => Object.keys(dadosEstruturados).sort(), [dadosEstruturados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando análise de clusters...</p>
        </div>
      </div>
    );
  }

  const clustersDoGrupo = selectedGroup ? dadosEstruturados[selectedGroup] : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análise de Clusters K-Means</h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada por Grupo de Material
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um Grupo" />
            </SelectTrigger>
            <SelectContent>
              {gruposDisponiveis.map(grupo => (
                <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedGroup && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Grupo: {selectedGroup}</h2>
          
          {Object.entries(clustersDoGrupo).map(([clusterId, items]) => (
            <ClusterInsights
              key={clusterId}
              clusterId={Number(clusterId)}
              items={items}
              grupoNome={selectedGroup}
            />
          ))}
          
          {Object.keys(clustersDoGrupo).length === 0 && (
            <p className="text-muted-foreground">Nenhum dado de cluster encontrado para este grupo.</p>
          )}
        </div>
      )}
    </div>
  );
}