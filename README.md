# Airline Manager 4 Automation

Automação avançada para **Airline Manager 4** com **Playwright + TypeScript + GitHub Actions**, focada em operação conservadora, persistência de evidências e comportamento **fail-closed**.

> Projeto não oficial. O uso de automação pode contrariar regras do jogo e não existe garantia de ausência de bloqueio ou banimento.

## Estado migrado

Base técnica: `3609256efda2cd9cf7a9975174b19187dd557737` do repositório original.

Antes da migração essa base possuía:
- validação offline #558 com **716/716 testes**
- **14 produções consecutivas bem-sucedidas (#169–#182)**
- pricing real com Save + releitura fresca confirmado na #182
- route review KEEP/HOLD validado em produção
- journal persistente, quarentenas, dashboard e UI health ativos

## Recursos

### Route review automático
Revisão diária e em retorno confirmado à base. Resultados: `KEEP`, `HOLD` ou `REROUTE`.

Um reroute só é autorizado quando:
- o conjunto inspecionado está completo;
- a economia está verificada;
- `comparisonReady=true`;
- `mutationAuthorized=true`;
- o fingerprint ainda é fresco;
- o novo `routeId` é confirmado após a mutação.

Comparação parcial permanece em HOLD.

### Pricing PAX
Política sobre o Auto Price nativo:
- Y = Auto × 1,10
- J = Auto × 1,08
- F = Auto × 1,06

Preço correto gera `ALREADY_AT_TARGET`. Drift real é salvo uma única vez e exige leitura fresca confirmando o valor persistido.

### Demand Manager
Valida aeronave, rota, sentido, capacidade Y/J/F, demanda restante, freshness, origem/base, quarentenas e orçamento de tempo antes de decolar.

A demanda adaptativa pode ficar mais conservadora usando histórico verificado, mas nunca reduz o piso configurado com base em evidência fraca.

### Histórico persistente
O `return-journal` é append-only e registra revisões, decolagens, chegadas, demanda, passageiros observados, Flight History, HOLDs, Fuel/CO₂, UI health e mutações incertas.

Resultados incertos entram em quarentena persistente e **não são repetidos automaticamente**.

### Estados operacionais
- `NORMAL`
- `AGUARDANDO_DEMANDA`
- `AGUARDANDO_RECURSO`
- `PRECISA_REVISAR_ROTA`
- `PRECISA_REVISAR_PRECO`
- `MANUTENCAO`
- `PRONTA_PARA_DECOLAR`

### Dashboard
Cada run gera resumo no `GITHUB_STEP_SUMMARY` e artifacts com frota, decolagens, retenções, route review, pricing, manutenção, campanhas, Fuel/CO₂, estados, quarentenas e orçamento de tempo.

### Fuel / CO₂
Compra baseada em preço live, estoque, saldo, capacidade e limites configurados. Histórico pode apertar o teto, nunca aumentá-lo. Calendários importados são somente referência e não autorizam compra.

### UI Health
Valida Login, Fleet, Maintenance, Marketing e Supplies antes das mutações. Mudanças incompatíveis podem produzir `UI_CHANGE_DETECTED`.

## Safeguards

1. Dados ausentes não viram zero.
2. Evidência parcial não autoriza mutação.
3. Resultado incerto nunca é repetido automaticamente.
4. Quarentenas persistem entre runs.
5. Reroute exige comparação fresca e completa.
6. Pricing exige confirmação pós-Save.
7. Compra exige preço live.
8. Run obsoleta não acessa o jogo.
9. Rerun não deve repetir mutação operacional.
10. Orçamento de tempo pode bloquear a operação antes do clique.

## Estrutura

```text
.github/workflows/   GitHub Actions
data/reference/      referências estáticas
demand/              demanda e decolagens
optimization/        route review, economia e journal
pricing/             pricing PAX
supplies/            Fuel/CO2
scripts/             dashboard, Telegram e importações
tests/live/          probes live controlados
tests/unit/          suíte offline
utils/               login, UI, manutenção e campanhas
```

## Instalação

Requisitos: Node.js 22, npm, Chromium/Playwright e o jogo em inglês.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
npm run typecheck
npm run build:state
```

## GitHub Actions

Workflow operacional: `.github/workflows/playwright.yml`.

Ele usa `workflow_dispatch` e `concurrency`; não existe schedule interno. Antes de acessar o jogo ele valida código, confirma o HEAD, restaura o journal e resolve os limites operacionais.

### Secrets
Em **Settings → Secrets and variables → Actions → Secrets**:
- `EMAIL`
- `PASSWORD`
- opcionais: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

Secrets não são versionados e precisam existir neste repositório.

### Variáveis principais
- `MAX_FUEL_PRICE=550`
- `MAX_CO2_PRICE=120`
- `REPAIR_WEAR=30`
- `HOURS_CHECK=20`
- `MIN_DEMAND_PERCENTAGE=80`
- `MAX_INDIVIDUAL_DEPARTURES=20`
- `ENABLE_ROUTE_RESEARCH=true`
- `ROUTE_RESEARCH_MAX_AIRCRAFT=3`
- `ROUTE_RESEARCH_MAX_SUGGESTIONS=5`
- `ENABLE_TICKET_PRICING=true`
- `ENABLE_TICKET_PRICING_EXECUTION=true`
- `ENABLE_ROUTE_EXECUTION=true`
- `ROUTE_MAX_REROUTES_PER_RUN=1`
- `DEMAND_TELEGRAM_ENABLED=false`

## Agendamento externo

Endpoint do workflow operacional:

```text
https://api.github.com/repos/andreypiekas/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches
```

Payload:

```json
{
  "ref": "main",
  "inputs": {
    "departure_mode": "production",
    "execute_individual": "true",
    "max_individual_departures": "0",
    "aktifkan_random_delay": "false",
    "paksa_simpan_video": "false"
  }
}
```

## Validação

```bash
npm test
npm run typecheck
npm run build:state
node scripts/company-dashboard.cjs --self-test
```

## Licença

MIT. O arquivo `LICENSE` preserva os avisos do projeto de origem.
