# Checklist de Testes - Sistema de Agendamento Barbearia Navalha

Este arquivo contém o checklist de testes manuais executados conforme as instruções do `Contexto.md`. Todos os testes foram realizados simulando o uso real da aplicação.

## Testes de Funcionalidade

- [x] Login como cliente e como barbeiro redirecionam corretamente.
  - Cliente: cliente@email.com / 123456 → Redireciona para painel cliente.
  - Barbeiro: joao@navalha.com / 123456 → Redireciona para painel barbeiro.

- [x] Logout impede acessar painel sem logar de novo.
  - Após logout, a tela de login aparece e não é possível acessar painéis sem nova autenticação.

- [x] Cadastro de serviço aparece no select do cliente.
  - Serviços cadastrados pelo barbeiro aparecem imediatamente no select de agendamento do cliente.

- [x] Agendamento salva e aparece na lista do barbeiro.
  - Agendamentos criados pelo cliente aparecem na lista "Todos os Agendamentos" e "Agendamentos Hoje" do barbeiro correspondente.

- [x] Status na lista do barbeiro obedece à regra de negócio (agendado × concluído).
  - Agendamentos com **data/hora futura** aparecem como **agendado** (`scheduled`), nunca como concluído só por causa de pagamento simulado.
  - **Concluído** exige horário de início já passado (dados demo) ou ação explícita **Concluir** pelo barbeiro após o atendimento.

- [x] Excluir serviço / cancelar agendamento atualiza calendário e tabelas.
  - Exclusão de serviço remove do select do cliente.
  - Cancelamento de agendamento remove da lista do barbeiro e libera horário.

- [x] Recarregar a página mantém dados esperados (localStorage).
  - Dados de serviços, agendamentos e sessão são persistidos corretamente.

- [x] Calendário: mês anterior/próximo e seleção de dia coerentes com o campo data.
  - O sistema usa input date nativo do navegador, que permite navegação por meses e seleção de dias. Horários disponíveis são calculados dinamicamente com base na data selecionada.

## Observações de Bugs Encontrados

Foi corrigido um bug de **dados de demonstração**: o seed gerava alguns agendamentos **futuros** com status `completed` quando o método de pagamento simulado era PIX/cartão, o que contradizia a regra (conclusão só após o horário ou após o barbeiro concluir). Ajustes em `js/app.js`: seed alinhado, migração `migrateStatusConcluidoInconsistente`, função `statusAgendamentoLogico` para exibição e faturamento.

### Pequenas Observações/ Melhorias Identificadas

- A responsividade em dispositivos móveis pode ser aprimorada para telas muito pequenas.
- O campo de data poderia ter validação visual mais clara para datas passadas.
- Em alguns navegadores, o input date pode ter aparência diferente, mas funcionalmente ok.

## Ambiente de Teste

- Navegador: Chrome/Firefox (testado localmente via `python -m http.server`)
- Sistema Operacional: Windows
- Dispositivo: Desktop e simulação mobile via DevTools

Todos os testes passaram com sucesso. A aplicação atende aos requisitos mínimos estabelecidos no `Contexto.md`.