# Configuração completa do GitHub e cron-job.org

Este guia prepara o **Airline Manager 4 Automation** para execução pelo GitHub Actions e, opcionalmente, para acionamento periódico pelo **cron-job.org**.

> [!IMPORTANT]
> As credenciais do Airline Manager 4 devem permanecer exclusivamente nos **GitHub Actions Secrets**. Não coloque e-mail, senha, tokens do Telegram ou conteúdo do journal no cron-job.org.

## 1. Preparar o repositório

O workflow principal é:

```text
.github/workflows/playwright.yml
```

A execução é iniciada por `workflow_dispatch`, manualmente pelo GitHub ou por uma chamada autenticada à API.

Para o repositório oficial:

```text
andreypiekas/Airline-Manager-4-Automation
```

> [!NOTE]
> O runtime de produção possui guards de contexto para evitar execução em ambiente inesperado. Se você estiver adaptando o projeto para outro repositório, revise esses guards antes de tentar produção.

## 2. Configurar GitHub Actions Secrets

No GitHub:

```text
Repository
→ Settings
→ Secrets and variables
→ Actions
→ Secrets
→ New repository secret
```

### Obrigatórios

| Secret | Valor |
| --- | --- |
| `EMAIL` | E-mail da conta utilizada no AM4 |
| `PASSWORD` | Senha da conta utilizada no AM4 |

### Opcionais — Telegram

| Secret | Valor |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token fornecido pelo BotFather |
| `TELEGRAM_CHAT_ID` | ID da conversa ou grupo que receberá o resumo |

O `TELEGRAM_CHAT_ID` é o ID do destino da mensagem, não o ID do próprio bot.

## 3. Configurar GitHub Actions Variables

No GitHub:

```text
Repository
→ Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

### Estado e departures

| Variable | Valor sugerido | Observação |
| --- | --- | --- |
| `RETURN_JOURNAL_SCOPE` | `am4-prod` | Namespace do estado persistente |
| `AIRLINE_BASES_JSON` | `["AAA","BBB"]` | Substitua pelos IATAs dos seus hubs; funciona como fallback |
| `AIRCRAFT_ORIGINS_JSON` | `[]` | Overrides por aircraftId quando necessários |
| `ROUTE_REVIEW_TIMEZONE` | `America/Sao_Paulo` | Fuso usado na revisão diária |
| `MAX_INDIVIDUAL_DEPARTURES` | `20` | Limite por execução |
| `EXECUTE_INDIVIDUAL` | `true` | Compatibilidade do resolvedor de departures |

A descoberta live de hubs é a fonte principal quando pode ser comprovada. `AIRLINE_BASES_JSON` é um fallback e deve conter **os hubs da sua própria companhia**, não os exemplos acima.

O executor de departure é base-agnostic: a lista de hubs não limita rotas já existentes.

### Demanda

| Variable | Valor sugerido |
| --- | ---: |
| `MIN_DEMAND_PERCENTAGE` | `80` |
| `DEMAND_THRESHOLD_MODE` | `aggregate` |
| `DEMAND_POOL_SCOPE` | `airport-pair` |
| `DEMAND_MAX_AGE_SECONDS` | `300` |
| `DEMAND_PROLONGED_HOLD_MINUTES` | `180` |

### Pesquisa, review e reroute

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

`ENABLE_ROUTE_EXECUTION=true` não força reroute. A mutação ainda depende de comparação completa, alvo fresco e dos gates `comparisonReady` e `mutationAuthorized`.

### Pricing PAX

| Variable | Valor sugerido |
| --- | ---: |
| `ENABLE_TICKET_PRICING` | `true` |
| `ENABLE_TICKET_PRICING_EXECUTION` | `true` |
| `TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN` | `5` |

Política implementada:

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

Valor `0` nos limites de quantidade significa usar o espaço disponível, respeitando orçamento e demais guards.

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

## 4. Configuração sugerida completa

Exemplo para copiar e adaptar em **Actions → Variables**:

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

## 5. Testar manualmente no GitHub

Abra:

```text
Repository
→ Actions
→ Automacao Airline Manager 4
→ Run workflow
```

Para uma primeira inspeção, use:

```text
departure_mode = simulation
```

Depois de validar Secrets, Variables, Summary e artifacts, produção pode usar:

```text
departure_mode = production
```

Uma run verde não significa obrigatoriamente que houve mutação. HOLDs podem ser o resultado correto.

---

# Configurar cron-job.org

## 6. Criar um token do GitHub

Na sua conta GitHub:

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
→ Generate new token
```

Recomendação:

- dê um nome específico, por exemplo `am4-cron-dispatch`;
- limite o acesso somente ao repositório do bot;
- defina uma expiração adequada;
- em **Repository permissions**, conceda **Actions: Read and write**;
- mantenha as demais permissões no mínimo necessário.

Copie o token no momento da criação. Ele será usado apenas pelo cron-job.org para disparar o workflow.

## 7. Criar o cron job

No cron-job.org:

```text
Dashboard
→ Cronjobs
→ Create cronjob
```

### Geral

```text
Title: Airline Manager 4 Automation
URL: https://api.github.com/repos/OWNER/REPOSITORY/actions/workflows/playwright.yml/dispatches
Schedule: a cada 30 minutos
```

No repositório oficial, o endpoint é:

```text
https://api.github.com/repos/andreypiekas/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches
```

### Request method

```text
POST
```

### Headers

Adicione:

```text
Accept: application/vnd.github+json
Authorization: Bearer SEU_TOKEN_FINE_GRAINED
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

Não coloque o token na URL.

### Request body

A configuração mais simples usa os defaults do workflow:

```json
{
  "ref": "main"
}
```

Isso usa `departure_mode=production` porque esse é o default atual do workflow.

Para cron periódico, mantenha `aktifkan_random_delay=false`; o workflow já possui controle de concorrência e o atraso aleatório pode consumir desnecessariamente a janela entre execuções.

## 8. Resultado esperado

Quando o GitHub aceita o dispatch, a resposta normal da API é:

```text
HTTP 204 No Content
```

Isso significa apenas que **o GitHub aceitou iniciar o workflow**. Não significa que o bot terminou nem que realizou operações no jogo.

Depois do teste, confira:

```text
Repository
→ Actions
→ Automacao Airline Manager 4
```

## 9. Frequência

Para o ambiente atual, **30 minutos** é uma cadência prática.

O workflow possui:

```text
concurrency.group: airline-manager-4-main
cancel-in-progress: false
```

Isso evita duas execuções operacionais simultâneas. Mesmo assim, não use uma frequência menor apenas para compensar runs longas.

## 10. Segurança do cron

No cron-job.org armazene somente:

- URL da API;
- token de dispatch do GitHub;
- headers;
- body do `workflow_dispatch`.

Não armazene lá:

- `EMAIL`;
- `PASSWORD`;
- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_CHAT_ID`;
- cookies;
- journal;
- dados da companhia.

Essas informações pertencem ao GitHub Secrets/estado persistente.

## 11. Teste equivalente com curl

Antes de configurar o cron, o dispatch pode ser validado manualmente:

```bash
curl --request POST \
  --url "https://api.github.com/repos/OWNER/REPOSITORY/actions/workflows/playwright.yml/dispatches" \
  --header "Accept: application/vnd.github+json" \
  --header "Authorization: Bearer SEU_TOKEN_FINE_GRAINED" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --header "Content-Type: application/json" \
  --data '{"ref":"main"}'
```

Resposta sem corpo com status `204` é o comportamento esperado.

## 12. Troubleshooting do cron

### 401 — Bad credentials

Token inválido, expirado ou copiado incorretamente.

### 403 — Forbidden

Revise o acesso do Fine-grained PAT ao repositório e a permissão **Actions: Read and write**.

### 404 — Not Found

Confira:

- owner;
- nome do repositório;
- nome `playwright.yml`;
- acesso do token ao repositório.

### 422 — Unprocessable Entity

Normalmente indica `ref` inexistente ou inputs incompatíveis.

### 204, mas não houve alteração no jogo

O dispatch funcionou. Abra o GitHub Actions e consulte o Summary. O bot pode ter concluído corretamente em HOLD, sem mutações.

## 13. Checklist final

- [ ] `EMAIL` configurado como Secret
- [ ] `PASSWORD` configurado como Secret
- [ ] Variables operacionais revisadas
- [ ] `AIRLINE_BASES_JSON` contém os hubs corretos do ambiente
- [ ] Telegram configurado, se desejado
- [ ] run manual em `simulation` validada
- [ ] run de produção revisada
- [ ] Fine-grained PAT criado somente para dispatch
- [ ] cron-job.org configurado com POST
- [ ] retorno `204` confirmado
- [ ] nova run apareceu no GitHub Actions
- [ ] frequência do cron revisada
