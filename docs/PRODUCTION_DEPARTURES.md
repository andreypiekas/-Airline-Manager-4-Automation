# Decolagens individuais em produção

## Estado atual — 05/10/2026

O executor individual está ativo no workflow principal e já foi validado em produção. Ele opera a **rota existente de qualquer aeronave pronta, em qualquer aeroporto**, quando as evidências permitem. A decolagem não depende mais de a rota conter uma base/hub conhecido.

Não existe `departAll` como fallback.

## Gates obrigatórios

Produção real exige:

- `DEMAND_DRY_RUN=false`;
- `ENABLE_DEMAND_MANAGER=true`;
- `DEMAND_FAIL_SAFE=true`;
- `DEMAND_EXECUTION_ACK=individual-return-legs-v1`;
- `GITHUB_ACTIONS=true`;
- repositório autorizado;
- `GITHUB_RUN_ATTEMPT=1`;
- limite entre 1 e 20;
- pool conservador `airport-pair`;
- identidade e rota únicas;
- dados frescos;
- ausência de quarentena impeditiva;
- orçamento de tempo suficiente.

Reruns reais são rejeitados. Uma tentativa cujo resultado não possa ser confirmado encerra a sequência com `outcome_unknown` e cria bloqueio persistente.

## Fluxo por aeronave

1. Coletar a frota e os detalhes completos.
2. Considerar toda aeronave pronta em uma rota existente, sem filtrar pela base/hub.
3. Recoletar o alvo antes da decisão.
4. Validar identidade, routeId, trecho, layout e demanda restante.
5. Aplicar threshold de demanda e reservas conservadoras.
6. Verificar estoque de Fuel quando há evidência histórica utilizável.
7. Validar o handler nativo de Depart e seus parâmetros.
8. Persistir a intenção antes de clicar.
9. Executar no máximo um clique nativo para aquele alvo.
10. Recoletar estado, contador e passageiros embarcados.
11. Somente marcar `departed` quando a transição é confirmada.

Uma falha depois do clique não é “corrigida” com segundo clique.

## Cobertura de aeroportos e bases

A fase de decolagem é **base-agnostic**: se o AM4 já possui uma rota válida atribuída à aeronave e o controle nativo de Depart está disponível, o executor pode processá-la independentemente de o aeroporto ser XAP, GRU, DTW, TXL ou qualquer outro aeroporto presente nas rotas da frota.

A descoberta de hubs da companhia continua sendo usada por **route review/reroute**, onde a noção de “retorno à própria base” é necessária. Ela não bloqueia mais o despacho normal de rotas existentes.

Isso evita que aeronaves permaneçam em solo apenas porque a origem operacional não pôde ser inferida ou porque o trecho atual não contém uma base conhecida.


## Configuração

No workflow principal:

| Item | Padrão atual |
| --- | --- |
| `departure_mode` | `production` |
| `max_individual_departures` | `0` |
| `MAX_INDIVIDUAL_DEPARTURES` | `20` |
| `MIN_DEMAND_PERCENTAGE` | `80` |
| `DEMAND_THRESHOLD_MODE` | `aggregate` |
| `DEMAND_POOL_SCOPE` | `airport-pair` |
| `DEMAND_MAX_AGE_SECONDS` | `300` |

`max_individual_departures=0` usa a Variable do repositório. Um valor positivo no input sobrescreve a Variable. O resolvedor aceita representações inteiras fornecidas pelo GitHub como `0.0` e `5.0`; frações e notação exponencial são rejeitadas.

`departure_mode=simulation` sempre impede decolagens reais, mesmo que Variables de produção estejam habilitadas.

## Demanda adaptativa

O piso inicial é `MIN_DEMAND_PERCENTAGE`. Histórico verificado pode elevar esse piso para uma aeronave/rota quando houver evidência suficiente. Nunca reduz o threshold abaixo do configurado.

Demanda suficiente é necessária, mas não suficiente: uma quarentena, falta de Fuel, mudança de UI ou inconsistência de identidade ainda bloqueia a decolagem.

## Persistência e quarentenas

O journal registra:

- departures confirmadas;
- passengers onboard observados;
- resultados incertos;
- chegadas posteriormente observadas;
- evidência de demanda e histórico necessário.

Uma `departure-uncertain` é uma quarentena durável por aeronave/rota e não é automaticamente repetida em runs posteriores.

## Relatórios

`execution-report.json/.md` registra:

- avaliadas;
- confirmadas;
- retidas;
- incertas;
- motivo por alvo;
- demanda/capacidade relevante;
- passageiros embarcados quando confirmados.

O Summary executivo mostra apenas os totais e estados que exigem atenção. Os detalhes permanecem no artifact `demand-report`.

## Evidência de produção

No repositório novo:

- produção #6: 4 candidatas avaliadas, 2 departures confirmadas, 2 retidas por quarentena, 0 incertas;
- produção #7: 4 candidatas avaliadas, 0 departures, 4 retidas, 0 incertas — demonstrando que uma run verde pode corretamente não decolar ninguém.

Não use uma execução real apenas para exercitar um caminho de teste. A suíte offline cobre o executor e os guards sem acessar o jogo.
