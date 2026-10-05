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
- dashboard/Telegram executivos: cobertos por self-test e suíte offline após a atualização atual;
- descoberta live de bases validada contra a conta real: `XAP`, `GRU`, `DTW` e `TXL` obtidos de `research_main.php#hubSelect` e cruzados pelos IDs nativos do catálogo.

## Componentes

| Componente | Estado |
| --- | --- |
| Login / Fleet | Produção |
| Descoberta automática de bases | Produção; lista live dos hubs com fallback conservador |
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


## Bases operacionais

A fonte primária deixou de ser uma lista fixa. O bot lê os hubs pertencentes à companhia em `research_main.php#hubSelect` e cruza os IDs do jogo com o catálogo local de aeroportos.

Evidência live de 05/10/2026:

| ID AM4 | IATA | Hub |
| ---: | --- | --- |
| 2926 | XAP | Chapecó |
| 2947 | GRU | São Paulo Guarulhos |
| 1275 | DTW | Detroit Metropolitan |
| 465 | TXL | Berlin Tegel |

A lista live é reutilizada por análise de demanda, resolução de origem, route review/reroute e departure. `AIRLINE_BASES_JSON` é apenas fallback. Uma futura base entra automaticamente quando o ID nativo puder ser resolvido de forma única no catálogo do sistema.
