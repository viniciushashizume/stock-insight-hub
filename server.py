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

# Definição das colunas esperadas (ajustado para aceitar ds_material_hospital)
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

def carregar_e_processar_dados():
    # 1. CARREGAMENTO
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

    # Normalização de nomes de colunas (caso o CSV use ds_item em vez de ds_material_hospital)
    if 'ds_item' in df.columns and COLUNA_NOME_ITEM not in df.columns:
        df = df.rename(columns={'ds_item': COLUNA_NOME_ITEM})

    print(f"Colunas disponíveis: {df.columns.tolist()}")

    # 2. CONSOLIDAÇÃO
    print("--- Consolidando movimentações em itens únicos... ---")
    cols_identificadores = ['id_item', COLUNA_NOME_ITEM, COLUNA_CLASSE]
    
    # Verifica se as colunas existem para evitar erros
    cols_agregacao_existentes = {k: v for k, v in regras_agregacao.items() if k in df.columns}
    cols_id_existentes = [c for c in cols_identificadores if c in df.columns]

    if not cols_id_existentes:
        print(f"Colunas identificadoras {cols_identificadores} não encontradas.")
        return []

    # Se faltar alguma coluna de identificação, tenta preencher ou avisar
    if len(cols_id_existentes) < len(cols_identificadores):
        print(f"Aviso: Nem todas colunas identificadoras foram encontradas. Usando: {cols_id_existentes}")

    df_itens = df.groupby(cols_id_existentes).agg(cols_agregacao_existentes).reset_index()

    # 3. CLUSTERIZAÇÃO
    features_cluster = list(cols_agregacao_existentes.keys())
    materiais_unicos = df_itens[COLUNA_CLASSE].dropna().unique()
    
    resultado_final = []

    for material in materiais_unicos:
        # 3.1 Filtra o material
        df_material = df_itens[df_itens[COLUNA_CLASSE] == material].copy()
        df_material = df_material.dropna(subset=features_cluster)

        # Se houver poucos itens, não faz cluster complexo (joga num cluster '4' padrão)
        if len(df_material) < MIN_ITENS_POR_GRUPO:
            df_material['Cluster'] = 4 
            resultado_final.append(df_material)
            continue

        # 3.2 Escalar os dados
        scaler = StandardScaler()
        X = df_material[features_cluster]
        if len(X) == 0: continue
        
        X_scaled = scaler.fit_transform(X)

        # 3.3 Definição do K e Aplicação do Modelo
        if K_CLUSTERS_MANUAL is not None:
            melhor_k = min(K_CLUSTERS_MANUAL, len(df_material) - 1)
            if melhor_k < 2: melhor_k = 2
            
            # Garante que não tentamos mais clusters que amostras
            n_clusters_final = min(3, len(df_material)) 
            kmeans = KMeans(n_clusters=n_clusters_final, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
        else:
            # Lógica automática (simplificada para o exemplo)
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)

        df_material['Cluster'] = labels
        resultado_final.append(df_material)

    if resultado_final:
        df_final = pd.concat(resultado_final)
        
        # Renomeia colunas para o padrão que o Frontend (React) espera
        # Garante que ds_material_hospital seja mapeado para 'nome'
        df_api = df_final.rename(columns={
            'id_item': 'id_produto',
            COLUNA_NOME_ITEM: 'nome',
            'ds_item': 'nome', # Fallback
            COLUNA_CLASSE: 'grupo',
            'ds_grupo_material': 'grupo', # Fallback
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