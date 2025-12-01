# insights.py
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Variável global para armazenar o dataframe bruto
df_raw_storage = None

def set_df_raw(df):
    global df_raw_storage
    df_raw_storage = df

@router.get("/api/insights/risk")
def get_risk_insight():
    # Mantendo a lógica de risco existente para não quebrar a outra aba, 
    # mas garantindo consistência com o arquivo original se necessário.
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados no servidor")

    df = df_raw_storage.copy()
    
    # Normalização de colunas
    col_map = {'ds_item': 'ds_material_hospital', 'ds_grupo_material': 'ds_grupo'}
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    
    if 'ds_material_hospital' not in df.columns:
         cols_obj = df.select_dtypes(include=['object']).columns
         df['ds_material_hospital'] = df[cols_obj[0]] if len(cols_obj) > 0 else "Item " + df['id_item'].astype(str)

    if 'ds_grupo' not in df.columns:
        df['ds_grupo'] = df['ds_classe_material'] if 'ds_classe_material' in df.columns else 'Geral'

    agregacoes = {
        'qt_consumo': ['mean', 'std', 'sum'],
        'qt_estoque': 'mean',
        'custo_total': 'sum'
    }
    cols_existentes = {k: v for k, v in agregacoes.items() if k in df.columns}
    
    df_risco = df.groupby(['id_item', 'ds_material_hospital', 'ds_grupo']).agg(cols_existentes).reset_index()
    df_risco.columns = ['id_produto', 'nome', 'grupo', 'consumo_medio', 'consumo_std', 'consumo_total', 'estoque_medio', 'custo_total_acumulado']
    
    df_risco['consumo_std'] = df_risco['consumo_std'].fillna(0)
    df_risco = df_risco[df_risco['consumo_medio'] > 0].copy()

    df_risco['cv_consumo'] = df_risco['consumo_std'] / df_risco['consumo_medio']
    df_risco['cobertura_meses'] = df_risco['estoque_medio'] / df_risco['consumo_medio']
    df_risco = df_risco.replace([np.inf, -np.inf], 0).fillna(0)

    limite_custo = df_risco['custo_total_acumulado'].quantile(0.50)
    df_zoom = df_risco[df_risco['cobertura_meses'] <= 3].copy()

    df_zoom['is_critical'] = (
        (df_zoom['cv_consumo'] > 0.8) & 
        (df_zoom['cobertura_meses'] < 1.0) & 
        (df_zoom['custo_total_acumulado'] > limite_custo)
    )

    return {
        "data": df_zoom.to_dict(orient='records'),
        "meta": {
            "total_criticos": int(df_zoom['is_critical'].sum()),
            "zona_risco": {"cv_min": 0.8, "cobertura_max": 1.0}
        }
    }

@router.get("/api/insights/seasonality")
def get_seasonality_insight():
    """
    Reimplementação exata da lógica do celula2.py:
    1. Filtra Medicamentos.
    2. Ignora itens com histórico < 6 ou média < 10.
    3. Seleciona Top Sazonais (maior razão de pico).
    4. Seleciona Top Lineares (menor CV, com volume relevante).
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")

    df = df_raw_storage.copy()

    # --- 1. PREPARAÇÃO DOS DADOS (Conforme celula2.py) ---
    date_col = None
    possible_date_cols = ['dt_movimento_estoque', 'data', 'dt_movimento', 'dt_referencia']
    for col in possible_date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if not date_col:
        return []

    df[date_col] = pd.to_datetime(df[date_col])
    df['ano'] = df[date_col].dt.year
    df['mes'] = df[date_col].dt.month
    
    # Normalização de nomes
    col_map = {'ds_item': 'ds_material_hospital', 'ds_grupo_material': 'ds_grupo'}
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Filtrar Medicamentos (Tenta replicar df_meds)
    # Se a coluna de grupo existir, filtra. Senão, usa tudo.
    if 'ds_grupo' in df.columns:
        df_meds = df[df['ds_grupo'].str.upper().str.contains('MEDICAMENTO', na=False)].copy()
        if len(df_meds) == 0: # Fallback se o filtro zerar tudo (caso os dados não sejam de med)
            df_meds = df.copy()
    else:
        df_meds = df.copy()

    # Cria coluna periodo para ordenação
    df_meds['periodo'] = pd.to_datetime(df_meds['ano'].astype(str) + '-' + df_meds['mes'].astype(str) + '-01')
    
    # --- 2. CÁLCULO DE MÉTRICAS ---
    # Primeiro, agregamos mensalmente para ter o histórico correto
    df_mensal = df_meds.groupby(['id_item', 'ds_material_hospital', 'ds_grupo', 'periodo', 'ano', 'mes'])['qt_consumo'].sum().reset_index()
    
    metricas = []
    itens_unicos = df_mensal['id_item'].unique()

    for item_id in itens_unicos:
        dados = df_mensal[df_mensal['id_item'] == item_id].sort_values('periodo')
        nome = dados['ds_material_hospital'].iloc[0]
        grupo = dados.get('ds_grupo', pd.Series(['Geral'])).iloc[0]
        
        media = dados['qt_consumo'].mean()

        # Ignora itens com pouco histórico ou volume quase zero (Conforme celula2.py)
        if len(dados) < 6 or media < 10:
            continue

        # A. Métrica de Instabilidade (Pico)
        pico_max = dados['qt_consumo'].max()
        razao_pico = pico_max / media if media > 0 else 0

        # B. Métrica de Estabilidade (CV)
        cv = dados['qt_consumo'].std() / media if media > 0 else 0

        # Histórico formatado
        historico = dados[['periodo', 'ano', 'mes', 'qt_consumo']].copy()
        historico['periodo_str'] = historico['periodo'].dt.strftime('%Y-%m')
        
        metricas.append({
            'id_produto': int(item_id),
            'nome': nome,
            'grupo': grupo,
            'razao_pico': float(razao_pico),
            'cv': float(cv),
            'media': float(media),
            'historico': historico.to_dict(orient='records')
        })

    df_resultado = pd.DataFrame(metricas)
    if df_resultado.empty:
        return []

    # --- 3. SELEÇÃO DOS CAMPEÕES (Conforme celula2.py) ---
    
    # Top Sazonais (maior pico)
    # Vamos pegar um número maior que 3 para popular a lista, mas marcando os top
    df_resultado['classificacao'] = 'Outros'
    
    # Ordena por pico para definir sazonais
    df_sazonais = df_resultado.nlargest(10, 'razao_pico') # Pego top 10 para UI
    ids_sazonais = df_sazonais['id_produto'].tolist()
    
    # Marca Sazonais
    df_resultado.loc[df_resultado['id_produto'].isin(ids_sazonais), 'classificacao'] = 'Sazonal/Pico'

    # Top Lineares
    # Filtro de volume (corte_volume = quantile 0.4)
    corte_volume = df_resultado['media'].quantile(0.4)
    # Pega os que não são sazonais E tem volume > corte
    candidatos_linear = df_resultado[
        (~df_resultado['id_produto'].isin(ids_sazonais)) & 
        (df_resultado['media'] > corte_volume)
    ]
    
    if not candidatos_linear.empty:
        df_lineares = candidatos_linear.nsmallest(10, 'cv') # Top 10 menor CV
        ids_lineares = df_lineares['id_produto'].tolist()
        df_resultado.loc[df_resultado['id_produto'].isin(ids_lineares), 'classificacao'] = 'Estável/Linear'

    # Filtra apenas os classificados para a UI (ou retorna tudo ordenado por relevância)
    df_final = df_resultado[df_resultado['classificacao'] != 'Outros'].copy()
    
    # Ordenação final para exibição: Sazonais primeiro, depois Lineares
    df_final = df_final.sort_values(['classificacao', 'razao_pico'], ascending=[False, False])

    return df_final.to_dict(orient='records')