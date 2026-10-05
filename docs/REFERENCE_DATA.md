# Dados de referência

O diretório `data/reference/` contém catálogos e referências estáticas usadas para cruzamentos, diagnóstico e pesquisa.

> [!IMPORTANT]
> Dados estáticos **não autorizam mutações**. Produção depende de observações live e dos gates de cada módulo.

## Aeroportos

`airports.json` contém o catálogo usado para converter IDs nativos observados no AM4 em códigos IATA quando a correspondência é única e não conflitante.

Esse catálogo suporta a descoberta dinâmica de hubs.

## Aeronaves e rotas

Referências de modelos e rotas podem ser usadas para:

- validar alcance;
- organizar candidatos;
- comparar identificadores;
- produzir diagnósticos;
- orientar pesquisa.

Elas não substituem:

- demanda restante;
- Auto Price atual;
- custos operacionais atuais;
- estado real da aeronave;
- controles nativos da interface.

Uma lista de candidatos baseada em referência não é garantia de melhor rota global.

## Fuel e CO₂

Calendários de preço armazenados em `data/reference/` são somente referência.

O módulo de compra exige preço live. Uma previsão, OCR ou tabela externa nunca substitui essa leitura.

## Pricing

Referências históricas ajudaram a validar os multiplicadores PAX implementados no código:

```text
Y = Auto × 1.10
J = Auto × 1.08
F = Auto × 1.06
```

A fonte operacional continua sendo o Auto Price observado na rota ativa.

## Reprodutibilidade

Quando scripts de importação forem usados, preserve:

- origem do arquivo;
- hash;
- schema produzido;
- conflitos encontrados;
- indicador de verificação.

OCR deve permanecer marcado como não verificado até conferência independente.

## Cadeia de autorização

Nenhuma referência estática deve, isoladamente, definir:

- `mutationAuthorized=true`;
- `comparisonReady=true`;
- autorização de compra;
- autorização de departure;
- autorização de reroute.
