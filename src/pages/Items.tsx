import { useEffect, useState } from 'react';
import { ItemsTable } from '@/components/ItemsTable';
import { fetchDadosClusters, ItemEstoque } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Items() {
  const [dados, setDados] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDadosClusters();
        setDados(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando lista de itens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Explorador de Itens</h1>
        <p className="text-muted-foreground mt-1">
          Lista completa de itens do estoque com filtros e busca
        </p>
      </div>

      <ItemsTable data={dados} />
    </div>
  );
}
