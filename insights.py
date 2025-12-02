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
    # A ordem depende de como o pandas agrega, vamos forçar nomes padrão
    # Nota: A ordem aqui assume que todas as colunas existiam. Para robustez:
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
    Aplica a lógica de Sazonalidade vs Linearidade (Notebook Snippet 39/49):
    1. Filtra Medicamentos.
    2. Remove itens com pouco histórico (< 6 meses) ou baixo volume (< 10 un).
    3. Calcula Razão de Pico (Max/Media) e CV.
    4. Identifica Top Sazonais (Maiores picos).
    5. Identifica Top Lineares (Menores CVs entre itens de alto volume).
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

    # 1. Filtrar Medicamentos (Conforme análise do notebook que foca em medicamentos)
    if 'ds_grupo' in df.columns:
        # Filtra onde contém 'MEDICAMENTO'
        df_meds = df[df['ds_grupo'].str.upper().str.contains('MEDICAMENTO', na=False)].copy()
        if len(df_meds) == 0: 
            # Se o filtro retornar vazio (ex: nomes de grupo diferentes), usa o DF inteiro como fallback
            df_meds = df.copy()
    else:
        df_meds = df.copy()

    # Cria coluna periodo para ordenação temporal
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

        # Regra de Exclusão do Notebook: Pouco histórico ou volume irrelevante
        if len(dados) < 6 or media < 10:
            continue

        # Métrica Sazonalidade (Pico)
        pico_max = dados['qt_consumo'].max()
        razao_pico = pico_max / media if media > 0 else 0

        # Métrica Estabilidade (CV)
        cv = dados['qt_consumo'].std() / media if media > 0 else 0

        # Histórico para o gráfico
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
    
    # Top Sazonais (Maiores Picos)
    df_sazonais = df_resultado.nlargest(10, 'razao_pico')
    ids_sazonais = df_sazonais['id_produto'].tolist()
    df_resultado.loc[df_resultado['id_produto'].isin(ids_sazonais), 'classificacao'] = 'Sazonal/Pico'

    # Top Lineares (Menor variação, com volume relevante)
    corte_volume = df_resultado['media'].quantile(0.4) # Ignora os 40% menores volumes
    candidatos_linear = df_resultado[
        (~df_resultado['id_produto'].isin(ids_sazonais)) & 
        (df_resultado['media'] > corte_volume)
    ]
    
    if not candidatos_linear.empty:
        df_lineares = candidatos_linear.nsmallest(10, 'cv')
        ids_lineares = df_lineares['id_produto'].tolist()
        df_resultado.loc[df_resultado['id_produto'].isin(ids_lineares), 'classificacao'] = 'Estável/Linear'

    # Retorna apenas os classificados relevantes para o Dashboard
    df_final = df_resultado[df_resultado['classificacao'] != 'Outros'].copy()
    
    # Ordenação para exibição: Sazonais primeiro
    df_final = df_final.sort_values(['classificacao', 'razao_pico'], ascending=[False, False])

    return df_final.to_dict(orient='records')


@router.get("/api/insights/strategy")
def get_strategic_insight():
    """
    Implementação Fiel de 'celula3.py':
    1. Matriz ABC-XYZ (Classificação por Valor acumulado e Previsibilidade).
    2. Eficiência de Capital (Dias de Cobertura x Valor Imobilizado).
    3. Lista de 'Zumbis' (Excesso > 90 dias).
    """
    if df_raw_storage is None:
        raise HTTPException(status_code=500, detail="Dados não carregados")

    df = df_raw_storage.copy()

    # Normalização de nomes (igual ao notebook)
    col_map = {
        'ds_item': 'ds_material_hospital', 
        'ds_grupo_material': 'ds_grupo',
        'ds_classe_material': 'ds_classe'
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # --- 1. PREPARAR DADOS AGREGADOS (Conforme celula3.py) ---
    # Garante colunas necessárias
    cols_agg = {
        'custo_total': 'sum',
        'qt_consumo': ['mean', 'std'],
        'qt_estoque': 'mean'
    }
    # Filtra colunas que realmente existem no DF
    cols_existentes = [c for c in ['id_item', 'ds_material_hospital', 'ds_classe'] if c in df.columns]
    
    # Se faltar alguma coluna essencial, cria fallback
    if 'custo_total' not in df.columns and 'custo_unitario' in df.columns and 'qt_consumo' in df.columns:
        df['custo_total'] = df['custo_unitario'] * df['qt_consumo']

    df_agg = df.groupby(cols_existentes).agg({
        k: v for k, v in cols_agg.items() if k in df.columns
    }).reset_index()

    # Ajustar nomes das colunas (Flattening MultiIndex)
    # A ordem exata depende da versão do pandas, então vamos renomear com segurança
    df_agg.columns = [
        'id_item', 'ds_material', 'ds_classe', 
        'custo_total', 'consumo_medio', 'consumo_std', 'estoque_medio'
    ]
    
    df_agg = df_agg.fillna(0)
    df_agg = df_agg[df_agg['consumo_medio'] > 0].copy()

    # --- PARTE A: MATRIZ ABC-XYZ ---
    
    # Passo A1: Classificação ABC (Por Valor)
    df_agg = df_agg.sort_values('custo_total', ascending=False)
    df_agg['acumulado'] = df_agg['custo_total'].cumsum()
    total_custo = df_agg['custo_total'].sum()
    df_agg['perc_acumulado'] = df_agg['acumulado'] / total_custo if total_custo > 0 else 0

    def define_abc(x):
        if x <= 0.80: return 'A'
        elif x <= 0.95: return 'B'
        else: return 'C'

    df_agg['Classe_ABC'] = df_agg['perc_acumulado'].apply(define_abc)

    # Passo A2: Classificação XYZ (Por Previsibilidade/CV)
    df_agg['cv'] = df_agg['consumo_std'] / df_agg['consumo_medio']

    def define_xyz(x):
        if x <= 0.5: return 'X'
        elif x <= 1.0: return 'Y'
        else: return 'Z'

    df_agg['Classe_XYZ'] = df_agg['cv'].apply(define_xyz)

    # Dados para Heatmap (Contagem)
    matriz_counts = df_agg.pivot_table(
        index='Classe_ABC', 
        columns='Classe_XYZ', 
        values='id_item', 
        aggfunc='count'
    ).fillna(0).to_dict()

    # --- PARTE B: CAÇA AO DINHEIRO PARADO (EFICIÊNCIA) ---

    # Passo B1: Calcular Dias de Cobertura
    # (df_agg['estoque_medio'] / df_agg['consumo_medio']) * 30
    df_agg['dias_cobertura'] = (df_agg['estoque_medio'] / df_agg['consumo_medio']) * 30

    # Estimativa do Valor Imobilizado
    # custo_unit_estimado = custo_total / (consumo_medio * 12)
    # valor_imobilizado = estoque_medio * custo_unit_estimado
    df_agg['custo_unit_estimado'] = df_agg['custo_total'] / (df_agg['consumo_medio'] * 12)
    df_agg['valor_imobilizado'] = df_agg['estoque_medio'] * df_agg['custo_unit_estimado']

    # Limpeza de Infinitos/NaN
    df_agg = df_agg.replace([np.inf, -np.inf], 0).fillna(0)

    # Filtro visual (igual ao celula3.py: dias_cobertura < 365 para o gráfico)
    df_vis = df_agg[df_agg['dias_cobertura'] < 365].copy()

    # Listar os "Zumbis" ( > 90 dias, Top 5 valor imobilizado)
    zumbis = df_vis[df_vis['dias_cobertura'] > 90].sort_values('valor_imobilizado', ascending=False).head(5)

    return {
        "matrix": matriz_counts, # Estrutura: {'X': {'A': 10, 'B': 5...}, 'Y': ...}
        "scatter_data": df_vis[[
            'id_item', 'ds_material', 'Classe_ABC', 'Classe_XYZ', 
            'dias_cobertura', 'valor_imobilizado', 'custo_total'
        ]].to_dict(orient='records'),
        "zombies": zumbis[[
            'id_item', 'ds_material', 'dias_cobertura', 
            'valor_imobilizado', 'Classe_ABC'
        ]].to_dict(orient='records')
    }