# Migração do repositório

## Origem histórica

```text
andreypiekas/Airline-Manager-4
```

## Repositório ativo

```text
andreypiekas/Airline-Manager-4-Automation
```

Data de corte: **04/10/2026**.

## O que foi migrado

- código operacional;
- workflows relevantes;
- testes;
- documentação;
- branch de estado persistente;
- journal operacional;
- quarentenas existentes;
- safeguards fail-closed.

A branch de runtime permanece:

```text
am4-runtime-state
```

## Cutover

O workflow operacional principal do repositório antigo foi desativado. O cron-job.org deve apontar exclusivamente para o repositório novo.

A primeira produção no novo repositório revelou guards que ainda continham o nome antigo. Eles foram corrigidos sem remover validações de contexto.

Produções posteriores confirmaram no novo repositório:

- decolagens reais;
- pricing;
- Fuel;
- persistência do journal;
- agendamento externo;
- Telegram.

O repositório antigo deve ser usado somente como evidência histórica.
