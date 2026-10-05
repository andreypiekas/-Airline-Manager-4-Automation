# Estado técnico da implementação — 05/10/2026

## Baseline operacional

Repositório ativo:

```text
andreypiekas/Airline-Manager-4-Automation
```

O repositório antigo é apenas histórico.

## Evidências recentes

- produção #6: `SUCCESS`; decolagens reais e compra de Fuel confirmadas;
- validação #12: verde no mesmo baseline da #6;
- produção #7: `SUCCESS`;
- produção #7: etapa `Notificar resumo pelo Telegram` = `success`;
- teste direto de Telegram = `TELEGRAM_TEST_SEND_OK`;
- dashboard/Telegram executivos: cobertos por self-test e suíte offline após a atualização atual.

## Componentes

| Componente | Estado |
| --- | --- |
| Login / Fleet | Produção |
| Demand Manager | Produção |
| Threshold adaptativo | Produção, conservador |
| Decolagem individual | Produção |
| Fuel | Produção |
| CO₂ | Produção, com quarentena persistente quando necessário |
| Manutenção / A-check / reparos | Produção |
| Campanhas | Produção |
| Pricing PAX | Produção |
| Route research | Produção em leitura |
| Route review | Produção |
| Reroute executor | Implementado e fail-closed |
| Journal persistente | Produção |
| Estados operacionais | Produção |
| UI Health | Produção |
| Dashboard executivo | Produção |
| Telegram | Entrega real validada |
| Compra automática de aeronaves | Fora do escopo |

## Safeguards obrigatórios

Não enfraquecer:

- `comparisonReady`;
- `mutationAuthorized`;
- ACKs de execução real;
- validação de `GITHUB_ACTIONS`;
- repositório autorizado;
- `GITHUB_RUN_ATTEMPT=1`;
- journal persistente;
- no-retry após mutação incerta;
- verificação do SHA atual;
- orçamento de tempo;
- confirmação pós-Save / pós-clique;
- preço live para supplies.

## Quarentenas

Resultados históricos incertos de departure e supply continuam preservados no journal. Eles não devem ser repetidos automaticamente.

## Relatórios

O `GITHUB_STEP_SUMMARY` é agora um painel executivo único. Os relatórios técnicos completos continuam no artifact `demand-report`.

O Telegram deriva seus números do mesmo dashboard consolidado usado pelo Summary e omite identificadores sensíveis/operacionais desnecessários.
