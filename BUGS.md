# Relatório de Bugs Corrigidos

## Projeto
Agenda da barbearia (HTML, CSS e JavaScript) com armazenamento em `localStorage`.

## Correções realizadas

| ID | Problema encontrado | Como foi identificado | Correção aplicada |
|---|---|---|---|
| 0 | **[CRÍTICO]** Dados renderizados como `"[object Object]"` em vez de valores reais (serviços, nomes, agendamentos). Causa raiz: objetos mal formatados no `localStorage` ou conversão inadequada. | Problema principal reportado na máquina do professor: interface mostrava `[object Object]` em listas e campos. | Implementadas funções de normalização: `normalizeServicoNome()` converte qualquer formato para string, `normalizeAgendamento()` valida todos os campos como strings usando `String()` com fallback, `escapeHTML()` limpa dados renderizados. |
| 1 | Excluir agendamento removia item errado quando a lista estava ordenada por data/hora. | Teste manual na tela do barbeiro: ordem exibida diferente da ordem de gravação no array. | Substituição de remoção por índice para remoção por identificador estável (`id`) com `removeAgendamentoById`. |
| 2 | Proteção contra XSS ao renderizar dados de entrada com `innerHTML` (nome, WhatsApp, serviço). | Revisão de código dos pontos de renderização dinâmica. | Implementada função `escapeHTML()` (converte `&`, `<`, `>`, `"`, `'` para entidades HTML) e aplicada em todos os pontos: toasts, opciones de serviços, tabela de agendamentos. |
| 3 | Aplicação podia quebrar se o `localStorage` tivesse JSON inválido. | Revisão das chamadas `JSON.parse` sem tratamento de erro. | Implementada função `safeParse(raw, fallback)` com try-catch, substitui todas as parseagens de `localStorage` e fornece fallback seguro em caso de erro. |
| 4 | Falta de controle de acesso por sessão: interface cliente/barbeiro acessível sem autenticação. | Verificação de fluxo inicial e ausência de checagem de sessão. | Adicionada tela de login simulado, persistência de sessão (`barbearia_sessao`), controle de papel e botão de logout. |
| 5 | Validação de agendamento insuficiente (aceitava dados fracos/inconsistentes). | Testes manuais com campos vazios e combinações inválidas. | Regras adicionadas: nome (3-80), WhatsApp com 10-11 dígitos, data obrigatória e não passada, horário obrigatório e bloqueio de conflito no mesmo horário. |
| 6 | Cadastro de serviço aceitava duplicidade e entradas vazias. | Teste manual no formulário de serviços. | Validação com `trim()`, mensagens de erro e bloqueio de duplicados (comparação case-insensitive). |

## Observações didáticas

- **Compatibilidade com navegadores antigos:** As funções de normalização (`normalizeServicoNome()`, `normalizeAgendamento()`) usam `String()` em vez de template strings com `${}` para garantir compatibilidade com IE 11 e navegadores pré-2015 que causavam o erro `[object Object]`.
- **Robustez de storage:** `safeParse()` evita crashes com JSON corrompido no `localStorage`, problema comum em máquinas com cache inconsistente ou histórico corrompido.
- A autenticação implementada é **simulada no front-end**, adequada para estudo.
- Para produção real, autenticação/autorização devem ser feitas no servidor, com API protegida e dados fora do `localStorage`.
- A proteção contra XSS (`escapeHTML()`) foi tratada como melhoria de robustez e segurança, fundamental para qualquer renderização dinâmica.

## Evidências de validação

- Revisão estática do `js/script.js`.
- Testes manuais de fluxo:
  - Login cliente e barbeiro.
  - Logout e bloqueio de interface sem sessão.
  - Cadastro/remoção de serviço.
  - Criação/remoção de agendamento.
  - Bloqueio de conflito de horário.
