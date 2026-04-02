# Navalha — Agenda da barbearia

Protótipo de agenda para barbearia: o cliente consulta o calendário e cria agendamentos; o barbeiro cadastra serviços e gerencia a lista de agendamentos. Os dados ficam no **localStorage** do navegador (sem servidor).

## Como abrir

Abra o ficheiro `index.html` no navegador (duplo clique ou *Open with Live Server*, se usar extensão no editor).

## Tecnologias

- HTML5  
- CSS3  
- JavaScript (sem frameworks; scripts carregados em sequência)

---

A pasta do projeto está organizada em `css/` (apresentação), `js/` (comportamento) e `index.html` (estrutura). O ficheiro **storage.js** centraliza leitura e escrita no `localStorage` (chaves e serialização JSON). O **servicos.js** trata da lista de serviços: listar, adicionar e remover, usando o armazenamento. O **agendamentos.js** concentra a lógica de negócio dos agendamentos (incluindo ordenação, conversão data/hora para ISO, formatação para exibição e quais dias do mês têm marcação no calendário). O **ui.js** liga o DOM aos módulos anteriores: troca de perfil cliente/barbeiro, formulários, tabela, calendário e eventos.
