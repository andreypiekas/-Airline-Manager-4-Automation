# Demand Manager

O Demand Manager separa **análise de demanda** de **execução de departure**. Uma decisão analítica nunca autoriza um clique sozinha.

## Objetivo

Antes de uma decolagem, o sistema valida:

- identidade única da aeronave e da rota;
- estado atual;
- capacidade por classe Y/J/F;
- demanda restante e total diário;
- idade da observação;
- consistência do pool compartilhado;
- threshold configurado ou adaptativo.

## Cálculo

Para cada classe:

```text
possible[c] = min(capacity[c], availableDemand[c])
```

No modo `aggregate`:

```text
required = ceil(totalSeats × threshold / 100)
```

A aeronave é elegível quando a soma de passageiros possíveis atinge o limite. No modo `per-class`, o threshold é exigido separadamente para cada classe que possui assentos.

Classes sem assentos não bloqueiam a análise.

## Pools de demanda

O padrão de produção é:

```text
DEMAND_POOL_SCOPE=airport-pair
```

Os dois sentidos do mesmo par de aeroportos compartilham o pool conservador. Durante uma run, a demanda já reservada para uma aeronave é descontada das próximas.

Quando leituras do mesmo pool apresentam totais diários incompatíveis, o sistema bloqueia a autorização em vez de escolher uma delas.

## Threshold adaptativo

O piso inicial é `MIN_DEMAND_PERCENTAGE`.

Histórico verificado pode aumentar esse limite para uma combinação aeronave/rota. Evidência insuficiente não reduz o threshold configurado.

## Estados principais

| Decisão | Significado |
| --- | --- |
| `would_depart` | demanda suficiente na análise |
| `hold_insufficient` | demanda abaixo do limite |
| `hold_unavailable` | dados insuficientes ou inconsistentes |
| `not_ready` | aeronave não está pronta para nova decolagem |

`would_depart` ainda não significa que haverá clique: o executor real aplica gates adicionais.

## Execução real

A produção exige, entre outros requisitos:

- `ENABLE_DEMAND_MANAGER=true`;
- `DEMAND_FAIL_SAFE=true`;
- `DEMAND_DRY_RUN=false`;
- `DEMAND_POOL_SCOPE=airport-pair`;
- primeira tentativa do GitHub Actions run;
- execução dentro de um repositório GitHub Actions válido, incluindo forks;
- contexto fresco imediatamente antes da mutação;
- ausência de quarentena impeditiva;
- orçamento de tempo suficiente.

O ACK interno de departure mantém o nome legado `individual-return-legs-v1`, mas o executor atual é **base-agnostic para rotas existentes**.

Não existe fallback para `departAll`.

## Fail-safe

Dados ausentes, negativos, fracionários onde inteiros são exigidos, expirados, duplicados ou inconsistentes nunca são convertidos em autorização.

Uma coleção global incompleta bloqueia departures. Uma tentativa cujo resultado não possa ser confirmado entra em estado incerto e não recebe retry automático.

## Relatórios

A análise grava `demand-report.json/.md`.

A execução real grava `execution-report.json/.md`, incluindo:

- aeronaves avaliadas;
- departures confirmadas;
- HOLDs;
- resultados incertos;
- motivo por alvo;
- demanda utilizada;
- passageiros embarcados quando confirmados.

Veja [PRODUCTION_DEPARTURES.md](PRODUCTION_DEPARTURES.md) para o executor real.
