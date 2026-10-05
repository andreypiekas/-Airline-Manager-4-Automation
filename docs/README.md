# Documentação técnica

A documentação está dividida entre **referência atual** e **histórico**.

## Referência atual

| Documento | Conteúdo |
| --- | --- |
| [GITHUB_AND_CRON_SETUP.md](GITHUB_AND_CRON_SETUP.md) | Instalação completa no GitHub e cron-job.org |
| [CONFIGURATION.md](CONFIGURATION.md) | Secrets, inputs, Variables, defaults e limites |
| [DEMAND_MANAGER.md](DEMAND_MANAGER.md) | Demanda, pools, thresholds e decisão de departure |
| [PRODUCTION_DEPARTURES.md](PRODUCTION_DEPARTURES.md) | Execução individual de decolagens |
| [ROUTES_AND_PRICING.md](ROUTES_AND_PRICING.md) | Pricing PAX, route review e reroute |
| [SUPPLIES.md](SUPPLIES.md) | Fuel e CO₂ |
| [RESERVATIONS_AND_COSTS.md](RESERVATIONS_AND_COSTS.md) | Reservas e evidência econômica de candidatos |
| [OCCUPANCY_AUDIT.md](OCCUPANCY_AUDIT.md) | Auditoria observacional de passageiros embarcados |
| [REFERENCE_DATA.md](REFERENCE_DATA.md) | Catálogos e referências estáticas |
| [REPORTS_AND_TELEGRAM.md](REPORTS_AND_TELEGRAM.md) | Summary, artifacts e Telegram |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Estado técnico atual do projeto |

Para uso diário, veja também [AUTOMACAO.md](../AUTOMACAO.md).

## Histórico

Relatórios de etapas anteriores ficam em [archive/](archive/). Eles servem como registro de evolução e **não** substituem a documentação atual.

## Regra de precedência

Em caso de divergência, considere nesta ordem:

1. código da branch `main`;
2. [CONFIGURATION.md](CONFIGURATION.md);
3. [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md);
4. demais documentos atuais;
5. conteúdo de [archive/](archive/).
