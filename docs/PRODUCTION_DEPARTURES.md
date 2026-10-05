# Decolagens individuais

O executor de departure processa **rotas já existentes** de forma individual e conservadora.

## Escopo

A fase é **base-agnostic**.

Se uma aeronave está pronta e já possui uma rota válida no AM4, ela pode ser avaliada em qualquer aeroporto. Hubs da companhia não são usados como filtro de departure.

A noção de base operacional continua relevante para route review e reroute, mas não para o despacho normal de uma rota já atribuída.

## Gates

Antes de um clique real, o executor exige:

- coleção inicial completa;
- aircraftId e routeId únicos;
- aeronave pronta;
- contexto ainda igual ao snapshot inicial;
- leitura fresca de layout e demanda;
- Demand Manager autorizando a saída;
- controle nativo de `Depart` visível, habilitado e com handler reconhecido;
- nenhuma quarentena persistente para a aeronave/rota;
- limite por run disponível;
- orçamento de tempo suficiente;
- política de Fuel satisfeita quando houver evidência histórica utilizável;
- campanhas obrigatórias confirmadas como ativas quando `ENABLE_CAMPAIGN=true`.

## Fluxo

1. coletar a frota completa;
2. selecionar aeronaves que não estão em voo;
3. validar identidade e unicidade;
4. reabrir os detalhes do alvo;
5. reler estado, layout e demanda;
6. executar novamente a análise de demanda para o alvo;
7. verificar guards de recursos, quarentenas e campanhas;
8. se a campanha exigida não estiver confirmada, manter `CAMPAIGN_NOT_VERIFIED` sem abrir o controle de departure;
9. persistir a intenção;
10. executar no máximo um clique nativo;
11. reler o alvo;
12. confirmar estado em voo, countdown e passageiros embarcados;
13. persistir o resultado.

## Sem retry após clique incerto

Depois que o clique foi tentado, o executor não repete a operação automaticamente.

Se a resposta ou a confirmação posterior ficar incerta:

```text
outcome_unknown
```

A sequência é interrompida e a tentativa é registrada para impedir repetição cega em runs futuras.

## Fuel

Quando a run possui estoque de combustível verificado e o Flight History fornece evidência consistente de consumo para aquele par de aeroportos, o executor reserva esse consumo ao longo da sequência.

Sem evidência suficiente, a política pode manter a aeronave em HOLD em vez de inventar um requisito de combustível.

## Configuração

Principais parâmetros:

```text
MAX_INDIVIDUAL_DEPARTURES=20
MIN_DEMAND_PERCENTAGE=80
DEMAND_THRESHOLD_MODE=aggregate
DEMAND_POOL_SCOPE=airport-pair
DEMAND_MAX_AGE_SECONDS=300
```

`departure_mode=simulation` percorre os mesmos gates sem executar o clique.

## Relatório

`execution-report.json/.md` registra:

- quantidade avaliada;
- confirmadas;
- simuladas;
- retidas;
- incertas;
- motivo de cada decisão;
- evidência de demanda;
- passageiros embarcados quando disponíveis.

Uma run verde com zero departures pode ser comportamento correto.
