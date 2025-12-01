import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Configuração de CORS para permitir que o React (porta 8080) acesse o Python (porta 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique a URL exata do front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUAS CONFIGURAÇÕES (ORIGINAIS DO PROJETO) ---
K_CLUSTERS_MANUAL = 3  # Fixado em 3 conforme solicitado
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
    # 1. CARREGAMENTO
    try:
        print("Tentando ler 'estoque.csv'...")
        
        # Tenta ler o arquivo (adaptação para aceitar gz ou csv normal se necessário)
        try:
            df = pd.read_csv("df_analise.csv.gz", sep=',', encoding='utf-8', on_bad_lines='warn')
        except:
            print("Tentativa com vírgula falhou. Tentando ponto-e-vírgula e latin1...")
            df = pd.read_csv("estoque.csv", sep=';', encoding='latin1', on_bad_lines='warn')

        print("Arquivo lido com sucesso!")
        print(f"Colunas encontradas: {df.columns.tolist()}")

    except Exception as e:
        print(f"ERRO FATAL ao ler arquivo: {e}")
        return []

    # 2. CONSOLIDAÇÃO
    print("--- Consolidando movimentações em itens únicos... ---")
    cols_identificadores = ['id_item', 'ds_item', COLUNA_CLASSE]
    
    # Verifica se as colunas existem para evitar erros
    cols_agregacao_existentes = {k: v for k, v in regras_agregacao.items() if k in df.columns}
    cols_id_existentes = [c for c in cols_identificadores if c in df.columns]

    if not cols_id_existentes:
        print(f"Colunas identificadoras {cols_identificadores} não encontradas.")
        return []

    df_itens = df.groupby(cols_id_existentes).agg(cols_agregacao_existentes).reset_index()

    # 3. CLUSTERIZAÇÃO
    features_cluster = list(cols_agregacao_existentes.keys())
    materiais_unicos = df_itens[COLUNA_CLASSE].dropna().unique()
    
    resultado_final = []

    for material in materiais_unicos:
        # 3.1 Filtra o material
        df_material = df_itens[df_itens[COLUNA_CLASSE] == material].copy()
        df_material = df_material.dropna(subset=features_cluster)

        # Se houver poucos itens, não faz cluster (joga num cluster '4' padrão ou similar)
        if len(df_material) < MIN_ITENS_POR_GRUPO:
            df_material['Cluster'] = 4 
            resultado_final.append(df_material)
            continue

        # 3.2 Escalar os dados
        scaler = StandardScaler()
        X = df_material[features_cluster]
        X_scaled = scaler.fit_transform(X)

        # 3.3 Definição do K e Aplicação do Modelo
        if K_CLUSTERS_MANUAL is not None:
            melhor_k = K_CLUSTERS_MANUAL  # Será 3
            kmeans = KMeans(n_clusters=melhor_k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
        else:
            # Lógica automática (Silhouette) como fallback caso mude a config no futuro
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

    if resultado_final:
        df_final = pd.concat(resultado_final)
        
        # Renomeia colunas para o padrão que o Frontend (React) espera
        df_api = df_final.rename(columns={
            'id_item': 'id_produto',
            'ds_item': 'nome',
            'ds_grupo_material': 'grupo',
            'Cluster': 'cluster_id'
        })
        
        # Limpeza para JSON (NaN/Inf quebram APIs)
        df_api = df_api.fillna(0).replace([np.inf, -np.inf], 0)
        
        print(f"Processamento concluído. Retornando {len(df_api)} itens.")
        return df_api.to_dict(orient='records')
    
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