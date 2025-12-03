# Desafio Unimed 🏥

> **Resumo:** Um dashboard de inteligência de estoque hospitalar que utiliza algoritmos de Machine Learning (K-Means) para otimizar compras, prevenir rupturas e identificar ineficiências financeiras.

## Tabela de Conteúdos
* [Sobre o Projeto](#sobre-o-projeto)
* [Funcionalidades](#funcionalidades)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Instalação e Execução](#instalação-e-execução)
* [Como Usar](#como-usar)
* [Arquitetura dos Insights](#arquitetura-dos-insights)
* [Créditos](#créditos)

## Sobre o Projeto

A gestão de estoque hospitalar é crítica: a falta de um item pode custar vidas, enquanto o excesso drena recursos financeiros. O **Stock Insight Hub** resolve esse problema indo além das planilhas simples.

* **Motivação:** A necessidade de categorizar milhares de itens (medicamentos, OPME, materiais) não apenas por nome, mas pelo comportamento de consumo e impacto financeiro.
* **Solução:** O sistema processa dados históricos e aplica clusterização automática para sugerir estratégias de reposição (ex: itens sazonais vs. lineares).
* **Destaque:** O uso da **Matriz Estratégica (ABC-XYZ)** combinada com análise de "Itens Zumbis" (estoque parado) e detecção automática de inflação de preços.

## Funcionalidades

O sistema é dividido em módulos de inteligência:

- [x] **Análise de Clusters (K-Means):** Agrupa itens automaticamente em perfis (ex: "Alto Giro/Baixo Custo", "Item Crítico") sem necessidade de classificação manual.
- [x] **Detector de Risco de Ruptura:** Cruza a variabilidade da demanda (CV) com a cobertura de estoque atual para alertar sobre itens instáveis prestes a acabar.
- [x] **Matriz ABC-XYZ:** Classifica itens pela importância financeira (A, B, C) e previsibilidade de demanda (X, Y, Z).
- [x] **Análise de Sazonalidade:** Identifica itens com picos de consumo em meses específicos vs. itens de consumo linear.
- [x] **Eficiência Financeira ("Zumbis"):** Detecta itens com capital imobilizado excessivo e baixo giro (> 90 dias de cobertura).
- [x] **Monitor de Inflação:** Rastreia a variação do custo unitário médio para identificar aumentos abusivos de fornecedores.

## Tecnologias Utilizadas

**Frontend:**
* **React + Vite:** Para uma interface rápida e responsiva.
* **TypeScript:** Para segurança de tipagem.
* **Tailwind CSS + shadcn/ui:** Para um design system moderno e limpo.
* **Recharts:** Para visualização de dados (gráficos de dispersão, linhas e áreas).
* **React Query:** Para gerenciamento de estado assíncrono.

**Backend (API de Insights):**
* **Python:** Linguagem base para análise de dados.
* **FastAPI:** Framework para servir os dados ao frontend.
* **Pandas & NumPy:** Manipulação e agregação de dados.
* **Scikit-learn:** Implementação do algoritmo K-Means e padronização de dados (StandardScaler).

## Instalação e Execução

O projeto funciona em duas partes: o servidor Python (Backend) e a interface React (Frontend).

### Pré-requisitos
* Node.js (v18+)
* Python (3.9+)

### Passo 1: Rodar o Backend (API)

1. Entre na pasta raiz do projeto.
2. Instale as dependências Python:
   ```bash
   pip install pandas numpy scikit-learn fastapi uvicorn
    ```

3.  Execute o servidor:
    ```bash
    python server.py
    ```
    *O servidor rodará em `http://0.0.0.0:8000`. Se o arquivo de dados `df_analise.csv.gz` não for encontrado, o sistema gerará dados sintéticos automaticamente para testes.*

### Passo 2: Rodar o Frontend

1.  Em um novo terminal, na pasta do projeto:
    ```bash
    npm install
    ```
2.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
3.  Acesse `http://localhost:8080` (ou a porta indicada no terminal) no seu navegador.

## Como Usar

### Navegação Principal

  * **Visão Geral:** Dashboard com KPIs macro (Valor total em estoque, número de grupos ativos).
  * **Análise de Clusters:** Veja como o algoritmo agrupou seus itens. Use isso para definir políticas de compra em massa para grupos de "Baixo Valor/Alto Giro".
  * **Insights (Aba Principal):**
      * **Risco:** Foco nos itens vermelhos do gráfico de dispersão. Eles têm alta variabilidade e baixo estoque.
      * **Sazonalidade:** Compare a linha laranja (ano atual) com a cinza (ano anterior) para prever picos.
      * **Matriz Estratégica:** Dê atenção máxima aos itens **"AZ"** (Alto Custo, Baixa Previsibilidade). Não use reposição automática neles\!
      * **Eficiência:** Identifique os "Zumbis" (tabela inferior) e considere liquidação ou doação para liberar capital.

### Arquitetura dos Insights

O backend (`insights.py`) processa os dados seguindo estas lógicas de negócio:

1.  **Normalização:** Padroniza nomes de colunas (`ds_item` -\> `ds_material_hospital`).
2.  **Cálculo de Métricas:** Gera Cobertura (Estoque / Consumo Médio) e CV (Desvio Padrão / Média).
3.  **Regras de Negócio:**
      - *Crítico:* CV \> 0.8 e Cobertura \< 1 mês.
      - *Inflação:* Variação de preço \> 0% e \< 1000% (filtro de sanidade).

> **⚠️ Observação Importante:**
> Para garantir a qualidade estatística dos insights, foram considerados apenas os grupos com **mais de 10 itens**.
>
> Caso apareça na dashboard algum grupo contendo apenas um cluster (geralmente Cluster 0), ele pertence a essa categoria de baixa amostragem e **não deve ser considerado** na análise de perfis, pois não passou pelo processamento do algoritmo K-Means.

## Créditos

  * **Desenvolvedores:** Vinicius Hashizume, Maurice Santos, Nicolas Motta
  * **Bibliotecas:** Este projeto utiliza componentes open-source da comunidade React e Python.

