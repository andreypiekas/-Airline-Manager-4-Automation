# Relatórios e Telegram

## Objetivo

O relatório foi separado em dois níveis:

- **Summary executivo:** rápido para entender o que a run fez.
- **Artifacts detalhados:** evidência técnica para auditoria e troubleshooting.

Isso evita o comportamento anterior de concatenar praticamente todos os Markdown detalhados no `GITHUB_STEP_SUMMARY`.

## GITHUB_STEP_SUMMARY

O painel executivo contém:

1. número da run, resultado, modo, SHA e link;
2. bases efetivamente usadas e origem da lista (`live` ou fallback);
3. frota;
4. demanda;
5. decolagens;
6. pricing;
7. route review / reroute;
8. UI Health;
9. orçamento de tempo;
10. supplies, manutenção e campanhas;
11. quarentenas e alertas;
12. contagem de estados operacionais;
13. somente aeronaves que exigem atenção.

A lista completa da frota não é repetida no Summary quando está em estado normal.

## Artifact demand-report

Retenção padrão: 7 dias.

Pode conter, conforme a execução:

- `company-dashboard.json/.md`
- `operational-states.json`
- `owned-airline-bases.json/.md`
- `demand-report.json/.md`
- `execution-report.json/.md`
- `pricing-execution.json/.md`
- `route-execution.json/.md`
- `route-research.json/.md`
- `candidate-data.json/.md`
- `supply-report.json/.md`
- `ui-health.json/.md`
- `run-time-budget.json/.md`
- arquivos de Flight History e continuidade
- auditorias e diagnósticos adicionais

O artifact é a fonte para investigação detalhada.

## Artifact playwright-report

Contém logs técnicos e evidências permitidas pela configuração do Playwright. Não deve ser usado para armazenar credenciais, cookies ou tokens.

## Telegram

O notifier roda ao final da execução com `continue-on-error: true`. Uma falha exclusiva de Telegram não transforma uma operação saudável do jogo em falha operacional.

Secrets:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

`TELEGRAM_CHAT_ID` precisa ser o ID da conversa.

### Formato do resumo

O Telegram utiliza o mesmo `company-dashboard.json` do Summary, reduzindo o risco de divergência entre GitHub e Telegram. A linha `Bases` mostra o conjunto efetivo usado naquela run e se veio da leitura live ou do fallback.

```text
✈️ AM4 • SUCESSO • run #123
Bases: XAP, GRU, DTW, TXL • live
Frota: 34 | voo 30 | prontas 4
Demanda: 3/4 suficientes | insuf. 1 | indispon. 0
Decolagens: 2/4 confirmadas | retidas 2 | incertas 0
Pricing: 0 ajustadas | 4 no alvo | incertas 0
Rotas: 0 reroutes | revisão KEEP 0 / HOLD 2 / candidato 0
Suprimentos: Fuel: purchased • 540/1k • qtd 4,575,933 | CO₂: skipped
Segurança: quarentenas D3 R0 P0 S1 | UI healthy
Run: https://github.com/...
```

Legenda:

- `D` = departure
- `R` = reroute
- `P` = pricing
- `S` = supplies

### Dados que não vão ao Telegram

O resumo não inclui:

- aircraftId;
- matrícula;
- saldo da companhia;
- e-mail ou senha;
- token;
- cookies;
- HTML bruto;
- conteúdo de formulários.

### Alertas adicionais

Quando há evidência relevante, `importantMessage` pode acrescentar uma linha de alerta para:

- resultado incerto;
- fase interrompida por fail-safe;
- `UI_CHANGE_DETECTED`;
- reroute confirmado;
- decolagens bloqueadas por combustível insuficiente verificado;
- demanda esgotada;
- manutenção crítica segundo a política;
- HOLD prolongado verificado.

## Diagnóstico do Telegram

### 403 — bot can't send messages to the bot

O Chat ID configurado é o ID do próprio bot. Troque pelo ID da conversa.

### NO_CHAT_UPDATES_FOUND

O bot ainda não recebeu uma mensagem. Abra a conversa e envie `/start` antes de consultar `getUpdates`.

### 400 — chat not found

Chat ID inválido, conversa inacessível ou bot sem permissão para aquele destino.

### timeout / network error

Falha de transporte. Consulte o log da etapa `Notificar resumo pelo Telegram`.

## Validação

O caminho real de entrega foi validado em 05/10/2026:

- um envio direto seguro retornou `TELEGRAM_TEST_SEND_OK`;
- a produção #7 concluiu com a etapa `Notificar resumo pelo Telegram` em `success`.

A formatação executiva atual também é coberta pela suíte offline.
