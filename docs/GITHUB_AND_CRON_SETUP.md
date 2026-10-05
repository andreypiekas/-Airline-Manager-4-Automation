# Configuração completa — Fork, GitHub Actions e cron-job.org

Este é o fluxo recomendado para utilizar o **Airline Manager 4 Automation** na sua própria conta:

```text
Fork do repositório
        ↓
habilitar GitHub Actions no fork
        ↓
configurar Secrets e Variables no fork
        ↓
executar primeiro em simulation
        ↓
validar os relatórios
        ↓
executar em production
        ↓
configurar cron-job.org apontando para o fork
```

> [!IMPORTANT]
> **Não configure sua conta diretamente no repositório original.** Cada usuário deve criar um **fork** e executar a automação no próprio repositório.

> [!WARNING]
> Projeto não oficial. Automação pode contrariar regras ou termos do Airline Manager 4. Não existe garantia contra bloqueios, limitações ou banimento.

## 1. Criar seu fork

Abra o repositório original:

```text
https://github.com/andreypiekas/Airline-Manager-4-Automation
```

No canto superior direito:

```text
Fork
→ Create a new fork
```

Mantenha a branch padrão `main`.

O resultado será semelhante a:

```text
SEU_USUARIO/Airline-Manager-4-Automation
```

A partir daqui, **todas as configurações descritas neste guia são feitas no seu fork**.

### Atualizações futuras

Quando o projeto original receber melhorias, use o recurso de sincronização do GitHub:

```text
Sync fork
→ Update branch
```

Revise alterações operacionais antes de colocá-las em produção.

## 2. Habilitar GitHub Actions no fork

Workflows de forks podem precisar ser habilitados antes da primeira execução.

No seu fork:

```text
Actions
→ I understand my workflows, go ahead and enable them
```

Depois confirme que os workflows aparecem na aba **Actions**.

> Secrets do repositório original não são transferidos para o seu fork. Você precisa configurar os seus próprios Secrets e Variables.

## 3. Configurar Actions Secrets

No **seu fork**:

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
→ New repository secret
```

### Obrigatórios

| Secret | Valor |
| --- | --- |
| `EMAIL` | E-mail da sua conta no Airline Manager 4 |
| `PASSWORD` | Senha da sua conta no Airline Manager 4 |

### Telegram opcional

| Secret | Valor |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token fornecido pelo BotFather |
| `TELEGRAM_CHAT_ID` | ID da conversa ou grupo que receberá o resumo |

O `TELEGRAM_CHAT_ID` é o ID da conversa, não o ID do próprio bot.

Não coloque Secrets em arquivos, commits, Variables públicas ou no cron-job.org.

## 4. Configurar Actions Variables

No **seu fork**:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

### Estado e departures

| Variable | Valor sugerido | Observação |
| --- | --- | --- |
| `RETURN_JOURNAL_SCOPE` | `am4-prod` | Namespace do estado persistente |
| `AIRLINE_BASES_JSON` | configure seus hubs | Fallback para funções que exigem origem operacional |
| `AIRCRAFT_ORIGINS_JSON` | `[]` | Overrides por aircraftId, se necessários |
| `ROUTE_REVIEW_TIMEZONE` | seu fuso | Fuso da revisão diária |
| `EXECUTE_INDIVIDUAL` | `true` | Compatibilidade do resolvedor |
| `MAX_INDIVIDUAL_DEPARTURES` | `20` | Hard cap atual: 20 |

Exemplo:

```text
AIRLINE_BASES_JSON=["AAA","BBB"]
AIRCRAFT_ORIGINS_JSON=[]
ROUTE_REVIEW_TIMEZONE=America/Sao_Paulo
```

Substitua `AAA` e `BBB` pelos IATAs reais dos hubs da sua companhia.

A descoberta live é a fonte principal quando todos os hubs podem ser resolvidos. `AIRLINE_BASES_JSON` funciona como fallback.

A lista de hubs **não limita departures de rotas já existentes**.

### Demanda

| Variable | Valor sugerido |
| --- | ---: |
| `MIN_DEMAND_PERCENTAGE` | `80` |
| `DEMAND_THRESHOLD_MODE` | `aggregate` |
| `DEMAND_POOL_SCOPE` | `airport-pair` |
| `DEMAND_MAX_AGE_SECONDS` | `300` |
| `DEMAND_PROLONGED_HOLD_MINUTES` | `180` |

### Route research, review e reroute

| Variable | Valor sugerido |
| --- | ---: |
| `ENABLE_ROUTE_RESEARCH` | `true` |
| `ROUTE_RESEARCH_MAX_AIRCRAFT` | `3` |
| `ROUTE_RESEARCH_MAX_SUGGESTIONS` | `5` |
| `ROUTE_RESERVATION_NEXT_LEGS` | `2` |
| `ROUTE_RESERVATION_POOL_SCOPE` | `airport-pair` |
| `ENABLE_ROUTE_OPTIMIZER` | `true` |
| `ROUTE_MIN_OCCUPANCY_PERCENT` | `80` |
| `ROUTE_MIN_IMPROVEMENT_PERCENT` | `0` |
| `ENABLE_ROUTE_EXECUTION` | `true` |
| `ROUTE_MAX_REROUTES_PER_RUN` | `1` |

`ENABLE_ROUTE_EXECUTION=true` não força uma troca. O executor ainda exige comparação completa, alvo fresco, `comparisonReady` e `mutationAuthorized`.

### Pricing

| Variable | Valor sugerido |
| --- | ---: |
| `ENABLE_TICKET_PRICING` | `true` |
| `ENABLE_TICKET_PRICING_EXECUTION` | `true` |
| `TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN` | `5` |

Política PAX:

```text
Y = Auto × 1.10
J = Auto × 1.08
F = Auto × 1.06
```

### Fuel e CO₂

| Variable | Valor sugerido |
| --- | ---: |
| `ENABLE_FUEL` | `true` |
| `MAX_FUEL_PRICE` | `550` |
| `MAX_CO2_PRICE` | `120` |
| `MAX_FUEL_PURCHASE_PER_RUN` | `0` |
| `MAX_CO2_PURCHASE_PER_RUN` | `0` |
| `MIN_CASH_RESERVE` | `0` |

Revise os tetos antes de usar produção. Eles são política do bot, não valores oficiais ou garantidos pelo jogo.

### Manutenção e campanhas

| Variable | Valor sugerido |
| --- | ---: |
| `ENABLE_MAINTENANCE` | `true` |
| `REPAIR_WEAR` | `30` |
| `HOURS_CHECK` | `20` |
| `ENABLE_CAMPAIGN` | `true` |
| `INCREASE_AIRLINE_REPUTATION` | `true` |
| `CAMPAIGN_TYPE` | `1` |
| `CAMPAIGN_DURATION` | `4` |
| `ENABLE_DEPART` | `true` |

## 5. Exemplo completo de Variables

Use como referência e adapte antes da produção:

```text
RETURN_JOURNAL_SCOPE=am4-prod
AIRLINE_BASES_JSON=["AAA","BBB"]
AIRCRAFT_ORIGINS_JSON=[]
ROUTE_REVIEW_TIMEZONE=America/Sao_Paulo

EXECUTE_INDIVIDUAL=true
MAX_INDIVIDUAL_DEPARTURES=20

MIN_DEMAND_PERCENTAGE=80
DEMAND_THRESHOLD_MODE=aggregate
DEMAND_POOL_SCOPE=airport-pair
DEMAND_MAX_AGE_SECONDS=300
DEMAND_PROLONGED_HOLD_MINUTES=180

ENABLE_ROUTE_RESEARCH=true
ROUTE_RESEARCH_MAX_AIRCRAFT=3
ROUTE_RESEARCH_MAX_SUGGESTIONS=5
ROUTE_RESERVATION_NEXT_LEGS=2
ROUTE_RESERVATION_POOL_SCOPE=airport-pair

ENABLE_ROUTE_OPTIMIZER=true
ROUTE_MIN_OCCUPANCY_PERCENT=80
ROUTE_MIN_IMPROVEMENT_PERCENT=0
ENABLE_ROUTE_EXECUTION=true
ROUTE_MAX_REROUTES_PER_RUN=1

ENABLE_TICKET_PRICING=true
ENABLE_TICKET_PRICING_EXECUTION=true
TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN=5

ENABLE_FUEL=true
MAX_FUEL_PRICE=550
MAX_CO2_PRICE=120
MAX_FUEL_PURCHASE_PER_RUN=0
MAX_CO2_PURCHASE_PER_RUN=0
MIN_CASH_RESERVE=0

ENABLE_MAINTENANCE=true
REPAIR_WEAR=30
HOURS_CHECK=20

ENABLE_CAMPAIGN=true
INCREASE_AIRLINE_REPUTATION=true
CAMPAIGN_TYPE=1
CAMPAIGN_DURATION=4

ENABLE_DEPART=true
```

## 6. Primeira execução: Simulation

No seu fork:

```text
Actions
→ Automacao Airline Manager 4
→ Run workflow
```

Selecione:

```text
departure_mode = simulation
```

A simulation é a primeira validação recomendada porque mantém as principais mutações desativadas.

Confira:

- workflow concluído;
- GitHub Step Summary;
- hubs detectados;
- frota;
- demanda;
- artifacts;
- ausência de erro de configuração.

## 7. Primeira execução de produção

Somente depois da simulation:

```text
Actions
→ Automacao Airline Manager 4
→ Run workflow
→ departure_mode = production
```

Revise o Summary depois da run.

`success` significa que o fluxo terminou de forma consistente; pode haver zero mutações se os gates resultarem em HOLD.

---

# cron-job.org

## 8. Criar um Fine-grained PAT

O cron precisa acionar o workflow **do seu fork**.

Na sua conta do GitHub:

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
→ Generate new token
```

Configuração recomendada:

```text
Token name: am4-cron-dispatch
Repository access: Only select repositories
Repository: SEU_USUARIO/Airline-Manager-4-Automation
Repository permissions:
  Actions: Read and write
```

Defina uma expiração adequada e guarde o token em local seguro.

O endpoint de `workflow_dispatch` exige permissão de escrita em Actions.

## 9. Criar o cron job

No cron-job.org:

```text
Dashboard
→ Cronjobs
→ Create cronjob
```

### URL

Use **o seu fork**, não o repositório original:

```text
https://api.github.com/repos/SEU_USUARIO/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches
```

Se você alterou o nome do fork, substitua também o nome do repositório na URL.

### Método

```text
POST
```

### Headers

```text
Accept: application/vnd.github+json
Authorization: Bearer SEU_TOKEN_FINE_GRAINED
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

Não coloque o token na URL.

### Body

```json
{
  "ref": "main"
}
```

O workflow atual usa `production` como modo padrão. Portanto, o cron só deve ser ativado depois que a execução manual de produção estiver validada.

### Frequência

Uma referência prática é:

```text
a cada 30 minutos
```

O workflow possui controle de concorrência para não operar duas runs simultaneamente.

Não ative atraso aleatório no cron sem uma necessidade específica.

## 10. Resposta esperada

Quando o GitHub aceita o dispatch:

```text
HTTP 204 No Content
```

`204` significa apenas que a API aceitou criar a execução.

Depois confirme no **seu fork**:

```text
Actions
→ Automacao Airline Manager 4
```

## 11. Teste com curl

```bash
curl --request POST \
  --url "https://api.github.com/repos/SEU_USUARIO/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches" \
  --header "Accept: application/vnd.github+json" \
  --header "Authorization: Bearer SEU_TOKEN_FINE_GRAINED" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --header "Content-Type: application/json" \
  --data '{"ref":"main"}'
```

Resposta esperada: `204`.

## 12. O que fica em cada serviço

### GitHub Secrets

```text
EMAIL
PASSWORD
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

### GitHub Variables

Políticas de demanda, rotas, pricing, supplies, manutenção e execução.

### cron-job.org

Somente:

- URL de dispatch do **seu fork**;
- Fine-grained PAT;
- headers;
- body do workflow_dispatch;
- agenda.

Nunca coloque credenciais do AM4 no cron-job.org.

## 13. Troubleshooting

### O fork não executa workflows

Abra a aba **Actions** no fork e habilite os workflows.

### 401 — Bad credentials

PAT inválido, expirado ou copiado incorretamente.

### 403 — Forbidden

Confirme:

- PAT vinculado ao **fork**;
- `Actions: Read and write`;
- token ainda válido.

### 404 — Not Found

Confira:

- seu usuário/organização;
- nome do fork;
- `playwright.yml`;
- acesso do PAT ao fork.

### 422 — Unprocessable Entity

Confira se a branch `main` existe e se o body contém um `ref` válido.

### 204, mas nada mudou no jogo

O cron funcionou. Abra a run no GitHub. O bot pode ter terminado em HOLD, não haver aeronaves prontas ou uma fase de segurança ter bloqueado a mutação.

## 14. Checklist

- [ ] fiz fork de `andreypiekas/Airline-Manager-4-Automation`
- [ ] estou configurando **meu fork**, não o original
- [ ] habilitei GitHub Actions no fork
- [ ] criei `EMAIL` e `PASSWORD` como Secrets
- [ ] configurei `AIRLINE_BASES_JSON` com meus hubs
- [ ] revisei as demais Variables
- [ ] configurei Telegram, se desejado
- [ ] executei `simulation`
- [ ] revisei Summary e artifacts
- [ ] executei produção manualmente
- [ ] criei PAT limitado ao meu fork
- [ ] configurei cron-job.org com a URL do meu fork
- [ ] confirmei retorno HTTP `204`
- [ ] confirmei a nova run na aba Actions
