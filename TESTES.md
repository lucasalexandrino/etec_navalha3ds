# Checklist de Testes Manuais

## Projeto
Agenda da barbearia (fluxos cliente e barbeiro com login simulado).

## Como executar

1. Abrir `index.html` no navegador.
2. Limpar o `localStorage` antes do primeiro teste (opcional, para iniciar limpo).
3. Executar os cenários abaixo na ordem e registrar observações.

## Resultado geral

- Data da execução: 14/04/2026
- Responsável: Nicolas Patrick Fatori Fadoni
- Navegador: Google Chrome
- Situação final: (X) Aprovado  ( ) Aprovado com ressalvas  ( ) Reprovado

## Checklist principal

- [x] Login como **cliente** redireciona para painel do cliente.
- [x] Login como **barbeiro** redireciona para painel do barbeiro.
- [x] Logout encerra a sessão e volta para tela de login.
- [x] Sem login, painéis principais não ficam visíveis na interface.
- [x] Cadastro de serviço aparece no select do cliente.
- [x] Cadastro duplicado de serviço é bloqueado com mensagem.
- [x] Agendamento válido salva com sucesso.
- [x] Agendamento salvo aparece na lista do barbeiro.
- [x] Concluir atendimento remove o agendamento correto.
- [x] Recarregar a página mantém dados esperados (`localStorage`).
- [x] Calendário permite mês anterior/próximo e seleção de data coerente.

## Validações de formulário

- [x] Nome obrigatório (mínimo 3 caracteres).
- [x] WhatsApp inválido é bloqueado.
- [x] Serviço obrigatório.
- [x] Data obrigatória.
- [x] Data no passado é bloqueada.
- [x] Horário obrigatório.
- [x] Conflito de horário (mesma data/hora) é bloqueado.

## Casos de regressão (bugs corrigidos)

- [x] Excluir agendamento remove o item certo mesmo com lista ordenada.
- [ ] (Opcional) Dados renderizados não executam HTML/script injetado. Status: não testado.
- [x] App não quebra com falha de parse em leitura de dados salvos.

## Observações

- O login é didático (front-end/localStorage) e não representa segurança de produção.
- Em produção real, autenticação e autorização devem ser feitas no servidor.
- O teste de XSS pode ficar como opcional didático; se não for executado, registrar como "não testado".
- Após `F5`, os dados de serviços e agendamentos permaneceram visíveis (persistência validada).
- A sessão de autenticação persistiu após recarregar a página (F5), e o encerramento ocorreu apenas ao executar o logout.

## Evidências (opcional)

- Pasta de evidências: `prints-testes/`
- Arquivos com sufixo `-2` representam a continuação do mesmo cenário de teste.
- `01-login-cliente.png`
- `02-login-cliente-2.png`
- `03-login-barbeiro.png`
- `04-login-barbeiro-2.png`
- `05-logout.png`
- `06-agendamento-cliente.png`
- `07-agendamento-cliente-2.png`
- `08-validacao-nome-whatsapp.png`
- `09-validacao-horario.png`
- `10-validacao-horario-2.png`
- `11-validacao-servico-data.png`
- `12-validacao-calendario.png`
- `13-servico-duplicado.png`
