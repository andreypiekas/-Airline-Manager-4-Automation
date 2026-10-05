# Relatórios e Telegram

O projeto separa visão executiva de evidência técnica.

## GitHub Step Summary

O Summary apresenta uma visão curta da run, incluindo quando disponível:

- resultado e modo;
- hubs efetivos e origem da lista;
- frota;
- demanda;
- departures;
- pricing;
- route review/reroute;
- supplies;
- manutenção e campanhas;
- UI Health;
- orçamento de tempo;
- quarentenas;
- estados operacionais que exigem atenção.

A frota inteira não precisa ser repetida quando não há ação necessária.

## Artifact demand-report

Retenção padrão do workflow: 7 dias.

Pode conter:

```text
company-dashboard.json/.md
operational-states.json
owned-airline-bases.json/.md
demand-report.json/.md
execution-report.json/.md
pricing-execution.json/.md
route-execution.json/.md
route-research.json/.md
candidate-data.json/.md
supply-report.json/.md
ui-health.json/.md
run-time-budget.json/.md
```

Além desses arquivos, diagnósticos de Flight History, continuidade e auditorias podem ser incluídos.

## Artifact playwright-report

Contém logs e evidências técnicas permitidas pela configuração do Playwright.

Credenciais, cookies e tokens não devem ser armazenados como evidência.

## Telegram

Quando os Secrets estão configurados, o notifier usa a mesma consolidação do dashboard para evitar divergência entre GitHub e mensagem.

Exemplo genérico:

```text
✈️ AM4 • SUCESSO
Bases: AAA, BBB • live
Frota: 12 | voo 9 | prontas 3
Demanda: 2/3 suficientes | insuf. 1
Decolagens: 2 confirmadas | retidas 1 | incertas 0
Pricing: 1 ajustada | 2 no alvo
Rotas: KEEP 1 | HOLD 1 | reroutes 0
Suprimentos: Fuel purchased | CO₂ skipped
Segurança: sem resultado incerto | UI healthy
```

O resumo não deve incluir:

- aircraftId;
- matrícula quando desnecessária;
- e-mail ou senha;
- tokens;
- cookies;
- HTML bruto;
- conteúdo de formulários;
- outros dados sensíveis da sessão.

## Alertas

O dashboard/notifier pode destacar:

- resultado incerto;
- fail-safe acionado;
- mudança inesperada de UI;
- reroute confirmado;
- bloqueio por Fuel;
- demanda esgotada;
- manutenção crítica;
- HOLD prolongado.

## Diagnóstico do Telegram

### 403 — bot can't send messages to the bot

O Chat ID provavelmente aponta para o próprio bot. Use o ID da conversa ou grupo.

### chat not found

Verifique o Chat ID e se o bot possui acesso ao destino.

### sem updates

Abra a conversa e envie uma mensagem ao bot antes de consultar updates.

### timeout / network error

Trate como falha de transporte da notificação. O workflow usa notificação como etapa auxiliar e não deve reinterpretar uma operação saudável do jogo como falha apenas por causa do Telegram.
