# Configuração

Referência dos principais Secrets, inputs e GitHub Actions Variables usados pelo workflow `.github/workflows/playwright.yml`.

Para um passo a passo desde o GitHub Settings até o agendamento externo, consulte [GITHUB_AND_CRON_SETUP.md](GITHUB_AND_CRON_SETUP.md).

> [!NOTE]
> Para instalações públicas, configure explicitamente os valores específicos da sua companhia. Não dependa de fallbacks internos de compatibilidade do repositório.

## Secrets

| Nome | Obrigatório | Uso |
| --- | --- | --- |
| `EMAIL` | Sim | Login no Airline Manager 4 |
| `PASSWORD` | Sim | Senha da conta |
| `TELEGRAM_BOT_TOKEN` | Não | Token do bot de notificações |
| `TELEGRAM_CHAT_ID` | Não | ID da conversa ou grupo |

## Inputs de workflow_dispatch

| Input | Padrão | Uso |
| --- | --- | --- |
| `departure_mode` | `production` | `production` ou `simulation` |
| `execute_individual` | `true` | Compatibilidade com versões anteriores |
| `max_individual_departures` | `0` | `0` usa a Variable; 1–20 sobrescreve |
| `aktifkan_random_delay` | `false` | Atraso aleatório opcional |
| `paksa_simpan_video` | `false` | Gravação de vídeo para diagnóstico |

Entradas numéricas equivalentes a inteiros podem chegar pelo GitHub como `0.0`, `1.0` etc. Valores fracionários ou notação exponencial são rejeitados pelos resolvedores críticos.

## Execução e estado

| Variable | Valor recomendado | Descrição |
| --- | --- | --- |
| `RETURN_JOURNAL_SCOPE` | `am4-prod` | Namespace do estado persistente |
| `MAX_INDIVIDUAL_DEPARTURES` | `20` | Máximo por run; hard cap 20 |
| `AIRLINE_BASES_JSON` | definir explicitamente | Fallback de hubs para funções que exigem origem operacional |
| `AIRCRAFT_ORIGINS_JSON` | `[]` | Overrides explícitos por `aircraftId` |
| `ROUTE_REVIEW_TIMEZONE` | `America/Sao_Paulo` | Fuso da revisão diária |

Exemplo genérico:

```text
AIRLINE_BASES_JSON=["AAA","BBB"]
AIRCRAFT_ORIGINS_JSON=[{"aircraftId":"123456","origin":"AAA"}]
```

Use IDs estáveis de aeronave. Matrícula não é a chave de identidade.

### Descoberta dinâmica de hubs

A fonte principal é a própria interface do AM4:

```text
research_main.php → #hubSelect
```

Os IDs observados são cruzados com `data/reference/airports.json`. A lista live só é adotada quando todos os hubs podem ser resolvidos de forma única.

Se a leitura live falhar, o sistema pode recorrer ao fallback configurado. Esse conjunto é usado por **origem operacional, route review e reroute**.

Ele **não limita decolagens em rotas existentes**: o executor de departure é base-agnostic.

## Demanda

| Variable | Padrão | Regra |
| --- | ---: | --- |
| `MIN_DEMAND_PERCENTAGE` | `80` | > 0 e <= 100 |
| `DEMAND_THRESHOLD_MODE` | `aggregate` | `aggregate` ou `per-class` |
| `DEMAND_POOL_SCOPE` | `airport-pair` | Produção exige política conservadora |
| `DEMAND_MAX_AGE_SECONDS` | `300` | Máximo 3600 |
| `DEMAND_PROLONGED_HOLD_MINUTES` | `180` | Janela para alerta de HOLD prolongado |

O threshold adaptativo pode aumentar o piso com histórico verificado; ele não reduz o valor configurado com evidência fraca.

## Route research, review e reroute

| Variable | Padrão | Uso |
| --- | ---: | --- |
| `ENABLE_ROUTE_RESEARCH` | `true` | Pesquisa controlada de candidatos |
| `ROUTE_RESEARCH_MAX_AIRCRAFT` | `3` | Aeronaves pesquisadas por run |
| `ROUTE_RESEARCH_MAX_SUGGESTIONS` | `5` | Sugestões inspecionadas por aeronave |
| `ROUTE_RESERVATION_NEXT_LEGS` | `2` | Horizonte de reservas |
| `ROUTE_RESERVATION_POOL_SCOPE` | `airport-pair` | Escopo de planejamento |
| `ENABLE_ROUTE_OPTIMIZER` | `true` | Habilita route review |
| `ROUTE_MIN_OCCUPANCY_PERCENT` | `80` | Piso econômico |
| `ROUTE_MIN_IMPROVEMENT_PERCENT` | `0` | Melhora mínima exigida |
| `ENABLE_ROUTE_EXECUTION` | `true` em produção | Habilita executor real |
| `ROUTE_MAX_REROUTES_PER_RUN` | `1` | Limite de reroutes |

Habilitar o executor não autoriza uma troca sozinho. O runtime ainda exige contexto correto, comparação completa, alvo fresco e gates como `comparisonReady` e `mutationAuthorized`.

## Pricing PAX

| Variable | Padrão | Uso |
| --- | ---: | --- |
| `ENABLE_TICKET_PRICING` | `true` | Leitura e cálculo |
| `ENABLE_TICKET_PRICING_EXECUTION` | `true` em produção | Save real |
| `TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN` | `5` | Máximo de ajustes |

Política:

```text
Y = Auto × 1.10
J = Auto × 1.08
F = Auto × 1.06
```

Todo Save exige releitura posterior.

## Fuel e CO₂

| Variable | Padrão | Uso |
| --- | ---: | --- |
| `ENABLE_FUEL` | `true` | Controla Fuel e CO₂ |
| `MAX_FUEL_PRICE` | `550` | Teto exclusivo por 1.000 lbs |
| `MAX_CO2_PRICE` | `120` | Teto exclusivo por 1.000 quotas |
| `MAX_FUEL_PURCHASE_PER_RUN` | `0` | 0 = capacidade disponível |
| `MAX_CO2_PURCHASE_PER_RUN` | `0` | 0 = capacidade disponível |
| `MIN_CASH_RESERVE` | `0` | Reserva mínima de caixa |

A compra exige `preço < teto`; igualdade não compra.

## Manutenção e campanhas

| Variable | Padrão |
| --- | ---: |
| `ENABLE_MAINTENANCE` | `true` |
| `REPAIR_WEAR` | `30` |
| `HOURS_CHECK` | `20` |
| `ENABLE_CAMPAIGN` | `true` |
| `INCREASE_AIRLINE_REPUTATION` | `true` |
| `CAMPAIGN_TYPE` | `1` |
| `CAMPAIGN_DURATION` | `4` |
| `ENABLE_DEPART` | `true` |

## ACKs internos

Algumas mutações exigem strings internas fixadas pelo workflow. Elas são guards de compatibilidade e **não devem ser configuradas manualmente** em uma instalação normal.

O ACK de departure ainda usa o identificador legado `individual-return-legs-v1`. O nome é histórico; o executor atual processa rotas existentes de forma base-agnostic.

## Configuração mínima recomendada

```text
RETURN_JOURNAL_SCOPE=am4-prod
AIRLINE_BASES_JSON=["AAA","BBB"]

MAX_INDIVIDUAL_DEPARTURES=20

MIN_DEMAND_PERCENTAGE=80
DEMAND_THRESHOLD_MODE=aggregate
DEMAND_POOL_SCOPE=airport-pair
DEMAND_MAX_AGE_SECONDS=300

MAX_FUEL_PRICE=550
MAX_CO2_PRICE=120
MIN_CASH_RESERVE=0

ENABLE_ROUTE_RESEARCH=true
ENABLE_ROUTE_OPTIMIZER=true
ENABLE_ROUTE_EXECUTION=true

ENABLE_TICKET_PRICING=true
ENABLE_TICKET_PRICING_EXECUTION=true
```

Declare explicitamente os parâmetros operacionais críticos no seu ambiente.
