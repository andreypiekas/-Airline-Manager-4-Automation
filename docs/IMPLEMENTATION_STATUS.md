# Estado da implementação

Resumo técnico da branch `main`.

## Componentes

| Componente | Estado |
| --- | --- |
| Login e coleta Fleet | Produção |
| Descoberta dinâmica de hubs | Produção |
| Demand Manager | Produção |
| Threshold adaptativo | Produção, conservador |
| Departure individual | Produção, base-agnostic |
| Fuel | Produção |
| CO₂ | Produção com fail-safe/quarentena |
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
| Telegram | Implementado |
| Execução a partir de forks | Suportada |
| Compra automática de aeronaves | Fora do escopo |

## Arquitetura atual

### Forks

Produção pode ser executada no fork de cada usuário. Os guards validam o contexto real do GitHub Actions, o run e a primeira tentativa, sem exigir o nome do repositório original.

Secrets e Variables não são compartilhados com o upstream e devem ser configurados no fork.

### Departures

Rotas existentes podem ser processadas em qualquer aeroporto. A lista de hubs não é filtro de departure.

### Hubs e origem operacional

A lista de hubs é descoberta dinamicamente pela interface e cruzada com o catálogo de aeroportos. O fallback configurado existe para continuidade quando a leitura live não puder ser comprovada.

Origem operacional é necessária para funções como revisão de retorno e reroute.

### Route review

A revisão pode ocorrer após retorno confirmado à própria base ou por revisão diária quando a aeronave está em solo nessa base.

Comparações incompletas resultam em HOLD.

### Pricing

O Auto Price nativo é usado como referência. Save real exige confirmação posterior.

### Supplies

Fuel e CO₂ dependem do preço live. Referências externas não autorizam compra.

## Safeguards que não devem ser enfraquecidos

- `comparisonReady`;
- `mutationAuthorized`;
- ACKs internos de execução;
- validação de contexto do GitHub Actions;
- `GITHUB_RUN_ATTEMPT=1`;
- verificação de SHA antes do acesso ao jogo;
- journal persistente;
- no-retry após mutação incerta;
- confirmação pós-clique/pós-Save;
- preço live para supplies;
- orçamento de tempo;
- limites de mutações por run.

## Quarentenas

Resultados incertos de departure, pricing, reroute ou supplies devem permanecer bloqueados até existir evidência segura para resolução.

Apagar estado para forçar nova tentativa contraria o desenho fail-closed.

## Observabilidade

A execução produz:

- Summary executivo;
- artifacts JSON/Markdown;
- estados operacionais;
- diagnósticos de UI;
- histórico persistente;
- notificação opcional via Telegram.

## Limitações conhecidas

- candidatos limitados não provam ótimo global;
- custos econômicos incompletos impedem reroute;
- dados estáticos não substituem observações live;
- alterações na UI do AM4 podem acionar fail-safe;
- o projeto não garante compatibilidade com regras futuras do jogo;
- automação não elimina risco de medidas da plataforma contra contas automatizadas.

Consulte [CONFIGURATION.md](CONFIGURATION.md) para configuração, [GITHUB_AND_CRON_SETUP.md](GITHUB_AND_CRON_SETUP.md) para instalação e [archive/](archive/) para histórico de desenvolvimento.
