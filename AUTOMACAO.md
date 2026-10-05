# Operação do bot

Guia rápido para operação diária do **Airline Manager 4 Automation**. A referência completa está em [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Workflow de produção

```text
.github/workflows/playwright.yml
```

O workflow aceita acionamento manual e via API `workflow_dispatch`. Não existe `schedule` interno.

## cron-job.org

Configuração recomendada:

```text
Método: POST
URL: https://api.github.com/repos/andreypiekas/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches

Accept: application/vnd.github+json
Authorization: Bearer SEU_TOKEN
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

Body:

```json
{"ref":"main"}
```

Periodicidade operacional atual: **30 minutos**.

Use Fine-grained PAT restrito ao repositório com **Actions: Read and write**.

## Secrets

Obrigatórios:

```text
EMAIL
PASSWORD
```

Opcionais para Telegram:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## Como interpretar uma run

`success` significa que o workflow concluiu de forma consistente. Não significa que toda fase necessariamente realizou mutação.

É normal uma run verde terminar sem decolagens, reroutes ou compras quando:

- não há aeronaves prontas;
- demanda está abaixo do threshold;
- recurso está acima do teto;
- preços já estão no alvo;
- route review ficou em HOLD;
- existe quarentena;
- faltou evidência suficiente;
- orçamento de tempo bloqueou a fase.

Leia o **Summary executivo** e use o artifact `demand-report` para detalhes.

## Simulation

Escolha:

```text
departure_mode=simulation
```

Esse modo impede as principais mutações e é apropriado para inspeções controladas.

## Estado persistente

Branch:

```text
am4-runtime-state
```

Não apague o journal ou as quarentenas para liberar uma nova tentativa. Resultado incerto precisa permanecer bloqueado até existir evidência segura para tratamento manual.

## Telegram

O workflow envia um resumo agregado ao final quando os Secrets estão configurados. Veja [docs/REPORTS_AND_TELEGRAM.md](docs/REPORTS_AND_TELEGRAM.md).

## Antes de publicar alteração operacional

```bash
npm run typecheck
npm run build:state
node scripts/company-dashboard.cjs --self-test
npm test
```

Depois aguarde `validate.yml` verde. Não use uma produção real apenas para “testar se passa”.
