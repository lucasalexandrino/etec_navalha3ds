## Título sugerido

`Entrega: agenda da barbearia — login por papéis, validações, correções e documentação`

---

## Descrição

Pull request da atividade em `Contexto.md`: protótipo web de agendamento (cliente e barbeiro) com dados em `localStorage`, login simulado por papel, validação de formulários, correções de bugs e entregáveis em Markdown com prints de evidência.

---

## Principais alterações

### Aplicação (`index.html`, `css/estilos.css`, `js/script.js`)

- Tela de login simulada (usuários de teste: **cliente** / **1234** e **barbeiro** / **1234**), sessão persistida e **logout**.
- Painéis exibidos conforme o papel logado; sem login, interface principal oculta.
- Calendário com navegação de mês e seleção de data ligada ao campo de data.
- Validação de agendamento: nome (3–80 caracteres), WhatsApp (10–11 dígitos), serviço, data (obrigatória e não no passado), horário e **bloqueio de mesmo horário** na mesma data.
- Cadastro de serviço com validação e **bloqueio de duplicidade** (case-insensitive).
- **Correção:** exclusão de agendamento por **id** estável (lista ordenada não remove mais o item errado).
- **Robustez:** leitura de `localStorage` com tratamento de JSON inválido; escape de HTML na renderização dinâmica para reduzir risco de XSS.

### Documentação e evidências

- `README.md` — como executar e estrutura do projeto.
- `BUGS.md` — bugs encontrados e correções aplicadas.
- `TESTES.md` — checklist manual, observações e índice das prints.
- `UX_UI.md` — três melhorias de UX/UI priorizadas e justificadas.
- `prints-testes/` — capturas dos fluxos e validações.

### Outro

- `.vscode/settings.json` — preferências locais do editor (se não fizer parte da entrega da equipe, pode ser removido em commit futuro).

---

## Como validar (revisor)

1. Abrir `index.html` no navegador.
2. Testar login como cliente e como barbeiro; testar logout.
3. Cliente: selecionar data no calendário, preencher agendamento e verificar mensagens de erro nos casos inválidos.
4. Barbeiro: cadastrar serviço, ver no select do cliente, listar agendamentos e concluir um item.
5. Recarregar a página (`F5`) e conferir persistência de dados e sessão, conforme `TESTES.md`.

---

## Alinhamento com o enunciado (`Contexto.md`)

| Tema | Onde está coberto |
|------|-------------------|
| Refatoração / organização | Separação HTML/CSS/JS; lógica concentrada em `js/script.js` |
| Correção de bugs | `BUGS.md` + código |
| UX / UI | `UX_UI.md` + ajustes de fluxo e feedback |
| Login e papéis | `js/script.js` |
| Validação de campos | Formulários + `js/script.js` |
| Testes manuais | `TESTES.md` + `prints-testes/` |

---

## Limitações (didáticas)

- Login e dados ficam no **navegador**; não há segurança de produção nem servidor.
- O teste manual opcional de XSS foi registrado como **não executado** em `TESTES.md`; a mitigação no código permanece como boa prática.

---

## Branch

`grupo01` → base típica: `main` (ajuste no GitHub se a branch padrão for outra).
