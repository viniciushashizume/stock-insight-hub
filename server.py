import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import insights  # Importa o módulo de insights criado anteriormente

app = FastAPI()

# Inclui as rotas de insights (ex: /api/insights/risk)
app.include_router(insights.router)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÕES ---
K_CLUSTERS_MANUAL = 3
MIN_ITENS_POR_GRUPO = 10
COLUNA_CLASSE = 'ds_grupo_material'
COLUNA_NOME_ITEM = 'ds_material_hospital'

regras_agregacao = {
    'qt_estoque': 'mean',
    'qt_consumo': 'sum',
    'custo_total': 'sum',
    'custo_unitario': 'mean',
    'consumo_medio_mensal': 'mean'
}

def gerar_dados_sinteticos():
    print("Gerando dados sintéticos para teste (modo fallback)...")
    np.random.seed(42)
    n_items = 500
    data = {
        'id_item': range(1000, 1000 + n_items),
        COLUNA_NOME_ITEM: [f'Material Médico {i}' for i in range(n_items)],
        COLUNA_CLASSE: np.random.choice(['Medicamentos', 'Materiais Hospitalares', 'Ortopedia', 'Dietas', 'OPME'], n_items),
        'qt_estoque': np.random.exponential(100, n_items),
        'qt_consumo': np.random.exponential(200, n_items),
        'custo_total': np.random.exponential(5000, n_items),
        'custo_unitario': np.random.exponential(50, n_items),
        'consumo_medio_mensal': np.random.exponential(20, n_items)
    }
    return pd.DataFrame(data)

# --- NOVA FUNÇÃO: Apenas carrega e normaliza os dados ---
def carregar_dados():
    df = None
    try:
        print("Tentando ler 'df_analise.csv.gz'...")
        df = pd.read_csv("df_analise.csv.gz", sep=',', encoding='utf-8', on_bad_lines='warn', compression='gzip')
        print("Arquivo lido com sucesso!")
    except Exception as e:
        print(f"Arquivo principal não encontrado ou erro: {e}")
        try:
            print("Tentando ler 'estoque.csv'...")
            df = pd.read_csv("estoque.csv", sep=';', encoding='latin1', on_bad_lines='warn')
        except Exception as e2:
            print(f"Nenhum arquivo CSV encontrado. Usando gerador de dados. Erro: {e2}")
            df = gerar_dados_sinteticos()

    # Normalização de nomes de colunas
    if 'ds_item' in df.columns and COLUNA_NOME_ITEM not in df.columns:
        df = df.rename(columns={'ds_item': COLUNA_NOME_ITEM})
    
    # Normalização para garantir que 'ds_grupo_material' exista para o insights.py
    if COLUNA_CLASSE not in df.columns and 'ds_classe_material' in df.columns:
        df = df.rename(columns={'ds_classe_material': COLUNA_CLASSE})

    return df

# --- NOVA FUNÇÃO: Processa os clusters a partir de um DataFrame ---
def processar_clusters(df):
    print("--- Consolidando movimentações em itens únicos... ---")
    cols_identificadores = ['id_item', COLUNA_NOME_ITEM, COLUNA_CLASSE]
    
    cols_agregacao_existentes = {k: v for k, v in regras_agregacao.items() if k in df.columns}
    cols_id_existentes = [c for c in cols_identificadores if c in df.columns]

    if not cols_id_existentes:
        print(f"Colunas identificadoras {cols_identificadores} não encontradas.")
        return []

    # Agrupa dados para os clusters
    df_itens = df.groupby(cols_id_existentes).agg(cols_agregacao_existentes).reset_index()

    features_cluster = list(cols_agregacao_existentes.keys())
    materiais_unicos = df_itens[COLUNA_CLASSE].dropna().unique()
    
    resultado_final = []

    for material in materiais_unicos:
        df_material = df_itens[df_itens[COLUNA_CLASSE] == material].copy()
        df_material = df_material.dropna(subset=features_cluster)

        if len(df_material) < MIN_ITENS_POR_GRUPO:
            df_material['Cluster'] = 4 
            resultado_final.append(df_material)
            continue

        scaler = StandardScaler()
        X = df_material[features_cluster]
        if len(X) == 0: continue
        
        X_scaled = scaler.fit_transform(X)

        if K_CLUSTERS_MANUAL is not None:
            n_clusters_final = min(3, len(df_material)) 
            if n_clusters_final < 2: n_clusters_final = 1
            kmeans = KMeans(n_clusters=n_clusters_final, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
        else:
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)

        df_material['Cluster'] = labels
        resultado_final.append(df_material)

    if resultado_final:
        df_final = pd.concat(resultado_final)
        
        df_api = df_final.rename(columns={
            'id_item': 'id_produto',
            COLUNA_NOME_ITEM: 'nome',
            COLUNA_CLASSE: 'grupo',
            'Cluster': 'cluster_id'
        })
        
        df_api = df_api.fillna(0).replace([np.inf, -np.inf], 0)
        return df_api.to_dict(orient='records')
    
    return []

# Endpoint de Clusters (antigo)
@app.get("/api/dados-clusters")
def get_clusters():
    # 1. Carrega os dados brutos
    df = carregar_dados()
    
    # 2. Envia para o módulo de insights (para que a rota /api/insights/risk funcione)
    insights.set_df_raw(df)
    
    # 3. Processa e retorna os clusters
    dados_clusters = processar_clusters(df)
    return dados_clusters

# Evento de startup (opcional, carrega dados ao iniciar para cache)
@app.on_event("startup")
async def startup_event():
    print("Iniciando servidor e pré-carregando dados...")
    df = carregar_dados()
    insights.set_df_raw(df)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)