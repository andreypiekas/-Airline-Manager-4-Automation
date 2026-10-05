# Fuel e CO₂

O módulo de supplies consulta os mercados do AM4 antes das fases principais da frota.

## Princípio

Toda decisão de compra depende do **preço observado ao vivo**.

Catálogos, calendários ou referências externas podem aparecer em relatórios, mas nunca autorizam compra.

## Configuração

| Variable | Padrão | Regra |
| --- | ---: | --- |
| `ENABLE_FUEL` | `true` | Controla Fuel e CO₂ |
| `MAX_FUEL_PRICE` | `550` | Teto exclusivo por 1.000 lbs |
| `MAX_CO2_PRICE` | `120` | Teto exclusivo por 1.000 quotas |
| `MAX_FUEL_PURCHASE_PER_RUN` | `0` | 0 usa espaço disponível |
| `MAX_CO2_PURCHASE_PER_RUN` | `0` | 0 usa espaço disponível |
| `MIN_CASH_RESERVE` | `0` | Caixa que deve permanecer disponível |

A igualdade ao teto não compra.

## Planejamento da quantidade

A quantidade é limitada por:

- espaço livre;
- limite por execução;
- caixa acima da reserva;
- orçamento conservador.

Quando a compra total planejada não cabe no caixa disponível, a política reduz a exposição em vez de consumir todo o saldo restante.

Déficit negativo de CO₂ não é usado automaticamente como justificativa para uma política não verificada.

## Execução

1. abrir o mercado;
2. ler preço, estoque, espaço e saldo;
3. calcular o plano;
4. obter a cotação nativa;
5. reler o snapshot antes do clique;
6. bloquear se preço/contexto mudaram;
7. persistir a intenção;
8. comprar pelo controle nativo;
9. reler estoque e pagamento;
10. confirmar o resultado.

Nenhuma chamada direta é usada como substituto do controle nativo observado.

## Resultado incerto

Se uma compra foi tentada, mas o resultado não pôde ser confirmado:

- a run é interrompida;
- a operação não é repetida automaticamente;
- uma quarentena persistente é registrada quando o journal está habilitado.

## Relatórios

`supply-report.json/.md` registra:

- preço observado;
- teto efetivo;
- política adaptativa;
- quantidade planejada;
- resultado;
- razão do HOLD/skip;
- evidência pós-compra quando disponível.

O Summary exibe apenas a consolidação executiva.
