import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexão API</CardTitle>
            <CardDescription>
              Configure a URL da API para buscar dados em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">URL da API</Label>
              <Input 
                id="api-url" 
                placeholder="http://localhost:8000/api/dados-clusters"
                defaultValue="http://localhost:8000/api/dados-clusters"
              />
              <p className="text-sm text-muted-foreground">
                Se a API não estiver disponível, dados mockados serão usados automaticamente
              </p>
            </div>
            <Button>Salvar Configurações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências de Visualização</CardTitle>
            <CardDescription>
              Personalize a exibição dos dados na dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Atualização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Recarregar dados automaticamente a cada 5 minutos
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de Alertas</Label>
                <p className="text-sm text-muted-foreground">
                  Receber alertas sobre itens críticos
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Alto Contraste</Label>
                <p className="text-sm text-muted-foreground">
                  Aumentar contraste para melhor visualização
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
            <CardDescription>
              Informações sobre a aplicação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Algoritmo:</span>
              <span className="font-medium">K-Means Clustering</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Atualização:</span>
              <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
