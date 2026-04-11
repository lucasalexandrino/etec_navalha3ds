## Checklist de testes (manual)

### Login / Sessão

- [ ] Login como **Admin** abre apenas o dashboard admin.
- [ ] Login como **Cliente** abre apenas a área do cliente.
- [ ] Login como **Barbeiro** abre apenas o painel do barbeiro (Rafa / `barb_1`).
- [ ] Logout volta para o login e impede acesso sem logar novamente.

### Cliente — Agendamentos

- [ ] Selecionar barbeiro + data + serviço mostra horários.
- [ ] **Fim de semana**: não aparecem slots úteis (mensagem de dia útil).
- [ ] Horários **passados** (no dia atual) ficam desabilitados.
- [ ] Horários com menos de **1 hora** de antecedência ficam desabilitados (`< 1h`).
- [ ] Criar um agendamento bloqueia novos agendamentos conflitantes para o mesmo barbeiro.
- [ ] Recarregar a página mantém dados (LocalStorage).
- [ ] Agendamento aparece no **histórico do cliente** com colunas de pagamento e atendimento.

### Regra de conflito (core)

- [ ] Um atendimento inclui +10m de limpeza (não permite “colar” atendimentos).
- [ ] Tentar agendar dentro do intervalo de outro atendimento (incluindo limpeza) é bloqueado.

### Pagamentos / Admin

- [ ] Agendamentos novos entram como **Pendente**.
- [ ] **Pix** abre modal com QR fictício após agendar.
- [ ] **Boleto** abre modal com linha digitável fictícia após agendar.
- [ ] Admin vê pendências destacadas (laranja/vermelho conforme urgência).
- [ ] Admin marca **Pago** e o horário do recebimento é registrado.
- [ ] Totais do dashboard refletem apenas pagamentos **Pago** (inclui coluna **Boleto** quando pago).
- [ ] Admin cancela um horário e o slot é liberado no cliente.
- [ ] Aba **Serviços**: adicionar serviço, editar linha (salvar), excluir — selects do cliente atualizam.

### Barbeiro

- [ ] **Semana**: vê apenas próprios agendamentos; navegação anterior/próxima semana persiste (localStorage).
- [ ] Clicar em um card na semana abre ações: Cliente / Editar / Concluir / Cancelar.
- [ ] **Cliente**: modal com WhatsApp, e-mail (se cadastrado), totais e histórico recente.
- [ ] **Editar**: mudar serviço/data/hora valida conflito; em **Dinheiro** permite ajustar valor em R$.
- [ ] **Concluir** grava `concluido` com horário; botão desabilita em “Hoje”.
- [ ] **Cancelar** pede confirmação e libera slot (igual admin para aquele registro).
