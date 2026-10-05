# Operação do bot

Guia rápido para executar o **Airline Manager 4 Automation**. Para todos os parâmetros disponíveis, consulte [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

Instalação inicial, Secrets, Variables e cron-job.org: [docs/GITHUB_AND_CRON_SETUP.md](docs/GITHUB_AND_CRON_SETUP.md).

## Workflow principal

```text
.github/workflows/playwright.yml
```

O workflow usa `workflow_dispatch`. Não existe agendamento interno obrigatório: a execução pode ser manual ou acionada por uma integração externa.

## Modos

### Produção

```text
departure_mode=production
```

Habilita os módulos de produção que estiverem configurados. Cada mutação ainda precisa passar pelos próprios gates de segurança.

### Simulação

```text
departure_mode=simulation
```

Mantém as principais mutações desativadas e é o modo recomendado para inspeções controladas.

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

## Agendamento externo

Um serviço externo pode chamar:

```text
POST https://api.github.com/repos/andreypiekas/Airline-Manager-4-Automation/actions/workflows/playwright.yml/dispatches
```

Body mínimo:

```json
{"ref":"main"}
```

Use um Fine-grained Personal Access Token restrito ao repositório e com a permissão mínima necessária para executar Actions.

## Como interpretar uma run

`success` significa que o workflow concluiu de forma consistente. Não significa que todas as fases realizaram mutações.

Uma execução pode terminar sem decolagens, compras, pricing ou reroutes quando, por exemplo:

- não há aeronaves prontas;
- a demanda está abaixo do threshold;
- o preço de um recurso está acima do teto;
- o preço PAX já está correto;
- faltam evidências para route review;
- existe uma quarentena persistente;
- o orçamento de tempo bloqueou a fase.

Consulte primeiro o **GitHub Step Summary** e depois os artifacts detalhados.

## Estado persistente

A branch de runtime é:

```text
am4-runtime-state
```

O journal e as quarentenas não devem ser apagados apenas para liberar uma nova tentativa. Um resultado incerto precisa permanecer bloqueado até existir evidência segura para tratamento.

## Antes de publicar alteração operacional

```bash
npm run typecheck
npm run build:state
node scripts/company-dashboard.cjs --self-test
npm test
```

Depois, confirme que o workflow `validate.yml` ficou verde. Não use uma produção real apenas para exercitar um caminho de teste.
