# Auditoria de ocupação

A auditoria de ocupação é **observacional**. Ela descreve voos já em andamento e não autoriza departure ou reroute.

## Fonte

O coletor lê `Onboard: Y / J / F` dos cartões em voo e compara os passageiros observados com o layout da aeronave.

Relatório:

```text
test-results/demand/occupancy-audit.json
```

## Estados

| Estado | Significado |
| --- | --- |
| `empty` | zero passageiros confirmado |
| `low` | ocupação abaixo do threshold |
| `sufficient` | no limite ou acima |
| `unavailable` | evidência insuficiente |

O cálculo usa passageiros físicos e assentos físicos. Classes J/F não recebem peso econômico nesta auditoria.

## Fail-safe

O cálculo fica indisponível quando há:

- coleta incompleta;
- identidade duplicada;
- leitura expirada;
- capacidade inválida;
- passageiros negativos;
- passageiros acima da capacidade;
- capacidade total igual a zero.

Campo desconhecido nunca é convertido em zero.

## Limites

A auditoria:

- não prevê ocupação futura;
- não explica por que um voo teve baixa ocupação;
- não substitui demanda restante;
- não comprova rentabilidade;
- não autoriza mudança de rota.

A decisão de departure continua pertencendo ao Demand Manager. Route review usa suas próprias evidências econômicas.
