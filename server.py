import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn  # <--- Esta importação estava faltando

app = FastAPI()

# Configuração de CORS para permitir que o React (porta 8080) acesse o Python (porta 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique a URL exata do front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUAS CONFIGURAÇÕES ORIGINAIS ---
K_CLUSTERS_MANUAL = 3
MIN_ITENS_POR_GRUPO = 10
COLUNA_CLASSE = 'ds_grupo_material'

regras_agregacao = {
    'qt_estoque': 'mean',
    'qt_consumo': 'sum',
    'custo_total': 'sum',
    'custo_unitario': 'mean',
    'consumo_medio_mensal': 'mean'
}

def carregar_e_processar_dados():
    # 1. CARREGAMENTO (Adapte para a origem real dos seus dados)
    # Exemplo: df = pd.read_csv("seus_dados.csv") ou pd.read_excel("seus_dados.xlsx")
    try:
        # Certifique-se de que o arquivo "estoque.csv" existe na mesma pasta ou ajuste o caminho
        df = pd.read_csv("estoque.csv", encoding='utf-8', sep=';') 
        # DICA: Se usar Excel, troque para: pd.read_excel("estoque.xlsx")
    except Exception as e:
        print(f"Erro ao ler arquivo: {e}")
        return []

    # 2. CONSOLIDAÇÃO (Sua lógica original)
    print("--- Consolidando movimentações em itens únicos... ---")
    cols_identificadores = ['id_item', 'ds_item', COLUNA_CLASSE]
    
    # Verifica se as colunas necessárias existem no DataFrame carregado
    cols_agregacao_existentes = {k: v for k, v in regras_agregacao.items() if k in df.columns}
    cols_id_existentes = [c for c in cols_identificadores if c in df.columns]

    if not cols_id_existentes:
        print("Colunas identificadoras não encontradas no arquivo.")
        return []

    df_itens = df.groupby(cols_id_existentes).agg(cols_agregacao_existentes).reset_index()

    # 3. CLUSTERIZAÇÃO (Sua lógica original adaptada para API)
    features_cluster = list(cols_agregacao_existentes.keys())
    materiais_unicos = df_itens[COLUNA_CLASSE].dropna().unique()
    
    resultado_final = []

    for material in materiais_unicos:
        df_material = df_itens[df_itens[COLUNA_CLASSE] == material].copy()
        df_material = df_material.dropna(subset=features_cluster)

        # Se tiver poucos itens, atribui cluster padrão 4 (neutro) ou pula
        if len(df_material) < MIN_ITENS_POR_GRUPO:
            df_material['Cluster'] = 4 
            resultado_final.append(df_material)
            continue

        # Escalar
        scaler = StandardScaler()
        X = df_material[features_cluster]
        X_scaled = scaler.fit_transform(X)

        # Definição do K
        if K_CLUSTERS_MANUAL is not None:
            melhor_k = K_CLUSTERS_MANUAL
            kmeans = KMeans(n_clusters=melhor_k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
        else:
            # Modo Automático
            melhor_score = -1
            melhor_k = 2
            max_k = min(7, len(df_material))
            
            for k in range(2, max_k):
                km = KMeans(n_clusters=k, random_state=42, n_init=10)
                lb = km.fit_predict(X_scaled)
                if len(np.unique(lb)) > 1:
                    sc = silhouette_score(X_scaled, lb)
                    if sc > melhor_score:
                        melhor_score = sc
                        melhor_k = k
            
            kmeans = KMeans(n_clusters=melhor_k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)

        df_material['Cluster'] = labels
        resultado_final.append(df_material)

    # Consolida todos os grupos processados
    if resultado_final:
        df_final = pd.concat(resultado_final)
        
        # Renomeia colunas para bater com a interface do React (ItemEstoque)
        # O React espera: id_produto, nome, grupo, custo_unitario, consumo_medio_mensal, qt_estoque, cluster_id
        df_api = df_final.rename(columns={
            'id_item': 'id_produto',
            'ds_item': 'nome',
            'ds_grupo_material': 'grupo',
            'Cluster': 'cluster_id'
        })
        
        # Preenche vazios (NaN) com 0 e converte para lista de dicionários (JSON)
        return df_api.fillna(0).to_dict(orient='records')
    
    return []

@app.get("/api/dados-clusters")
def get_clusters():
    """
    Endpoint que o React vai consumir.
    Roda o processamento e retorna o JSON.
    """
    dados = carregar_e_processar_dados()
    return dados

if __name__ == "__main__":
    # Roda o servidor na porta 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)