# Migração do repositório

Origem: `andreypiekas/Airline-Manager-4`

Base migrada: `3609256efda2cd9cf7a9975174b19187dd557737`

Data de corte: 04/10/2026.

A migração preserva o código e os safeguards fail-closed do HEAD validado. O estado operacional persistente é transferido separadamente pela branch `am4-runtime-state`. O repositório antigo não deve mais receber agendamentos operacionais após o cutover.
