# insights.py
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Variável global para armazenar o dataframe bruto carregado pelo server.py
df_raw_storage = None

def set_df_raw(df):
    global df_raw_storage
    df_raw_storage = df

@router.get("/api/insights/risk")
def get_risk_insight():
    """
    Aplica a lógica de Risco de Ruptura definida no notebook:
    - Calcula CV (Variabilidade) e Cobertura (Meses de Estoque).
    - Identifica itens críticos: CV > 0.8 (instável) E Cobertura < 1.0 (baixo estoque) E Alto Custo.
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados no servidor")

    df = df_raw_storage.copy()
    
    # Normalização de nomes de colunas para garantir compatibilidade
    col_map = {
        'ds_item': 'ds_material_hospital', 
        'ds_grupo_material': 'ds_grupo',
        'ds_classe_material': 'ds_classe'
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    
    # Garante existência das colunas essenciais
    if 'ds_material_hospital' not in df.columns:
         cols_obj = df.select_dtypes(include=['object']).columns
         df['ds_material_hospital'] = df[cols_obj[0]] if len(cols_obj) > 0 else "Item " + df['id_item'].astype(str)

    if 'ds_grupo' not in df.columns:
        # Tenta usar classe se grupo não existir, ou define Geral
        df['ds_grupo'] = df['ds_classe'] if 'ds_classe' in df.columns else 'Geral'

    # Agregação conforme notebook (Média, Desvio Padrão, Soma)
    agregacoes = {
        'qt_consumo': ['mean', 'std', 'sum'],
        'qt_estoque': 'mean',
        'custo_total': 'sum'
    }
    # Filtra apenas colunas que existem no DF para evitar erro
    agg_validas = {k: v for k, v in agregacoes.items() if k in df.columns}
    
    df_risco = df.groupby(['id_item', 'ds_material_hospital', 'ds_grupo']).agg(agg_validas).reset_index()
    
    # Renomear colunas achatadas
    df_risco.columns = ['id_produto', 'nome', 'grupo', 'consumo_medio', 'consumo_std', 'consumo_total', 'estoque_medio', 'custo_total_acumulado']
    
    df_risco['consumo_std'] = df_risco['consumo_std'].fillna(0)
    
    # Filtrar itens sem consumo médio (divisão por zero)
    df_risco = df_risco[df_risco['consumo_medio'] > 0].copy()

    # Cálculo de Métricas (Notebook Snippet 38)
    df_risco['cv_consumo'] = df_risco['consumo_std'] / df_risco['consumo_medio']
    df_risco['cobertura_meses'] = df_risco['estoque_medio'] / df_risco['consumo_medio']
    
    # Limpeza
    df_risco = df_risco.replace([np.inf, -np.inf], 0).fillna(0)

    # Lógica de Corte (Notebook: limite_custo = quantile 0.50)
    limite_custo = df_risco['custo_total_acumulado'].quantile(0.50)
    
    # Filtro para focar apenas em itens com baixa cobertura para o gráfico de zoom
    df_zoom = df_risco[df_risco['cobertura_meses'] <= 3].copy()

    # Flag de Criticidade (Notebook: CV > 0.8 & Cobertura < 1.0 & Custo > limite)
    df_zoom['is_critical'] = (
        (df_zoom['cv_consumo'] > 0.8) & 
        (df_zoom['cobertura_meses'] < 1.0) & 
        (df_zoom['custo_total_acumulado'] > limite_custo)
    )
    
    # Ordenar por criticidade e custo
    df_zoom = df_zoom.sort_values(['is_critical', 'custo_total_acumulado'], ascending=[False, False])

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
    Aplica a lógica de Sazonalidade vs Linearidade (Notebook Snippet 39/49)
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")

    df = df_raw_storage.copy()

    # Detecção da coluna de data
    date_col = None
    possible_date_cols = ['dt_movimento_estoque', 'data', 'dt_movimento', 'dt_referencia']
    for col in possible_date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if not date_col:
        return []

    # Conversão para datetime
    df[date_col] = pd.to_datetime(df[date_col])
    df['ano'] = df[date_col].dt.year
    df['mes'] = df[date_col].dt.month
    
    # Normalização de nomes
    col_map = {'ds_item': 'ds_material_hospital', 'ds_grupo_material': 'ds_grupo'}
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # 1. Filtrar Medicamentos
    if 'ds_grupo' in df.columns:
        df_meds = df[df['ds_grupo'].str.upper().str.contains('MEDICAMENTO', na=False)].copy()
        if len(df_meds) == 0: 
            df_meds = df.copy()
    else:
        df_meds = df.copy()

    df_meds['periodo'] = pd.to_datetime(df_meds['ano'].astype(str) + '-' + df_meds['mes'].astype(str) + '-01')
    
    # 2. Agregação Mensal
    df_mensal = df_meds.groupby(['id_item', 'ds_material_hospital', 'ds_grupo', 'periodo', 'ano', 'mes'])['qt_consumo'].sum().reset_index()
    
    metricas = []
    itens_unicos = df_mensal['id_item'].unique()

    for item_id in itens_unicos:
        dados = df_mensal[df_mensal['id_item'] == item_id].sort_values('periodo')
        if dados.empty: continue
        
        nome = dados['ds_material_hospital'].iloc[0]
        grupo = dados.get('ds_grupo', pd.Series(['Geral'])).iloc[0]
        
        media = dados['qt_consumo'].mean()

        # Regra de Exclusão do Notebook
        if len(dados) < 6 or media < 10:
            continue

        # Métrica Sazonalidade (Pico)
        pico_max = dados['qt_consumo'].max()
        razao_pico = pico_max / media if media > 0 else 0

        # Métrica Estabilidade (CV)
        cv = dados['qt_consumo'].std() / media if media > 0 else 0

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

    # 3. Classificação
    df_resultado['classificacao'] = 'Outros'
    
    df_sazonais = df_resultado.nlargest(10, 'razao_pico')
    ids_sazonais = df_sazonais['id_produto'].tolist()
    df_resultado.loc[df_resultado['id_produto'].isin(ids_sazonais), 'classificacao'] = 'Sazonal/Pico'

    corte_volume = df_resultado['media'].quantile(0.4) 
    candidatos_linear = df_resultado[
        (~df_resultado['id_produto'].isin(ids_sazonais)) & 
        (df_resultado['media'] > corte_volume)
    ]
    
    if not candidatos_linear.empty:
        df_lineares = candidatos_linear.nsmallest(10, 'cv')
        ids_lineares = df_lineares['id_produto'].tolist()
        df_resultado.loc[df_resultado['id_produto'].isin(ids_lineares), 'classificacao'] = 'Estável/Linear'

    df_final = df_resultado[df_resultado['classificacao'] != 'Outros'].copy()
    df_final = df_final.sort_values(['classificacao', 'razao_pico'], ascending=[False, False])

    return df_final.to_dict(orient='records')


@router.get("/api/insights/strategy")
def get_strategic_insight():
    """
    Implementação Fiel de 'celula3.py': ABC-XYZ e Eficiência de Capital
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")

    df = df_raw_storage.copy()

    col_map = {
        'ds_item': 'ds_material_hospital', 
        'ds_grupo_material': 'ds_grupo',
        'ds_classe_material': 'ds_classe'
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    cols_agg = {
        'custo_total': 'sum',
        'qt_consumo': ['mean', 'std'],
        'qt_estoque': 'mean'
    }
    cols_existentes = [c for c in ['id_item', 'ds_material_hospital', 'ds_classe'] if c in df.columns]
    
    if 'custo_total' not in df.columns and 'custo_unitario' in df.columns and 'qt_consumo' in df.columns:
        df['custo_total'] = df['custo_unitario'] * df['qt_consumo']

    df_agg = df.groupby(cols_existentes).agg({
        k: v for k, v in cols_agg.items() if k in df.columns
    }).reset_index()

    df_agg.columns = [
        'id_item', 'ds_material', 'ds_classe', 
        'custo_total', 'consumo_medio', 'consumo_std', 'estoque_medio'
    ]
    
    df_agg = df_agg.fillna(0)
    df_agg = df_agg[df_agg['consumo_medio'] > 0].copy()

    # ABC
    df_agg = df_agg.sort_values('custo_total', ascending=False)
    df_agg['acumulado'] = df_agg['custo_total'].cumsum()
    total_custo = df_agg['custo_total'].sum()
    df_agg['perc_acumulado'] = df_agg['acumulado'] / total_custo if total_custo > 0 else 0

    def define_abc(x):
        if x <= 0.80: return 'A'
        elif x <= 0.95: return 'B'
        else: return 'C'

    df_agg['Classe_ABC'] = df_agg['perc_acumulado'].apply(define_abc)

    # XYZ
    df_agg['cv'] = df_agg['consumo_std'] / df_agg['consumo_medio']

    def define_xyz(x):
        if x <= 0.5: return 'X'
        elif x <= 1.0: return 'Y'
        else: return 'Z'

    df_agg['Classe_XYZ'] = df_agg['cv'].apply(define_xyz)

    matriz_counts = df_agg.pivot_table(
        index='Classe_ABC', 
        columns='Classe_XYZ', 
        values='id_item', 
        aggfunc='count'
    ).fillna(0).to_dict()

    # Eficiência
    df_agg['dias_cobertura'] = (df_agg['estoque_medio'] / df_agg['consumo_medio']) * 30
    df_agg['custo_unit_estimado'] = df_agg['custo_total'] / (df_agg['consumo_medio'] * 12)
    df_agg['valor_imobilizado'] = df_agg['estoque_medio'] * df_agg['custo_unit_estimado']

    df_agg = df_agg.replace([np.inf, -np.inf], 0).fillna(0)

    df_vis = df_agg[df_agg['dias_cobertura'] < 365].copy()
    zumbis = df_vis[df_vis['dias_cobertura'] > 90].sort_values('valor_imobilizado', ascending=False).head(5)

    return {
        "matrix": matriz_counts,
        "scatter_data": df_vis[[
            'id_item', 'ds_material', 'Classe_ABC', 'Classe_XYZ', 
            'dias_cobertura', 'valor_imobilizado', 'custo_total'
        ]].to_dict(orient='records'),
        "zombies": zumbis[[
            'id_item', 'ds_material', 'dias_cobertura', 
            'valor_imobilizado', 'Classe_ABC'
        ]].to_dict(orient='records')
    }

@router.get("/api/insights/inflation")
def get_inflation_insight():
    """
    Implementação Fiel de 'celula4.py': ANÁLISE DE INFLAÇÃO DE CUSTOS
    1. Identifica coluna de data.
    2. Agrupa preço médio por Mês e Item.
    3. Calcula variação (Inflação) entre primeiro e último preço do período.
    4. Filtra sanidade (aumento < 1000%).
    5. Retorna Top 5 e Histórico para plotagem.
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados no servidor")

    df = df_raw_storage.copy()
    
    # --- 1. Preparação de Dados ---
    col_data = 'dt_movimento_estoque'
    # Fallback se não achar o nome exato
    if col_data not in df.columns:
        for c in ['data', 'dt_movimento', 'dt_referencia']:
             if c in df.columns:
                col_data = c
                break
    
    if col_data not in df.columns:
        return {"top_items": [], "history": []}

    # Normalização de nomes
    col_map = {'ds_item': 'ds_material_hospital'}
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    
    # Garante nome do item
    if 'ds_material_hospital' not in df.columns:
        # Tenta pegar a primeira coluna de texto como nome
        cols_obj = df.select_dtypes(include=['object']).columns
        df['ds_material_hospital'] = df[cols_obj[0]] if len(cols_obj) > 0 else "Item " + df['id_item'].astype(str)

    # Converter data
    df[col_data] = pd.to_datetime(df[col_data], errors='coerce')
    df = df.dropna(subset=[col_data])

    # Criar Periodo Mensal
    df['mes_ref'] = df[col_data].dt.to_period('M')

    # Calcular Custo Unitário se não existir
    if 'custo_unitario' not in df.columns:
        df['custo_unitario'] = df['custo_total'] / df['qt_consumo'].replace(0, 1)

    # --- 2. Agrupamento Temporal ---
    # Filtra consumo/custo > 0
    df_valid = df[(df['qt_consumo'] > 0) & (df['custo_total'] > 0)].copy()

    if df_valid.empty:
         return {"top_items": [], "history": []}

    # Preço médio mensal por item
    df_hist = df_valid.groupby(
        ['id_item', 'ds_material_hospital', 'mes_ref']
    )['custo_unitario'].mean().reset_index()

    # Converter periodo para string/timestamp para retorno
    df_hist['mes_ref_dt'] = df_hist['mes_ref'].dt.to_timestamp()
    df_hist['data_str'] = df_hist['mes_ref_dt'].dt.strftime('%Y-%m-%d')

    # --- 3. Cálculo de Inflação ---
    
    def calcular_inflacao_item(subdf):
        subdf = subdf.sort_values('mes_ref')
        if len(subdf) < 2: 
            return 0.0
        
        preco_ini = subdf['custo_unitario'].iloc[0]
        preco_fim = subdf['custo_unitario'].iloc[-1]
        
        if preco_ini < 0.01: return 0.0 # Evita distorção com preço zero
        
        return ((preco_fim - preco_ini) / preco_ini) * 100

    # Aplica a função para cada item
    # Usamos groupby + apply. Para performance em datasets grandes, vetorizar seria ideal,
    # mas o apply mantém a lógica exata do notebook.
    resultados_inflacao = df_hist.groupby(['id_item', 'ds_material_hospital']).apply(calcular_inflacao_item)
    
    # Transforma Series em DataFrame
    df_inflacao = resultados_inflacao.reset_index(name='inflacao_acumulada')

    # Filtro de Sanidade (< 1000%)
    df_inflacao = df_inflacao[df_inflacao['inflacao_acumulada'] < 1000]

    # Top 5
    top_inflacao = df_inflacao.sort_values('inflacao_acumulada', ascending=False).head(5)
    
    # --- 4. Preparar Dados para o Gráfico ---
    # Pegamos o histórico apenas dos top 5 itens
    top_ids = top_inflacao['id_item'].tolist()
    df_plot = df_hist[df_hist['id_item'].isin(top_ids)].copy()

    # Retorno estruturado
    return {
        "top_items": top_inflacao.to_dict(orient='records'),
        "history": df_plot[['id_item', 'ds_material_hospital', 'data_str', 'custo_unitario']].to_dict(orient='records')
    }