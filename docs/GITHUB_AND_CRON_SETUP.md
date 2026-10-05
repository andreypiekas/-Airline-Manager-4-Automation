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

Na tela de criação:

- mantenha a branch padrão `main`;
- **selecione `Copy the DEFAULT branch only`**.

O fork não deve copiar a branch de runtime do upstream. Na primeira execução, o workflow cria automaticamente no seu fork:

```text
am4-runtime-state
return-journal-<scope>.json
```

Esse journal começa vazio e passa a pertencer somente à sua instalação.

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

> Se você já criou um fork copiando todas as branches, remova a branch `am4-runtime-state` do **seu fork antes da primeira execução**. O workflow recriará um estado vazio automaticamente.

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

## 4. Variables avançadas

As demais opções de comportamento são configuradas como **Repository Variables** no seu fork:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

Você não precisa criar todas elas. O workflow já possui defaults para a operação normal.

A referência completa e centralizada está em:

**[VARIABLES.md — todas as Variables, defaults, efeitos e recomendações](VARIABLES.md)**

Use esse arquivo para configurar ou personalizar:

- hubs e origem operacional;
- estado persistente;
- limites de departures;
- Demand Manager;
- route research;
- route review e reroute;
- pricing;
- Fuel e CO₂;
- manutenção;
- campanhas;
- observabilidade.

Depois de alterar uma opção operacional importante, valide primeiro em `simulation`.

## 5. Primeira execução: Simulation

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

## 6. Primeira execução de produção

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

## 7. Criar um Fine-grained PAT

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

## 8. Criar o cron job

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

## 9. Resposta esperada

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

## 10. Teste com curl

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

## 11. O que fica em cada serviço

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

## 12. Troubleshooting

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

## 13. Checklist

- [ ] fiz fork de `andreypiekas/Airline-Manager-4-Automation`
- [ ] copiei somente a branch padrão durante o fork
- [ ] estou configurando **meu fork**, não o original
- [ ] habilitei GitHub Actions no fork
- [ ] criei `EMAIL` e `PASSWORD` como Secrets
- [ ] consultei `docs/VARIABLES.md` e personalizei somente o que preciso
- [ ] configurei Telegram, se desejado
- [ ] executei `simulation`
- [ ] revisei Summary e artifacts
- [ ] executei produção manualmente
- [ ] criei PAT limitado ao meu fork
- [ ] configurei cron-job.org com a URL do meu fork
- [ ] confirmei retorno HTTP `204`
- [ ] confirmei a nova run na aba Actions
