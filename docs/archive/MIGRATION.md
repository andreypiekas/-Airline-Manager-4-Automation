# Migração de repositório — registro histórico

> **Documento histórico.** O repositório ativo é `andreypiekas/Airline-Manager-4-Automation`.

O projeto foi separado de um repositório anterior para concentrar automação, testes, documentação e estado operacional em uma base dedicada.

O processo preservou:

- código operacional;
- workflows;
- testes;
- documentação;
- transporte do journal;
- safeguards fail-closed.

A branch de runtime permanece separada do código:

```text
am4-runtime-state
```

O repositório anterior não faz parte da operação atual. Este documento existe apenas para registrar o cutover.
