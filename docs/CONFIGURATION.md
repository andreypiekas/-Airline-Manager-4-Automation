# Configuração completa

Esta é a referência de **Secrets, inputs e GitHub Actions Variables** do workflow principal `.github/workflows/playwright.yml`.

## Secrets

| Nome | Obrigatório | Descrição |
| --- | --- | --- |
| `EMAIL` | Sim | Login web do Airline Manager 4 |
| `PASSWORD` | Sim | Senha da conta do jogo |
| `TELEGRAM_BOT_TOKEN` | Não | Token do bot do Telegram |
| `TELEGRAM_CHAT_ID` | Não | ID da conversa privada ou grupo |

O Chat ID é o destino da mensagem. Não use o ID do próprio bot.

## Inputs de workflow_dispatch

| Input | Tipo | Padrão | Regra |
| --- | --- | --- | --- |
| `departure_mode` | choice | `production` | `simulation` força leitura/simulação das mutações |
| `execute_individual` | boolean | `true` | Compatibilidade com versões anteriores |
| `max_individual_departures` | number | `0` | 0 usa a Variable; 1–20 sobrescreve |
| `aktifkan_random_delay` | boolean | `false` | Atraso aleatório opcional |
| `paksa_simpan_video` | boolean | `false` | Diagnóstico opcional |

O resolvedor aceita `0.0`, `1.0`, `2.0` como inteiros equivalentes e rejeita valores fracionários ou notação exponencial.

## Execução e persistência

| Variable | Padrão efetivo | Descrição |
| --- | --- | --- |
| `EXECUTE_INDIVIDUAL` | `true` | Política de compatibilidade para executor individual |
| `MAX_INDIVIDUAL_DEPARTURES` | `20` | Limite quando o input é 0; hard cap 20 |
| `RETURN_JOURNAL_SCOPE` | `am4-prod` | Namespace do journal persistente |
| `AIRLINE_BASES_JSON` | `["XAP","GRU","DTW"]` | Bases usadas para resolução operacional de origem |
| `AIRCRAFT_ORIGINS_JSON` | `[]` | Overrides explícitos por aircraftId |
| `ROUTE_REVIEW_TIMEZONE` | `America/Sao_Paulo` | Fuso lógico da revisão diária |

Exemplo de `AIRCRAFT_ORIGINS_JSON`:

```json
[
  {"aircraftId":"123456","origin":"GRU"},
  {"aircraftId":"654321","origin":"DTW"}
]
```

Use ID estável de aeronave; matrícula não é chave de identidade.

## Demanda

| Variable | Padrão | Regra |
| --- | ---: | --- |
| `MIN_DEMAND_PERCENTAGE` | `80` | >0 e <=100 |
| `DEMAND_THRESHOLD_MODE` | `aggregate` | `aggregate` ou `per-class` |
| `DEMAND_POOL_SCOPE` | `airport-pair` | Produção usa política conservadora |
| `DEMAND_MAX_AGE_SECONDS` | `300` | Observação antiga bloqueia ação |
| `DEMAND_PROLONGED_HOLD_MINUTES` | `180` | Janela para alerta de HOLD prolongado |

O threshold adaptativo usa somente histórico verificado e nunca reduz o piso configurado.

## Route research / route review / reroute

| Variable | Padrão | Descrição |
| --- | ---: | --- |
| `ENABLE_ROUTE_RESEARCH` | `true` | Pesquisa controlada de candidatos |
| `ROUTE_RESEARCH_MAX_AIRCRAFT` | `3` | Aeronaves pesquisadas por run |
| `ROUTE_RESEARCH_MAX_SUGGESTIONS` | `5` | Sugestões nativas inspecionadas por aeronave |
| `ROUTE_RESERVATION_NEXT_LEGS` | `2` | Horizonte conservador de reservas futuras |
| `ROUTE_RESERVATION_POOL_SCOPE` | `airport-pair` | Pool do cenário de planejamento |
| `ENABLE_ROUTE_OPTIMIZER` | `true` | Habilita route review |
| `ROUTE_MIN_OCCUPANCY_PERCENT` | `80` | Piso de ocupação do cenário econômico |
| `ROUTE_MIN_IMPROVEMENT_PERCENT` | `0` | Melhora mínima exigida |
| `ENABLE_ROUTE_EXECUTION` | `true` em produção | Executor real; false em simulation |
| `ROUTE_MAX_REROUTES_PER_RUN` | `1` | Runtime aceita 1–5 |

`ENABLE_ROUTE_EXECUTION=true` não é autorização suficiente: o executor ainda exige ACK interno, primeira tentativa do Actions, repositório correto, produção real, comparação completa, fingerprint fresco e gates de mutação.

## Pricing

| Variable | Padrão | Descrição |
| --- | ---: | --- |
| `ENABLE_TICKET_PRICING` | `true` | Coleta e cálculo |
| `ENABLE_TICKET_PRICING_EXECUTION` | `true` em produção | Save real; false em simulation |
| `TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN` | `5` | Máximo de Saves por run |

Política:

```text
Y = Auto × 1,10
J = Auto × 1,08
F = Auto × 1,06
```

Todo Save exige confirmação fresca posterior.

## Fuel / CO₂

| Variable | Padrão | Descrição |
| --- | ---: | --- |
| `ENABLE_FUEL` | `true` | Controla Fuel e CO₂ |
| `MAX_FUEL_PRICE` | `550` | Teto de preço live por 1.000 |
| `MAX_CO2_PRICE` | `120` | Teto de preço live por 1.000 |
| `MAX_FUEL_PURCHASE_PER_RUN` | vazio / `0` | 0 = capacidade disponível |
| `MAX_CO2_PURCHASE_PER_RUN` | vazio / `0` | 0 = capacidade disponível |
| `MIN_CASH_RESERVE` | `0` | Caixa mínimo preservado |

A compra exige `preço < teto`. Igualdade não compra.

## Manutenção e campanhas

| Variable | Padrão | Descrição |
| --- | ---: | --- |
| `ENABLE_MAINTENANCE` | `true` | Manutenção e A-check |
| `REPAIR_WEAR` | `30` | Threshold de desgaste |
| `HOURS_CHECK` | `20` | Threshold de horas |
| `ENABLE_CAMPAIGN` | `true` | Campanhas |
| `INCREASE_AIRLINE_REPUTATION` | `true` | Política de reputação |
| `CAMPAIGN_TYPE` | `1` | Tipo de campanha |
| `CAMPAIGN_DURATION` | `4` | Duração |
| `ENABLE_DEPART` | `true` | Fase de decolagem em produção |

## Telegram e compatibilidade

O workflow principal fixa o notifier agregado como ativo. Não é necessário criar `DEMAND_TELEGRAM_ENABLED` como Variable; sem os Secrets do Telegram, a etapa apenas não consegue enviar.

`ALERT_CASH_ABOVE` pertence ao notifier legado e não governa o resumo agregado atual.

## Configuração recomendada

```text
RETURN_JOURNAL_SCOPE=am4-prod
MAX_INDIVIDUAL_DEPARTURES=20

MIN_DEMAND_PERCENTAGE=80
DEMAND_THRESHOLD_MODE=aggregate
DEMAND_POOL_SCOPE=airport-pair
DEMAND_MAX_AGE_SECONDS=300

MAX_FUEL_PRICE=550
MAX_CO2_PRICE=120
MIN_CASH_RESERVE=0

ENABLE_ROUTE_RESEARCH=true
ROUTE_RESEARCH_MAX_AIRCRAFT=3
ROUTE_RESEARCH_MAX_SUGGESTIONS=5
ROUTE_RESERVATION_NEXT_LEGS=2
ROUTE_RESERVATION_POOL_SCOPE=airport-pair
ENABLE_ROUTE_OPTIMIZER=true
ENABLE_ROUTE_EXECUTION=true
ROUTE_MAX_REROUTES_PER_RUN=1

ENABLE_TICKET_PRICING=true
ENABLE_TICKET_PRICING_EXECUTION=true
TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN=5

ENABLE_FUEL=true
ENABLE_MAINTENANCE=true
ENABLE_CAMPAIGN=true
ENABLE_DEPART=true
```

O projeto possui defaults seguros para várias opções omitidas, mas em produção é preferível declarar explicitamente as políticas críticas.
