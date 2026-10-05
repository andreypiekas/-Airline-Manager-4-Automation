# GitHub Actions Variables — referência completa

Este documento reúne as **Repository Variables** usadas pelo Airline Manager 4 Automation.

Para criar ou alterar uma Variable no seu fork:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

> [!IMPORTANT]
> Você **não precisa criar todas as Variables**. Quando uma Variable não existe, o workflow aplica o valor padrão indicado neste documento. Altere somente o que você entende e realmente precisa personalizar.

> [!NOTE]
> Credenciais não pertencem aqui. `EMAIL`, `PASSWORD`, `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` são **Secrets**, não Variables.

## Como ler esta referência

Cada opção informa:

- **padrão** — valor usado quando a Variable não foi criada;
- **valores aceitos** — formato esperado;
- **efeito** — o que muda no bot;
- **recomendação** — quando vale a pena alterar.

Os valores são texto no GitHub, mesmo quando representam números ou booleanos.

---

# 1. Estado persistente e bases

## `RETURN_JOURNAL_SCOPE`

**Padrão:** `am4-prod`

**Formato:** letras, números, `_` e `-`, com até 100 caracteres.

Define o namespace do journal persistente. O arquivo correspondente é mantido na branch:

```text
am4-runtime-state
```

Em um fork novo, o workflow cria automaticamente um journal vazio para esse scope.

**Recomendação:** mantenha `am4-prod` em uma instalação normal. Trocar o scope faz o bot utilizar outro histórico, como se fosse um ambiente separado.

> Não altere o scope apenas para escapar de uma quarentena ou resultado incerto.

## `AIRLINE_BASES_JSON`

**Padrão:** vazio.

**Formato:** array JSON de códigos IATA em maiúsculas.

Exemplo:

```json
["AAA","BBB"]
```

Serve como **fallback** para funções que precisam conhecer os hubs da companhia, como route review e reroute.

A fonte principal continua sendo a descoberta live dos hubs no AM4. O fallback só entra quando a leitura live não consegue ser comprovada.

**Não limita departures.** Uma rota já existente pode ser despachada independentemente de estar ligada a um desses hubs.

**Recomendação:** configure os hubs reais da sua companhia para manter route review/reroute disponíveis mesmo quando a descoberta live falhar.

## `AIRCRAFT_ORIGINS_JSON`

**Padrão:** `[]`

**Formato:** array JSON com `aircraftId` e IATA da origem operacional.

Exemplo:

```json
[
  {
    "aircraftId": "123456",
    "origin": "AAA"
  }
]
```

É um override explícito para casos em que a origem de uma aeronave não pode ser inferida de maneira única.

Use o **aircraftId**, não matrícula ou apelido.

**Recomendação:** deixe `[]` e configure somente aeronaves realmente ambíguas, por exemplo rotas entre dois hubs.

## `ROUTE_REVIEW_TIMEZONE`

**Padrão no código:** `America/Sao_Paulo`

**Formato:** timezone IANA válido.

Exemplos:

```text
America/Sao_Paulo
America/New_York
Europe/Berlin
Asia/Tokyo
```

Define quando muda o “dia” usado pela revisão diária de rota.

**Recomendação:** ajuste para o fuso que você considera operacionalmente correto para sua companhia.

---

# 2. Modo semiautomático

## `SEMI_AUTOMATIC_MODE`

**Padrão:** `false`

**Aceita:** `true` ou `false`.

Quando `true`, execuções normais e chamadas do cron passam a funcionar como **análise sem mutações no jogo**.

O bot coleta e prepara informações como:

- aeronaves prontas;
- demanda suficiente/insuficiente;
- preço atual de Fuel e CO₂;
- ajustes de pricing identificados;
- candidatas de reroute;
- alertas e quarentenas.

Ao final, o Telegram recebe um resumo e um link para abrir o GitHub Actions.

Para executar operações reais, o usuário precisa iniciar uma run manual e marcar o input:

```text
confirm_semiautomatic_execution = true
```

Essa confirmação vale **somente para aquela run**. Na próxima execução automática, o modo volta a ser apenas análise.

Mesmo depois da confirmação, todos os gates normais continuam ativos. A confirmação não força departure, compra, pricing ou reroute.

**Recomendação:** `true` para quem prefere revisar o cenário antes de permitir operações reais.

> Se um CAPTCHA ou challenge de segurança aparecer, a execução é interrompida. O bot não tenta resolver, contornar ou repetir o desafio.

---

# 3. Decolagens

## `EXECUTE_INDIVIDUAL`

**Padrão:** `true`

**Aceita:** `true` ou `false`.

É uma opção de compatibilidade usada pelo resolvedor de departures quando o workflow não recebe um modo explícito.

No workflow principal, `departure_mode=production` ativa produção explicitamente e `departure_mode=simulation` força simulação.

**Recomendação:** mantenha `true`.

## `MAX_INDIVIDUAL_DEPARTURES`

**Padrão do workflow:** `20`

**Formato:** inteiro não negativo.

Define o máximo de departures individuais permitidos em uma execução.

Existe um **hard cap de 20**. Se uma Variable antiga estiver acima disso, o resolvedor a limita a 20.

O input manual `max_individual_departures` pode substituir esse valor para uma execução específica.

**Recomendação:** `20` para operação normal. Use um valor menor se quiser reduzir o número de mutações por run.

---

# 4. Demand Manager

## `MIN_DEMAND_PERCENTAGE`

**Padrão:** `80`

**Aceita:** número maior que 0 e menor ou igual a 100.

É o percentual mínimo de ocupação possível exigido antes de uma aeronave ser considerada elegível pela análise de demanda.

Exemplo com 100 assentos e valor `80`:

```text
mínimo necessário = 80 passageiros possíveis
```

O threshold adaptativo pode elevar esse piso com histórico verificado. Ele não reduz o piso por evidência fraca.

**Aumentar o valor:** mais conservador, mais HOLDs.

**Diminuir o valor:** aceita voos com menor ocupação potencial.

**Recomendação:** mantenha `80` até possuir motivo operacional para alterar.

## `DEMAND_THRESHOLD_MODE`

**Padrão:** `aggregate`

**Aceita:**

```text
aggregate
per-class
```

### `aggregate`

Avalia a ocupação total possível da aeronave.

### `per-class`

Exige o threshold separadamente para cada classe que possui assentos.

**Recomendação:** `aggregate`.

## `DEMAND_POOL_SCOPE`

**Padrão:** `airport-pair`

**Aceita:**

```text
airport-pair
directional
```

### `airport-pair`

Os dois sentidos do mesmo par compartilham um pool conservador.

### `directional`

Cada direção é tratada separadamente.

> Produção real exige a política conservadora `airport-pair`.

**Recomendação:** não altere.

## `DEMAND_MAX_AGE_SECONDS`

**Padrão:** `300`

**Aceita:** inteiro entre 1 e 3600.

Determina por quanto tempo uma observação de demanda pode ser considerada fresca.

Com `300`, uma evidência com mais de cinco minutos é rejeitada.

Esse valor também participa de outros gates que reutilizam a idade máxima de evidência.

**Recomendação:** `300`.

## `DEMAND_PROLONGED_HOLD_MINUTES`

**Padrão:** `180`

**Formato:** inteiro positivo.

Define a janela usada pelo dashboard para destacar aeronaves que permanecem em HOLD de demanda por muito tempo.

Esse valor é de **observabilidade**; não autoriza departure.

**Recomendação:** `180`.

---

# 5. Route research

## `ENABLE_ROUTE_RESEARCH`

**Padrão:** `true`

**Aceita:** `true` ou `false`.

Controla a pesquisa de candidatos de rota em modo de leitura.

Desativar reduz trabalho de pesquisa, mas também remove evidência necessária para route review/reroute.

**Recomendação:** `true`.

## `ROUTE_RESEARCH_MAX_AIRCRAFT`

**Padrão:** `3`

Define quantas aeronaves podem entrar na pesquisa de rota durante uma run.

Um valor maior aumenta cobertura, mas também aumenta navegação e tempo de execução.

**Recomendação:** comece com `3`.

## `ROUTE_RESEARCH_MAX_SUGGESTIONS`

**Padrão:** `5`

Define quantas sugestões podem ser inspecionadas por aeronave.

Mais sugestões aumentam cobertura, mas não transformam a lista em prova de ótimo global.

**Recomendação:** `5`.

## `ROUTE_RESERVATION_NEXT_LEGS`

**Padrão:** `2`

Define quantos próximos trechos são considerados no planejamento conservador de reservas de demanda.

Isso evita atribuir a mesma demanda futura a múltiplas aeronaves.

**Recomendação:** `2`.

## `ROUTE_RESERVATION_POOL_SCOPE`

**Padrão:** `airport-pair`

Define o escopo das reservas de planejamento entre candidatos.

**Recomendação:** `airport-pair`.

---

# 6. Route review e reroute

## `ENABLE_ROUTE_OPTIMIZER`

**Padrão:** `true`

**Aceita:** `true` ou `false`.

Ativa a análise de route review, incluindo decisões como:

```text
KEEP
HOLD
REROUTE candidate
```

Desativar impede a camada de otimização, mas não impede departures normais.

**Recomendação:** `true`.

## `ROUTE_MIN_OCCUPANCY_PERCENT`

**Padrão:** `80`

Define o piso de ocupação usado em partes da análise econômica/operacional de candidatos.

Não substitui `MIN_DEMAND_PERCENTAGE`; são controles de camadas diferentes.

**Recomendação:** `80`.

## `ROUTE_MIN_IMPROVEMENT_PERCENT`

**Padrão:** `0`

Define a melhora mínima exigida para que uma candidata possa superar a rota atual dentro da comparação suportada.

`0` significa que a candidata ainda precisa demonstrar superioridade pelos gates econômicos, mas não recebe um percentual adicional obrigatório.

**Recomendação:** mantenha `0` enquanto estiver usando os comparadores conservadores atuais.

## `ENABLE_ROUTE_EXECUTION`

**Padrão em production:** `true`

**Aceita:** `true` ou `false`.

Permite que o executor de reroute opere quando todos os requisitos forem satisfeitos.

Em `simulation`, o workflow força essa opção para `false`.

> `true` não significa “trocar rotas automaticamente a qualquer custo”. O executor ainda exige `comparisonReady`, `mutationAuthorized`, contexto fresco e controle nativo validado.

**Recomendação:** use `true` somente depois de validar seu fork em simulation e revisar o comportamento de route review.

## `ROUTE_MAX_REROUTES_PER_RUN`

**Padrão:** `1`

Define o número máximo de reroutes reais por execução.

**Recomendação:** `1`.

---

# 7. Pricing PAX

## `ENABLE_TICKET_PRICING`

**Padrão:** `true`

Ativa leitura e cálculo de pricing.

Política atual:

```text
Y = Auto × 1.10
J = Auto × 1.08
F = Auto × 1.06
```

**Recomendação:** `true`.

## `ENABLE_TICKET_PRICING_EXECUTION`

**Padrão em production:** `true`

Permite o Save real quando o pricing calculado difere do valor atual e o controle da rota foi validado.

Em `simulation`, o workflow força `false`.

**Recomendação:** mantenha `true` depois de validar a instalação. Use `false` se quiser apenas observar as recomendações.

## `TICKET_PRICING_MAX_ADJUSTMENTS_PER_RUN`

**Padrão:** `5`

Define quantas rotas podem receber ajuste real de preço em uma run.

Um resultado incerto interrompe novas alterações independentemente desse limite.

**Recomendação:** `5`.

---

# 8. Fuel e CO₂

## `ENABLE_FUEL`

**Padrão em production:** `true`

Controla o módulo de compra de Fuel e CO₂.

Em `simulation`, o workflow força `false`.

**Recomendação:** `true` depois de revisar seus limites de preço.

## `MAX_FUEL_PRICE`

**Padrão:** `550`

**Formato:** inteiro positivo.

É o teto exclusivo de preço por 1.000 lbs.

A regra é:

```text
comprar somente se preço < MAX_FUEL_PRICE
```

Portanto, com `550`, preço exatamente 550 **não compra**.

**Recomendação:** trate esse valor como política pessoal da sua instalação e revise antes de produção.

## `MAX_CO2_PRICE`

**Padrão:** `120`

**Formato:** inteiro positivo.

Teto exclusivo por 1.000 quotas de CO₂.

A regra também é estrita:

```text
comprar somente se preço < MAX_CO2_PRICE
```

**Recomendação:** revise conforme sua estratégia.

## `MAX_FUEL_PURCHASE_PER_RUN`

**Padrão:** `0`

**Formato:** inteiro não negativo.

`0` significa usar a capacidade disponível do tanque, ainda respeitando caixa, reserva e política de preço.

Um valor positivo limita a quantidade máxima comprada por run.

**Recomendação:** `0` para comportamento padrão; use um limite se quiser controlar exposição por execução.

## `MAX_CO2_PURCHASE_PER_RUN`

**Padrão:** `0`

Funciona como o limite equivalente para CO₂.

`0` significa utilizar a capacidade disponível permitida pela política.

## `MIN_CASH_RESERVE`

**Padrão:** `0`

**Formato:** inteiro não negativo.

Define quanto dinheiro deve permanecer fora do orçamento disponível para supplies.

Exemplo:

```text
saldo = 10.000.000
MIN_CASH_RESERVE = 2.000.000
valor disponível para a política = até 8.000.000
```

A política ainda pode usar um orçamento mais conservador quando não é possível preencher o estoque inteiro.

**Recomendação:** configure uma reserva se sua companhia precisa proteger caixa para outras operações.

---

# 9. Manutenção

## `ENABLE_MAINTENANCE`

**Padrão em production:** `true`

Ativa as rotinas de manutenção.

Em `simulation`, o workflow força `false`.

**Recomendação:** `true` após validar a interface da sua conta.

## `REPAIR_WEAR`

**Padrão:** `30`

Define o limite selecionado no fluxo de bulk repair.

Valores inválidos retornam ao comportamento padrão do módulo.

**Recomendação:** `30`, salvo se você tiver uma política própria de desgaste.

## `HOURS_CHECK`

**Padrão:** `20`

Define quantas horas restantes para check tornam uma aeronave elegível no fluxo preventivo de A-check.

Com `20`, aeronaves com até 20 horas restantes podem ser selecionadas.

**Recomendação:** `20`.

---

# 10. Campanhas

## `ENABLE_CAMPAIGN`

**Padrão em production:** `true`

Ativa a rotina de campanhas.

Em `simulation`, é forçada para `false`.

## `INCREASE_AIRLINE_REPUTATION`

**Padrão no workflow:** `true`

Controla se, além da campanha eco-friendly, o bot tenta manter uma campanha de reputação da companhia.

**Recomendação:** `true` se você deseja essa automação.

## `CAMPAIGN_TYPE`

**Padrão:** `1`

Define qual “Campaign N” é selecionada pelo fluxo de reputação.

**Recomendação:** mantenha `1` até ter confirmado na sua UI qual opção deseja usar.

## `CAMPAIGN_DURATION`

**Padrão:** `4`

Representa a duração usada pelo seletor de campanha.

O módulo converte esse número para a opção esperada pela interface.

**Recomendação:** `4`.

---

# 11. Controle geral de Depart

## `ENABLE_DEPART`

**Padrão em production:** `true`

É o switch operacional de departure entregue ao processo principal.

Em `simulation`, o workflow força `false`.

O Demand Manager e o executor individual continuam aplicando seus próprios gates mesmo quando essa opção está ativa.

**Recomendação:** `true` para produção normal.

---

# 12. Observabilidade e compatibilidade

## `ALERT_CASH_ABOVE`

**Padrão:** não configurada.

**Formato:** inteiro não negativo.

É uma opção legada de alerta financeiro usada apenas no caminho alternativo de Telegram quando `ENABLE_DEMAND_MANAGER == false`.

**Recomendação:** não configure em uma instalação normal. O dashboard/Telegram atual utiliza o fluxo consolidado.

## `ENABLE_DEMAND_MANAGER`

O processo principal injeta internamente:

```text
ENABLE_DEMAND_MANAGER=true
```

Uma Repository Variable com esse nome ainda aparece em alguns guards históricos do workflow.

**Recomendação:** **não crie `ENABLE_DEMAND_MANAGER=false`**. Isso pode pular a restauração do journal enquanto o processo principal continua esperando estado persistente em production.

Ela não é um switch público normal.

---

# 13. Variáveis internas que não devem ser criadas manualmente

Algumas variáveis de ambiente existem durante a execução, mas são definidas pelo próprio workflow e funcionam como guards de segurança.

Não crie Repository Variables para:

```text
DEMAND_DRY_RUN
DEMAND_FAIL_SAFE
DEMAND_EXECUTION_ACK
DEMAND_MAX_DEPARTURES_PER_RUN

ENABLE_RETURN_JOURNAL

TICKET_PRICING_EXECUTION_ACK
ROUTE_EXECUTION_ACK

DEMAND_EXECUTION_MUTATION_DEADLINE_EPOCH_MS
TICKET_PRICING_MUTATION_DEADLINE_EPOCH_MS
ROUTE_EXECUTION_MUTATION_DEADLINE_EPOCH_MS

GITHUB_ACTIONS
GITHUB_REPOSITORY
GITHUB_RUN_ID
GITHUB_RUN_ATTEMPT
GITHUB_TOKEN
```

Esses valores são controlados pelo workflow/runtime e fazem parte dos mecanismos fail-closed.

---

# 14. Configuração recomendada para começar

Você pode executar o bot sem criar todas as Variables, porque os defaults já existem.

Para uma instalação nova, normalmente vale considerar apenas:

```text
AIRLINE_BASES_JSON=["SEU_HUB_1","SEU_HUB_2"]
ROUTE_REVIEW_TIMEZONE=Seu/Timezone
MIN_CASH_RESERVE=valor_que_voce_deseja_preservar
```

As demais podem permanecer ausentes até você ter uma razão específica para alterar o comportamento padrão.

## Antes de modificar uma Variable

Pergunte:

1. qual módulo ela afeta?
2. o valor torna o bot mais ou menos conservador?
3. a alteração aumenta o número de mutações por run?
4. existe um hard cap no código?
5. a mudança pode reduzir a qualidade da evidência necessária?

Depois de uma mudança relevante, execute primeiro:

```text
departure_mode=simulation
```

e revise o GitHub Step Summary e os artifacts antes de voltar à produção.
