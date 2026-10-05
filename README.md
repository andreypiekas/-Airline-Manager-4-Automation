# Airline Manager 4 Automation

Automação operacional para **Airline Manager 4** construída com **TypeScript, Playwright e GitHub Actions**, com foco em execução conservadora, confirmação pós-operação e persistência de evidências.

> **Projeto não oficial.** O uso de automação pode contrariar regras do jogo. Não existe garantia de ausência de bloqueio, limitação ou banimento.

## Visão geral

O bot foi projetado para automatizar somente operações que consegue **observar, validar e confirmar**. Quando a evidência é incompleta, divergente ou antiga, a decisão padrão é não executar a mutação.

| Área | Estado atual |
| --- | --- |
| Login e coleta da frota | Produção |
| Descoberta automática de bases | Produção; leitura live dos hubs da conta |
| Demand Manager | Produção |
| Decolagens individuais | Produção, com confirmação fresca |
| Fuel | Produção, compra com preço live e confirmação |
| CO₂ | Produção, sujeito a quarentena persistente |
| Manutenção / A-check / reparos | Produção |
| Campanhas | Produção |
| Pricing PAX | Produção, Save + releitura confirmada |
| Route research | Produção em leitura |
| Revisão diária / retorno à base | Produção |
| Reroute | Executor implementado; somente com comparação completa |
| Journal persistente | Produção |
| Estados operacionais | Produção |
| UI Health | Produção |
| Dashboard GitHub | Produção |
| Telegram | Envio real validado |
| Compra de novas aeronaves | Fora do escopo |

O estado técnico detalhado está em [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Princípios de segurança

Os seguintes invariantes fazem parte do desenho do projeto:

1. **Fail-closed:** ausência de evidência nunca é convertida em autorização.
2. **Sem retry após mutação incerta:** se houve tentativa e o resultado não foi confirmado, a operação entra em quarentena.
3. **Persistência entre runs:** journal e quarentenas sobrevivem a runners efêmeros.
4. **Run obsoleta não acessa o jogo:** o workflow compara o SHA enfileirado com o HEAD antes da fase autenticada.
5. **Reruns operacionais são rejeitados:** produção real exige `GITHUB_RUN_ATTEMPT=1`.
6. **Pricing exige releitura pós-Save.**
7. **Reroute exige comparação fresca, completa, `comparisonReady=true` e autorização explícita de mutação.**
8. **Supply exige preço live:** calendários e referências externas nunca autorizam compra.
9. **Orçamento de tempo pode bloquear uma fase antes do clique.**
10. **Dados econômicos ausentes não viram zero.**

## Fluxo de uma execução

O workflow principal é `.github/workflows/playwright.yml`.

```text
workflow_dispatch
  ↓
checkout / Node / dependências
  ↓
typecheck + build + testes offline
  ↓
verificação do SHA atual
  ↓
restauração do journal persistente
  ↓
resolução do modo e limite de decolagens
  ↓
login + UI Health
  ↓
descoberta live de todas as bases/hubs da conta
  ↓
Fuel / CO₂
  ↓
manutenção / campanhas
  ↓
coleta completa da frota e demanda
  ↓
route research / route review
  ↓
reroute fail-closed
  ↓
pricing PAX
  ↓
decolagens individuais
  ↓
persistência do journal
  ↓
dashboard executivo + artifacts + Telegram
```

O workflow usa `concurrency.group: airline-manager-4-main` com `cancel-in-progress: false` para evitar duas automações simultâneas.

## Requisitos para desenvolvimento local

- Node.js 22
- npm
- Chromium compatível com Playwright
- sistema operacional suportado pelo Playwright
- interface do Airline Manager 4 em **inglês**

Instalação:

```bash
git clone https://github.com/andreypiekas/Airline-Manager-4-Automation.git
cd Airline-Manager-4-Automation
npm ci
npx playwright install --with-deps chromium
```

Validação offline:

```bash
npm run typecheck
npm run build:state
node scripts/company-dashboard.cjs --self-test
npm test
```

Esses comandos não precisam das credenciais do jogo.

## Configuração no GitHub

A configuração fica em **Settings → Secrets and variables → Actions**.

### Secrets

| Secret | Obrigatório | Uso |
| --- | --- | --- |
| `EMAIL` | Sim | Login web do Airline Manager 4 |
| `PASSWORD` | Sim | Senha da conta do jogo |
| `TELEGRAM_BOT_TOKEN` | Não | Token do bot criado no BotFather |
| `TELEGRAM_CHAT_ID` | Não | ID da conversa privada ou grupo que recebe os resumos |

O `TELEGRAM_CHAT_ID` é o ID da **conversa**, não o ID do próprio bot.

### Inputs do workflow principal

| Input | Padrão | Descrição |
| --- | --- | --- |
| `departure_mode` | `production` | `production` executa módulos autorizados; `simulation` força modo de leitura/simulação |
| `execute_individual` | `true` | Compatibilidade com versões anteriores |
| `max_individual_departures` | `0` | `0` usa a Variable; 1–20 sobrescreve |
| `aktifkan_random_delay` | `false` | Atraso aleatório opcional |
| `paksa_simpan_video` | `false` | Compatibilidade de diagnóstico; mantenha desligado normalmente |

Inputs numéricos do GitHub podem chegar como `0.0` ou `2.0`. O resolvedor aceita somente representações equivalentes a inteiros e rejeita frações ou notação exponencial.

### Variables principais

Configuração recomendada:

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
ENABLE_ROUTE_OPTIMIZER=true
ENABLE_ROUTE_EXECUTION=true
ROUTE_MAX_REROUTES_PER_RUN=1

ENABLE_TICKET_PRICING=true
ENABLE_TICKET_PRICING_EXECUTION=true
TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN=5
```

A lista completa, defaults, limites e exemplos está em [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Descoberta automática de bases

O bot **não depende de uma lista fixa de bases** para a operação normal. Em cada execução autenticada ele consulta, em modo somente leitura, a página nativa `research_main.php` e extrai o seletor `#hubSelect`, que representa os hubs/bases pertencentes à companhia.

Os IDs nativos retornados pelo jogo são cruzados com `data/reference/airports.json` para obter o IATA de forma determinística. A lista live só é aceita quando **todos** os hubs observados resolvem de forma única; caso contrário, o bot usa o fallback configurado e não inventa uma base.

Validação live em 05/10/2026:

```text
2926 → XAP → Chapecó
2947 → GRU → São Paulo Guarulhos
1275 → DTW → Detroit Metropolitan
465  → TXL → Berlin Tegel
```

Se uma nova base for comprada no AM4 e seu airport ID existir no catálogo de aeroportos do sistema, ela será incorporada automaticamente na próxima execução, sem editar o código ou `AIRLINE_BASES_JSON`.

`AIRLINE_BASES_JSON` permanece apenas como **fallback conservador** quando a lista live não pode ser comprovada.

**Importante:** essa lista de hubs não limita mais as decolagens. O executor de uma rota já existente é base-agnostic e pode processar qualquer aeronave pronta em qualquer aeroporto observado na frota, desde que demanda, identidade, controle nativo, recursos e confirmação estejam válidos. A noção de base própria permanece apenas nas funções que realmente dependem dela, como route review/reroute.

## Demand Manager

A decisão de decolagem considera, entre outros fatores:

- identidade única da aeronave e da rota;
- estado atual;
- capacidade Y/J/F;
- demanda restante por classe;
- freshness da observação;
- pool conservador de demanda;
- reservas entre aeronaves;
- threshold configurado e adaptativo;
- contexto operacional da rota existente;
- evidência de estoque de combustível;
- quarentenas persistentes;
- orçamento de tempo.

Padrões:

```text
MIN_DEMAND_PERCENTAGE=80
DEMAND_THRESHOLD_MODE=aggregate
DEMAND_POOL_SCOPE=airport-pair
DEMAND_MAX_AGE_SECONDS=300
```

O threshold adaptativo pode **aumentar** o piso depois de histórico verificado suficiente; nunca reduz o piso configurado com evidência fraca.

## Pricing PAX

O cálculo parte do **Auto Price nativo** observado na rota:

```text
Y = Auto × 1,10
J = Auto × 1,08
F = Auto × 1,06
```

O resultado é truncado para múltiplo de 10.

Fluxo seguro:

- preço já correto → `ALREADY_AT_TARGET`;
- Save somente em contexto de produção autorizado;
- limite de ajustes por run;
- releitura fresca depois do Save;
- resultado não confirmado → quarentena persistente, sem retry automático.

## Revisão de rotas e reroute

A revisão pode ocorrer:

- após retorno confirmado à própria base; ou
- uma vez ao dia quando a aeronave é observada em solo na própria base e ainda não possui revisão concluída naquele dia.

A análise pode produzir `KEEP`, `HOLD` ou uma candidata a `REROUTE`. Uma mutação real só é autorizada quando o conjunto comparado é suficientemente verificado, o alvo nativo continua fresco e a superioridade econômica conservadora foi demonstrada.

Sugestões limitadas nunca são tratadas como prova da melhor rota global.

## Fuel e CO₂

O módulo usa preço **ao vivo** da interface.

Padrões:

```text
MAX_FUEL_PRICE=550
MAX_CO2_PRICE=120
MIN_CASH_RESERVE=0
```

A compra exige preço estritamente abaixo do teto. O histórico verificado pode apertar o teto efetivo, mas nunca aumentá-lo.

Após a tentativa, o bot relê estoque, capacidade e pagamento. Resultado inconclusivo entra em quarentena e não é repetido automaticamente.

## Manutenção e campanhas

Principais parâmetros:

```text
REPAIR_WEAR=30
HOURS_CHECK=20
INCREASE_AIRLINE_REPUTATION=true
CAMPAIGN_TYPE=1
CAMPAIGN_DURATION=4
```

Os controles nativos precisam ser validados antes das operações.

## Estado persistente

O journal operacional é mantido na branch:

```text
am4-runtime-state
```

Arquivo por scope:

```text
return-journal-<scope>.json
```

Ele registra revisões, decolagens confirmadas, chegadas observadas, Flight History, HOLDs, supplies, UI Health e mutações incertas. Quarentenas persistentes não devem ser apagadas apenas para liberar uma nova tentativa.

## Relatórios

Cada produção gera:

- **GITHUB_STEP_SUMMARY** — painel executivo curto;
- artifact **demand-report** — JSON/Markdown detalhados;
- artifact **playwright-report** — logs técnicos permitidos.

O painel executivo mostra frota, demanda, decolagens, pricing, rotas, supplies, manutenção, campanhas, UI Health, orçamento de tempo, estados operacionais e quarentenas. Os relatórios detalhados permanecem fora do Summary para evitar duplicação.

Veja [docs/REPORTS_AND_TELEGRAM.md](docs/REPORTS_AND_TELEGRAM.md).

## Telegram

Com `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`, o workflow envia um resumo agregado ao final de cada run.

Formato:

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

O Telegram não envia aircraftId, matrícula, saldo, credenciais, cookies ou HTML.

## Agendamento externo com cron-job.org

O workflow operacional **não possui schedule interno**. O agendamento recomendado é externo, por exemplo a cada 30 minutos.

Endpoint:

```text
POST https://api.github.com/repos/andreypiekas/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches
```

Headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer SEU_TOKEN_GITHUB
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

Body mínimo recomendado:

```json
{
  "ref": "main"
}
```

Use Fine-grained PAT restrito a este repositório com **Actions: Read and write**. Uma resposta HTTP 2xx confirma que o GitHub aceitou o dispatch; não confirma operações no jogo.

## Estrutura do repositório

```text
.github/workflows/     GitHub Actions
data/reference/        referências estáticas
demand/                demanda e decolagens
optimization/          route review, economia, histórico e journal
pricing/               pricing PAX
supplies/              Fuel / CO₂
scripts/               dashboard, Telegram e utilitários
tests/live/            probes controlados
tests/unit/            suíte offline
utils/                 login, UI, manutenção e campanhas
docs/                  documentação técnica
```

## Troubleshooting rápido

**Run verde, mas nada mudou no jogo:** consulte o Summary e `execution-report.md`. Todos os candidatos podem ter ficado em HOLD de forma correta.

**Telegram 403 “bot can't send messages to the bot”:** o Chat ID é do próprio bot. Use o ID da conversa.

**Telegram sem updates:** envie `/start` ou outra mensagem ao bot antes de consultar `getUpdates`.

**Fuel não comprou:** confira preço live, teto efetivo, capacidade, caixa/reserva e quarentenas.

**CO₂ bloqueado:** consulte `supply-report.json`. Uma mutação anteriormente incerta permanece bloqueada até revisão segura.

**Run ignorada:** o HEAD mudou antes do acesso ao jogo e o guard de SHA bloqueou a execução antiga.

**Reroute não ocorreu:** a comparação não atingiu os gates de segurança. Isso é comportamento esperado, não uma falha.

## Documentação

- [Índice técnico](docs/README.md)
- [Configuração completa](docs/CONFIGURATION.md)
- [Relatórios e Telegram](docs/REPORTS_AND_TELEGRAM.md)
- [Demand Manager](docs/DEMAND_MANAGER.md)
- [Decolagens em produção](docs/PRODUCTION_DEPARTURES.md)
- [Rotas e pricing](docs/ROUTES_AND_PRICING.md)
- [Supplies](docs/SUPPLIES.md)
- [Reservas e custos](docs/RESERVATIONS_AND_COSTS.md)
- [Estado da implementação](docs/IMPLEMENTATION_STATUS.md)
- [Migração](MIGRATION.md)

## Licença

MIT. Os avisos de atribuição do projeto de origem permanecem no arquivo `LICENSE`.
