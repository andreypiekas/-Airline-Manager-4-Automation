# Simulações multi-run — registro histórico de 30/09/2026

> **Documento histórico.** O estado atual está em [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md).

Nesta etapa, a suíte exercitava múltiplas execuções sintéticas para verificar persistência e comportamento fail-closed.

Os cenários cobriam, entre outros:

- candidatas incompletas;
- demanda insuficiente;
- repetição da mesma revisão;
- renovação simulada de demanda;
- preservação do journal;
- candidata economicamente superior sem autorização automática de mutação.

Os testes utilizavam dados sintéticos e não acessavam a conta real durante a validação offline.

Capacidades posteriormente implementadas substituem várias limitações registradas naquela época; por isso este arquivo não deve ser usado como referência atual.
