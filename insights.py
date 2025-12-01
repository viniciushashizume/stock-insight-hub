# insights.py
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Variável global para armazenar o dataframe bruto (com histórico para calcular desvio padrão)
df_raw_storage = None

def set_df_raw(df):
    global df_raw_storage
    df_raw_storage = df

@router.get("/api/insights/risk")
def get_risk_insight():
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados no servidor")

    df = df_raw_storage.copy()

    # Normalização de nomes de colunas para garantir funcionamento
    col_map = {
        'ds_item': 'ds_material_hospital',
        'ds_grupo_material': 'ds_grupo'
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    
    # Se a coluna 'ds_material_hospital' não existir, tenta achar outra
    if 'ds_material_hospital' not in df.columns:
         # Tenta pegar a primeira coluna de texto como nome
         cols_obj = df.select_dtypes(include=['object']).columns
         if len(cols_obj) > 0:
             df['ds_material_hospital'] = df[cols_obj[0]]
         else:
             df['ds_material_hospital'] = "Item " + df['id_item'].astype(str)

    # Garante que temos a coluna de grupo
    if 'ds_grupo' not in df.columns:
        if 'ds_classe_material' in df.columns:
            df['ds_grupo'] = df['ds_classe_material']
        else:
            df['ds_grupo'] = 'Geral'

    # 1. Recalcular métricas base (agrupando por item e grupo)
    # Precisamos do STD (desvio padrão), então o dataframe original deve ter histórico
    # Se o dataframe já for sumarizado, std será 0 ou NaN.
    
    agregacoes = {
        'qt_consumo': ['mean', 'std', 'sum'],
        'qt_estoque': 'mean',
        'custo_total': 'sum'
    }
    
    # Verifica se as colunas existem
    cols_existentes = {k: v for k, v in agregacoes.items() if k in df.columns}
    
    df_risco = df.groupby(['id_item', 'ds_material_hospital', 'ds_grupo']).agg(cols_existentes).reset_index()

    # Ajuste de colunas (Flatten MultiIndex)
    df_risco.columns = ['id_produto', 'nome', 'grupo', 'consumo_medio', 'consumo_std', 'consumo_total', 'estoque_medio', 'custo_total_acumulado']

    # Tratamento de NaNs (se std for NaN, assume 0)
    df_risco['consumo_std'] = df_risco['consumo_std'].fillna(0)
    df_risco = df_risco[df_risco['consumo_medio'] > 0].copy()

    # 2. Métricas de Risco
    # CV = Desvio Padrão / Média
    df_risco['cv_consumo'] = df_risco['consumo_std'] / df_risco['consumo_medio']
    # Cobertura = Estoque / Consumo Médio
    df_risco['cobertura_meses'] = df_risco['estoque_medio'] / df_risco['consumo_medio']

    # Substituir infinitos ou NaNs gerados
    df_risco = df_risco.replace([np.inf, -np.inf], 0).fillna(0)

    # 3. Filtro de Risco Crítico
    # Lógica baseada no seu código:
    # - CV > 0.8 (Alta variabilidade)
    # - Cobertura < 1.0 (Menos de 1 mês de estoque)
    # - Custo Relevante (acima da mediana)
    
    limite_custo = df_risco['custo_total_acumulado'].quantile(0.50)

    # Filtra para o "Zoom" (Cobertura <= 3 meses) para visualização
    df_zoom = df_risco[df_risco['cobertura_meses'] <= 3].copy()

    # Marca quais são críticos
    df_zoom['is_critical'] = (
        (df_zoom['cv_consumo'] > 0.8) & 
        (df_zoom['cobertura_meses'] < 1.0) & 
        (df_zoom['custo_total_acumulado'] > limite_custo)
    )

    # Prepara retorno JSON
    resultado = df_zoom.to_dict(orient='records')
    
    # Retorna estatísticas para desenhar as zonas no gráfico
    meta = {
        "total_itens_analisados": len(df_risco),
        "total_itens_zoom": len(df_zoom),
        "total_criticos": int(df_zoom['is_critical'].sum()),
        "zona_risco": {
            "cv_min": 0.8,
            "cobertura_max": 1.0
        }
    }

    return {
        "data": resultado,
        "meta": meta
    }

@router.get("/api/insights/seasonality")
def get_seasonality_insight():
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados no servidor")

    df = df_raw_storage.copy()

    # 1. Preparação de Datas
    # Tenta converter a coluna de data (assumindo nomes comuns)
    date_col = None
    possible_date_cols = ['dt_movimento_estoque', 'data', 'dt_movimento', 'dt_referencia']
    
    for col in possible_date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if not date_col:
        # Se não tiver data, não dá pra fazer análise temporal
        return {"data": [], "message": "Coluna de data não encontrada."}

    df[date_col] = pd.to_datetime(df[date_col])
    df['ano'] = df[date_col].dt.year
    df['mes'] = df[date_col].dt.month
    df['periodo_str'] = df[date_col].dt.strftime('%Y-%m')

    # Normaliza nomes de colunas de identificação
    col_map = {
        'ds_item': 'ds_material_hospital',
        'ds_grupo_material': 'ds_grupo'
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Garante grupo
    if 'ds_grupo' not in df.columns:
        df['ds_grupo'] = 'Geral'

    # 2. Agregação Mensal por Item (Histórico)
    df_mensal = df.groupby(['id_item', 'ds_material_hospital', 'ds_grupo', 'ano', 'mes', 'periodo_str']).agg({
        'qt_consumo': 'sum'
    }).reset_index()

    # 3. Cálculo de Métricas por Item
    itens_unicos = df_mensal['id_item'].unique()
    metricas = []

    for item_id in itens_unicos:
        dados_item = df_mensal[df_mensal['id_item'] == item_id]
        
        media = dados_item['qt_consumo'].mean()
        
        # Ignora itens irrelevantes (pouco histórico ou volume ínfimo)
        if len(dados_item) < 6 or media < 5:
            continue

        # A. Métrica de Instabilidade (Pico)
        pico_max = dados_item['qt_consumo'].max()
        # Evita divisão por zero
        razao_pico = (pico_max / media) if media > 0 else 0

        # B. Métrica de Estabilidade (CV)
        desvio = dados_item['qt_consumo'].std()
        cv = (desvio / media) if media > 0 else 0

        # Classificação
        classificacao = "Neutro"
        if razao_pico > 3.0: # Pico é 3x maior que a média
            classificacao = "Sazonal/Pico"
        elif cv < 0.3: # Variação menor que 30%
            classificacao = "Estável/Linear"

        # Prepara histórico para o gráfico (Array de objetos simples)
        historico = dados_item[['periodo_str', 'qt_consumo']].sort_values('periodo_str').to_dict(orient='records')

        metricas.append({
            "id_produto": int(item_id),
            "nome": dados_item['ds_material_hospital'].iloc[0],
            "grupo": dados_item['ds_grupo'].iloc[0],
            "media_consumo": float(media),
            "razao_pico": float(razao_pico),
            "cv": float(cv),
            "classificacao": classificacao,
            "historico": historico
        })

    # Ordena: Primeiro os Sazonais (maior pico), depois os Lineares (menor CV)
    metricas_ordenadas = sorted(metricas, key=lambda x: x['razao_pico'], reverse=True)

    return metricas_ordenadas