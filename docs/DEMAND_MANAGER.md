# DemandManager — analise e executor individual

## Estado atual de produção — 05/10/2026

O `DemandManager` continua separando **análise** de **execução**. O relatório analítico nunca autoriza um clique sozinho; a decolagem real passa pelo executor individual, que refaz validações imediatamente antes da operação.

No workflow principal, `departure_mode=production` é o padrão atual. `departure_mode=simulation` força execução sem mutações operacionais. O modo efetivo e o limite são registrados em `[DepartureConfig]` antes do login.

Produção real exige simultaneamente:

- `ENABLE_DEMAND_MANAGER=true`;
- `DEMAND_FAIL_SAFE=true`;
- `DEMAND_DRY_RUN=false`;
- ACK interno `individual-return-legs-v1`;
- GitHub Actions no repositório autorizado;
- `GITHUB_RUN_ATTEMPT=1`;
- pool conservador compatível;
- journal/quarentenas disponíveis quando exigidos;
- leitura fresca de identidade, rota, layout e demanda;
- orçamento de tempo suficiente.

O workflow nunca faz fallback para `departAll`. Cada alvo é tratado individualmente; resultado incerto é persistido e não recebe retry automático.

O limite padrão do workflow atual é controlado por `MAX_INDIVIDUAL_DEPARTURES` (20 quando omitido). O input `max_individual_departures=0` significa “usar a Variable”. O parser também normaliza entradas do GitHub como `0.0` ou `5.0` quando representam inteiros.

A produção #6 confirmou duas decolagens reais e duas retenções por quarentena; a produção #7 confirmou que demanda suficiente, isoladamente, não supera quarentenas persistentes.

Configuração completa: [CONFIGURATION.md](CONFIGURATION.md). Operação real: [PRODUCTION_DEPARTURES.md](PRODUCTION_DEPARTURES.md).

## Inspeção histórica em 29/09/2026

Confirmado por navegação autenticada somente de leitura:

- Fleet contém Routes, Fleet (inventário por modelo), Parked e Pending.
- Fleet/Routes possui paginacao e cartoes em solo com Depart e em voo com Onboard/contador. Agendamento futuro nao foi confirmado.
- Cartão em solo mostra `Demand: Y / J / F`. Cartão em voo mostra `Onboard`, que **não é demanda restante**.
- Detalhes mostram `Todays demand` como restante/total, distinguindo as tres classes por imagens de assentos. O teto coberto por demanda depende do saldo e da configuracao de assentos da aeronave.
- Demanda de outras classes nao permite transportar passageiros em assentos economicos; classes sem assentos nao vetam o voo por si mesmas.
- Aeronaves na mesma ligacao podem apresentar saldos iguais e layouts diferentes; as leituras nao devem ser somadas.
- A tela contém `Ground`, `Grounded` e `Depart`. Os controles Ground e Depart são mutações e **não foram acionados**. O efeito e a reversão do estado Grounded permanecem não testados. Manter em solo neste projeto significa não decolar, sem alterar o estado nativo Ground.
- O histórico continha voos com Y0/J0/F0. Não se deve assumir que o jogo bloqueia automaticamente voos vazios.
- Os aeroportos nos detalhes podem aparecer na ordem inversa ao cartão. O relatório preserva o texto do cartão; `from`/`to` representam a ordem mostrada nos detalhes, sem afirmar que esse sentido foi validado por decolagem.

Ainda não confirmado:

- Horário/fuso exato de renovação, eventual reposição gradual, efeito de eventos ou diferenças de modo de jogo. O rótulo diário não prova reset à meia-noite UTC.
- Compartilhamento efetivo do consumo entre sentidos e entre aeronaves. Os valores coincidentes são evidência visual, não um experimento de consumo. Por segurança, o padrão agrega os dois sentidos do mesmo par e reserva passageiros uma única vez.
- Ocupação real: reputação, preço e outras regras podem reduzir embarques. O percentual do relatório é **limite por disponibilidade**, não garantia ou previsão calibrada de ocupação nem teste de rentabilidade.
- Resultado/confirmacao de decolagem individual e reacao a concorrencia externa. A coleta de leitura foi validada no Actions; nenhuma operacao real foi testada.
- Não houve captura de tráfego de rede: os endpoints abaixo foram identificados nos atributos dos controles DOM. Não foram feitas chamadas diretas, acessos a cookies/tokens ou exploração de APIs internas.

## Seletores observados

| Objetivo | Elemento confirmado | Uso |
| --- | --- | --- |
| Abrir frota/rotas | `#mapRoutes` | Navegação |
| Lista | `#routeAction`, `#routesContainer` | Aguardar painel |
| Cartão | `#routeMainList<ID_ROTA>` | Separar aeronaves/rotas |
| Aeronave | `a span#acRegList<ID_AERONAVE>` | ID técnico e registro |
| Rota exibida | `span.s-text` com `IATA - IATA` | Identificar par |
| Em solo | `.listDepartable` + botão visível/habilitado | Candidato, não autorização |
| Decolagem individual | `#listDepart<ID_ROTA>` | Apenas alvo preparado, sem clique |
| Detalhes | link da aeronave; `#detailsAction` | Leitura |
| Identidade dos detalhes | `#ff-name`, `#routeViewDepart[onclick]` | Verificar registro e ID da rota |
| Voltar | `#route-name .glyphicons-chevron-left` | Navegação |
| Capacidade | `#seat-layout img[src$="/economy_seat.png"]`, `business_seat.png`, `first_seat.png` | Texto direto no elemento pai; não lê campos de preço |
| Demanda | mesmas imagens em `#list-demand` | Restante/total por classe |
| Trecho em detalhes | `.col-5 span.l-text` | Conferir aeroportos contra o cartão |
| Próxima página | `#routesContainer .pagination` → link `Next` | Percorrer e conferir contagem |
| Ground | `#routeViewGround_unground` | Verificar disponibilidade, sem clicar |

Atributos observados referenciam `routes.php?start=...`, `fleet_details.php?id=...`, `route_depart.php?id=...` e `fleet_ground.php?id=...`. Apenas os links de navegação da própria interface são usados. IDs concretos são extraídos dos cartões, não gravados como configuração da companhia.

## Cálculo

Para cada classe c:

`passageiros_possiveis[c] = min(capacidade[c], demanda_disponivel[c])`

`percentual = 100 * soma(passageiros_possiveis) / soma(capacidade)`

No modo `aggregate`, exige `ceil(soma(capacidade) * limite / 100)` passageiros. No modo opcional `per-class`, exige esse percentual separadamente em cada classe com assentos. Classes sem assentos não vetam a aeronave. Demanda zero nas classes utilizadas mantém em solo mesmo que outras classes tenham demanda.

Ao simular uma liberação, reserva o máximo possível em cada classe, e não só o mínimo do limite. A próxima aeronave utiliza o saldo simulado. A ordem é a ordem dos cartões/páginas; não é um otimizador de lucro. Leituras diferentes do mesmo pool usam o menor restante observado. Totais diários divergentes bloqueiam o pool (possível virada de dia ou hipótese de compartilhamento incorreta).

Não há estado persistente de bloqueio: cada execução relê a demanda. Quando ela se renova, a próxima simulação pode liberar novamente. Dados ausentes, fracionários, negativos, expirados, identidade divergente, total inconsistente ou duplicidades nunca autorizam decolagem. Uma coleta global incompleta bloqueia todas as liberações simuladas.

## Configuração

| Variável | Padrão | Observação |
| --- | --- | --- |
| `ENABLE_DEMAND_MANAGER` | `true` | Ativa a analise; executor real separado |
| `MIN_DEMAND_PERCENTAGE` | `80` | Maior que 0 e até 100; 80 é política inicial, não regra do jogo |
| `DEMAND_DRY_RUN` | `true` | `false` exige o contexto de execucao real documentado |
| `DEMAND_FAIL_SAFE` | `true` | `false` rejeitado nesta versão |
| `DEMAND_THRESHOLD_MODE` | `aggregate` | Alternativa `per-class` |
| `DEMAND_POOL_SCOPE` | `airport-pair` | Conservador; `directional` apenas para simulação/estudo |
| `DEMAND_MAX_AGE_SECONDS` | `300` | Máximo 3600; leituras antigas bloqueadas |
| `DEMAND_TELEGRAM_ENABLED` | controlado pelo workflow | O workflow principal atual habilita o notifier; requer Secrets do Telegram |

Booleanos aceitam apenas `true`/`false`; erros de digitação são rejeitados. Carga/charter não suportado é indisponível, nunca convertido em passageiros. O layout e os labels devem estar em inglês.

## Concorrência e segurança

- Workflow operacional mantém `concurrency.group: airline-manager-4-main` e `cancel-in-progress: false`, compartilhado por branches no mesmo repositório.
- Execuções locais no mesmo checkout usam diretório exclusivo `.am4-run.lock`. Após encerramento abrupto, confirme que não há execução ativa e remova manualmente o lock abandonado. Não há remoção automática perigosa.
- Locks locais não cobrem outros computadores/checkouts; GitHub concurrency não cobre outros repositórios nem operações manuais. Use um unico executor; o modulo rele os dados antes de cada decolagem e interrompe resultados incertos sem repetir cliques.
- ID de aeronave ou rota duplicado bloqueia a decisão. O executor consome a tentativa antes do clique, persiste o intento e rejeita reruns reais do Actions.
- Trace, vídeo e screenshots automáticos são desligados para evitar gravação da autenticação; a opção antiga de vídeo não reativa gravação nesta entrega. Capturas explícitas de diagnóstico existentes ficam no fluxo legado.
- Não foram adicionados mecanismos de evasão, mudanças de fingerprint ou acesso a sessão.

## Relatórios, Telegram e execução

- `test-results/demand/demand-report.json`: schema, instante de leitura, estado, IDs, trechos, capacidade, restante, total diário, pool, reservas, necessidade mínima, percentual e justificativa.
- `test-results/demand/demand-report.md`: tabela legível e resumo.
- O artifact `demand-report` mantém os relatórios técnicos por 7 dias; o `GITHUB_STEP_SUMMARY` mostra somente o painel executivo consolidado. Relatórios contêm dados operacionais da frota: considere a visibilidade do repositório antes de compartilhar artifacts.
- Telegram usa os Secrets existentes e envia um resumo agregado derivado do mesmo dashboard do GitHub. Não inclui saldo, aircraftId, matrícula, credenciais, cookies ou HTML. O caminho real de entrega foi validado em produção em 05/10/2026.
- Os relatórios gerados pelos testes são apagados antes da coleta autenticada para não confundir dados simulados com dados reais.
- `npm ci`, `npm run typecheck`, `npx playwright install chromium`, `npm test`: validação local com fixtures, sem credenciais ou chamadas ao jogo.
- `npm run bot`: **não executar para testar cálculos**; pode acessar a conta e deve ser usado somente em ambiente operacional explicitamente configurado. Para cálculos, use a suíte offline.
- `validate.yml` executa somente compilação e fixtures em PR/push. Não recebe secrets do jogo.
- `playwright.yml` continua exclusivamente `workflow_dispatch`, sem schedule/push/PR para operações. O corpo usado pelo cron-job.org permanece compatível.

## Validacao e escopo operacional

O executor verifica o handler completo observado no jogo, rele toda a frota e os detalhes do alvo e confirma o resultado em nova coleta. Testes incluem um ciclo completo de Playwright com todas as requisicoes interceptadas, falha HTTP, limite de tentativas e nenhuma chamada de decolagem na simulacao. Evidencias atuais e contagem de testes: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

Aeronaves na propria base ficam retidas enquanto a revisao economica estiver incompleta. O executor nao modifica rotas ou tarifas, nao promete ocupacao real a partir da cobertura de demanda e nao declara o otimizador completo pronto.

## Arquivos

Criados: `demand/types.ts`, `demand/config.ts`, `demand/manager.ts`, `demand/parsing.ts`, `demand/reader.ts`, `demand/report.ts`, `demand/run.ts`, `utils/run-lock.ts`, `tests/unit/demand.spec.ts`, `tests/unit/reader.spec.ts`, `playwright.unit.config.ts`, `scripts/telegram-demand.cjs`, `.github/workflows/validate.yml` e este documento.

Modificados: `utils/fleet.utils.ts`, `tests/airlineManager.spec.ts`, `.github/workflows/playwright.yml`, `playwright.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `.gitignore`, `AUTOMACAO.md` e `README.md`.

`utils/general.utils.ts` foi inspecionado; o fluxo de demanda usa o login normal sanitizado de `utils/read-only-login.ts`. O workflow principal integra agora o modulo limitado `supplies/`, documentado em [SUPPLIES.md](SUPPLIES.md). O legado financeiro continua fora do fluxo de demanda.

## Extensão: rotas e tarifas

A atualização posterior acrescenta a proposta de tarifas e o motor de revisão de rotas documentados em [ROUTES_AND_PRICING.md](ROUTES_AND_PRICING.md). As novas propostas também são exclusivamente simuladas; dados ausentes de base/retorno/candidatos bloqueiam a revisão da rota.
