# Configuração

Este documento resume a configuração básica do fork: **Secrets** e **inputs do workflow**.

Para as opções avançadas de comportamento do bot, consulte:

**[VARIABLES.md — referência completa de GitHub Actions Variables](VARIABLES.md)**

Para o passo a passo de instalação, Fork e cron-job.org, consulte:

**[GITHUB_AND_CRON_SETUP.md](GITHUB_AND_CRON_SETUP.md)**

## Secrets

Configure em:

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
```

### Obrigatórios

| Secret | Uso |
| --- | --- |
| `EMAIL` | Login da sua conta no Airline Manager 4 |
| `PASSWORD` | Senha da sua conta |

### Telegram opcional

| Secret | Uso |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token do bot criado no Telegram |
| `TELEGRAM_CHAT_ID` | ID da conversa ou grupo que receberá notificações |

Secrets não devem ser colocados em Variables, arquivos, commits ou no cron-job.org.

## Inputs de workflow_dispatch

Ao executar manualmente:

```text
Actions
→ Automacao Airline Manager 4
→ Run workflow
```

o workflow principal aceita os seguintes inputs.

| Input | Padrão | Uso |
| --- | --- | --- |
| `departure_mode` | `production` | Escolhe `production` ou `simulation` |
| `execute_individual` | `true` | Compatibilidade com versões anteriores |
| `max_individual_departures` | `0` | `0` usa a política configurada no repositório |
| `aktifkan_random_delay` | `false` | Atraso aleatório opcional |
| `paksa_simpan_video` | `false` | Gravação de vídeo para diagnóstico |

### `departure_mode`

#### Simulation

```text
departure_mode=simulation
```

Mantém as principais mutações desativadas. É o modo recomendado para a primeira execução de um fork ou depois de mudanças importantes de configuração.

#### Production

```text
departure_mode=production
```

Permite os módulos de produção, ainda sujeitos aos gates fail-closed de cada operação.

## Configuração avançada

As Repository Variables controlam, entre outros pontos:

- hubs e origem operacional;
- estado persistente;
- limite de departures;
- Demand Manager;
- route research;
- route review e reroute;
- pricing PAX;
- Fuel e CO₂;
- manutenção;
- campanhas;
- observabilidade.

Elas não são listadas novamente aqui para evitar documentação duplicada.

Use a referência central:

**[VARIABLES.md](VARIABLES.md)**

Lá cada Variable possui:

- valor padrão;
- formato aceito;
- efeito no bot;
- recomendação de uso;
- alertas sobre opções internas que não devem ser criadas manualmente.
