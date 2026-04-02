## Checklist de testes (manual)

### Login / Sessão

- [ ] Login como **Admin** abre apenas o dashboard admin.
- [ ] Login como **Cliente** abre apenas a área do cliente.
- [ ] Logout volta para o login e impede acesso sem logar novamente.

### Cliente — Agendamentos

- [ ] Selecionar barbeiro + data + serviço mostra horários.
- [ ] Horários **passados** (no dia atual) ficam desabilitados.
- [ ] Criar um agendamento bloqueia novos agendamentos conflitantes para o mesmo barbeiro.
- [ ] Recarregar a página mantém dados (LocalStorage).
- [ ] Agendamento aparece no **histórico do cliente**.

### Regra de conflito (core)

- [ ] Um atendimento inclui +10m de limpeza (não permite “colar” atendimentos).
- [ ] Tentar agendar dentro do intervalo de outro atendimento (incluindo limpeza) é bloqueado.

### Pagamentos / Admin

- [ ] Agendamentos novos entram como **Pendente**.
- [ ] Admin vê pendências destacadas (laranja/vermelho conforme urgência).
- [ ] Admin marca **Pago** e o horário do recebimento é registrado.
- [ ] Totais do dashboard refletem apenas pagamentos **Pago**.
- [ ] Admin cancela um horário e o slot é liberado no cliente.

