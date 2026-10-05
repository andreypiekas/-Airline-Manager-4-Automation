# Rotas e Pricing PAX

Este documento descreve três módulos relacionados, mas independentes: **pricing**, **route review** e **reroute**.

## Pricing PAX

A referência é sempre o **Auto Price nativo observado na rota**.

```text
Y = Auto × 1.10
J = Auto × 1.08
F = Auto × 1.06
```

O resultado é arredondado para baixo ao múltiplo de 10.

Classes sem assentos não recebem valor para Save.

### Fluxo

1. validar aeronave, rota e idade da observação;
2. ler o controle Auto sem executar seu JavaScript;
3. calcular o alvo;
4. comparar com o preço atual;
5. salvar somente quando autorizado;
6. reler a rota;
7. confirmar que os valores persistiram.

Preço já correto resulta em `unchanged`/equivalente e não provoca Save. Resultado incerto entra em quarentena e não é repetido automaticamente.

## Route review

A revisão exige uma **origem operacional** confiável para a aeronave.

A origem pode vir de:

- override explícito por `aircraftId`; ou
- uma única base da companhia presente na rota atual.

Rotas entre duas bases ou sem base identificável exigem evidência adicional.

### Gatilhos

A revisão pode ocorrer:

- após retorno confirmado à própria base; ou
- uma vez ao dia quando a aeronave é observada em solo na própria base.

Estar apenas em solo não prova um retorno.

## Candidatos

Um candidato econômico precisa conter evidências suficientes sobre:

- ida e volta;
- distância e duração;
- alcance e pista;
- demanda restante por classe;
- reservas de outras aeronaves;
- Auto Price por trecho;
- ocupação esperada;
- custos do ciclo;
- custo de criação/troca;
- idade da observação.

Dados ausentes permanecem ausentes. Não são preenchidos com zero.

## Decisões

| Decisão | Significado |
| --- | --- |
| `keep_route` | rota atual permanece melhor ou equivalente dentro da comparação |
| `hold` | não existe evidência suficiente para troca |
| `would_reroute` | candidata superior encontrada, ainda sujeita ao executor |
| `already_reviewed` | evento diário/retorno já consumido |
| `unavailable` | contexto insuficiente |

## Reroute

O executor real é fail-closed.

Uma troca exige, além da recomendação:

- comparação suficientemente completa;
- `comparisonReady=true`;
- `mutationAuthorized=true`;
- alvo nativo ainda fresco;
- identidade da aeronave/rota confirmada;
- limite por run disponível;
- primeira tentativa do GitHub Actions run;
- orçamento de tempo suficiente.

Sugestões limitadas do jogo não são tratadas como prova do melhor destino global.

Após um reroute confirmado, o pricing da rota anterior é descartado. A nova rota precisa fornecer um novo Auto Price antes de qualquer ajuste de tarifa.

## Configuração

```text
ENABLE_TICKET_PRICING=true
ENABLE_TICKET_PRICING_EXECUTION=true
TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN=5

ENABLE_ROUTE_RESEARCH=true
ROUTE_RESEARCH_MAX_AIRCRAFT=3
ROUTE_RESEARCH_MAX_SUGGESTIONS=5

ENABLE_ROUTE_OPTIMIZER=true
ROUTE_MIN_OCCUPANCY_PERCENT=80
ROUTE_MIN_IMPROVEMENT_PERCENT=0

ENABLE_ROUTE_EXECUTION=true
ROUTE_MAX_REROUTES_PER_RUN=1
```

Route review e reroute continuam dependentes de evidência econômica verificada; o executor não força uma troca apenas para testar o caminho de mutação.
