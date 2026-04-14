# Agenda da Barbearia - Projeto Didático

Aplicação web simples para agendamento de serviços de barbearia, desenvolvida para fins educacionais com HTML, CSS e JavaScript, usando `localStorage` para persistência local.

## Tecnologias

- HTML5
- CSS3
- JavaScript (vanilla)
- `localStorage` (simulação de banco)

## Como executar

1. Abra o arquivo `index.html` em um navegador moderno.
2. Faça login com um usuário de teste:
   - Cliente: `cliente` / `1234`
   - Barbeiro: `barbeiro` / `1234`
3. Use as funcionalidades conforme o papel selecionado.

## Estrutura de pastas

- `index.html`: estrutura principal da aplicação.
- `css/estilos.css`: estilos em uso no projeto.
- `js/script.js`: regras de interface, validações, sessão e persistência.
- `BUGS.md`: relatório de bugs encontrados e corrigidos.
- `TESTES.md`: checklist de testes manuais executados.
- `UX_UI.md`: justificativa das 3 melhorias de UX/UI priorizadas.
- `Contexto.md`: enunciado da atividade.

## Funcionalidades implementadas

- Login simulado com papéis (cliente e barbeiro).
- Logout com limpeza de sessão.
- Controle de acesso por papel na interface.
- Cadastro e remoção de serviços.
- Criação e conclusão de agendamentos.
- Calendário com navegação mensal e seleção de data.
- Validação de formulário (nome, WhatsApp, data, horário, conflitos).
- Persistência de dados no navegador (`localStorage`).

## Observações importantes

- Este projeto é **didático**. O login atual é local e não oferece segurança de produção.
- Em um sistema real, autenticação e autorização devem ser feitas no servidor.
- Os dados podem ser limpos pelo usuário via DevTools do navegador (limpeza de `localStorage`).
