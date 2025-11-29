import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

app = FastAPI()

# Configuração de CORS para permitir que o React (porta 5173 ou 3000) acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique a URL do seu front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def carregar_dados():
    # Tenta carregar o arquivo real se existir, senão gera dados de exemplo
    caminho_arquivo = 'df_analise.csv.gz' # Caminho do seu arquivo
    try:
        df = pd.read_csv(caminho_arquivo, compression='gzip')
        return df
    except FileNotFoundError:
        print("Aviso: Arquivo de dados não encontrado. Gerando dados sintéticos para teste.")
        # Gerando dados simulados baseados nas estatísticas do seu notebook
        np.random.seed(42)
        n_items = 500
        data = {
            'id_item': range(1000, 1000 + n_items),
            'ds_material_hospital': [f'Material Médico {i}' for i in range(n_items)],
            'ds_grupo_material': np.random.choice(['Medicamentos', 'Materiais', 'Ortopedia'], n_items),
            'qt_estoque': np.random.exponential(100, n_items),
            'qt_consumo': np.random.exponential(200, n_items),
            'custo_total': np.random.exponential(5000, n_items),
            'custo_unitario': np.random.exponential(50, n_items),
            'consumo_medio_mensal': np.random.exponential(20, n_items)
        }
        return pd.DataFrame(data)

def processar_clusters(df):
    # 1. Agrupamento por Item (conforme seu notebook)
    df_grouped = df.groupby('id_item').agg({
        'ds_material_hospital': 'first',
        'ds_grupo_material': 'first',
        'qt_estoque': 'mean',
        'qt_consumo': 'sum',
        'custo_total': 'sum',
        'custo_unitario': 'mean',
        'consumo_medio_mensal': 'mean'
    }).reset_index()

    # 2. Pré-processamento (Log Transformation + Scaling)
    features_cols = ['qt_estoque', 'qt_consumo', 'custo_total', 'custo_unitario', 'consumo_medio_mensal']
    X_transformed = df_grouped[features_cols].copy()

    # Aplica Log (np.log1p) para tratar valores zero e reduzir skewness
    for col in features_cols:
        if (X_transformed[col] >= 0).all():
            X_transformed[col] = np.log1p(X_transformed[col])

    # Padronização
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_transformed)

    # 3. K-Means (k=5 conforme sua análise de cotovelo)
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    df_grouped['cluster_id'] = labels

    # 4. Gerar Descrições Automáticas dos Clusters (Insights)
    # Analisa as médias de cada cluster para dar um nome inteligível
    cluster_stats = df_grouped.groupby('cluster_id')[features_cols].mean()
    
    descriptions = {}
    for cid in cluster_stats.index:
        stats = cluster_stats.loc[cid]
        # Lógica simples para nomear baseada nos quartis do seu notebook
        if stats['custo_total'] > cluster_stats['custo_total'].quantile(0.8):
            desc = "Alto Custo / Crítico"
        elif stats['qt_consumo'] > cluster_stats['qt_consumo'].quantile(0.8):
            desc = "Alto Giro / Consumo Massivo"
        elif stats['qt_consumo'] < cluster_stats['qt_consumo'].quantile(0.3) and stats['custo_total'] < cluster_stats['custo_total'].quantile(0.3):
            desc = "Baixa Relevância / Obsoleto?"
        else:
            desc = "Giro Intermediário / Padrão"
        descriptions[cid] = desc

    df_grouped['descricao_cluster'] = df_grouped['cluster_id'].map(descriptions)
    
    return df_grouped

# Cache dos dados processados para não rodar o modelo a cada request
df_final = None

@app.on_event("startup")
async def startup_event():
    global df_final
    raw_df = carregar_dados()
    df_final = processar_clusters(raw_df)

@app.get("/api/clusters")
async def get_clusters():
    if df_final is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")
    
    # Formata para o padrão que o frontend espera (interface ItemEstoque)
    resultado = []
    for _, row in df_final.iterrows():
        resultado.append({
            "id_produto": int(row['id_item']),
            "nome": str(row['ds_material_hospital']),
            "custo_unitario": float(round(row['custo_unitario'], 2)),
            "consumo_medio_mensal": float(round(row['consumo_medio_mensal'], 2)),
            "qt_estoque": float(round(row['qt_estoque'], 2)),
            "custo_total": float(round(row['custo_total'], 2)),
            "cluster_id": int(row['cluster_id']),
            "descricao_cluster": row['descricao_cluster']
        })
    
    return resultado

@app.get("/api/kpis")
async def get_kpis():
    if df_final is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")
        
    return {
        "total_itens": len(df_final),
        "valor_estoque": df_final['custo_total'].sum(),
        "consumo_total": df_final['qt_consumo'].sum()
    }

# Para rodar: uvicorn app:app --reload