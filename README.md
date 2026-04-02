# Navalha — Agenda da Barbearia

Protótipo web de agendamento para barbearia em **HTML**, **CSS** e **JavaScript** puro (sem build). O projeto separa **três áreas** (deslogado, cliente, barbeiro), cada uma com **HTML, CSS e JS próprios**, e uma **biblioteca compartilhada** de dados em `lib/armazenamento.js`.

Na raiz, **`index.html`** redireciona para **`deslogado/index.html`**.

---

## O que o projeto inclui (resumo do que foi implementado)

| Tema | Descrição |
|------|-----------|
| **Áreas e rotas** | Três pastas (`deslogado/`, `cliente/`, `barbeiro/`); após o login o usuário vai para a rota certa; sessão inválida ou perfil errado redireciona para o login. |
| **Cadastro e login** | Cadastro com e-mail, senha, confirmação e tipo **cliente** ou **barbeiro**; login só com e-mail e senha; o painel depende do **perfil salvo** no cadastro. |
| **Persistência** | Usuários, serviços e agendamentos no **`localStorage`**; sessão no **`sessionStorage`**. |
| **Contas demo e mock** | Seed inicial com usuários de exemplo; contas **mock** (`cliente@email` / `barbeiro@email`, senha `1234`) sempre garantidas ao carregar a lista de usuários. |
| **Componente de autenticação** | Em **`deslogado/componentes/auth-views.js`**, login e cadastro ficam no **mesmo arquivo**, em blocos separados: **CSS** (folha injetada em `<style>`, sem CSS inline nos nós), **HTML** (strings) e **JavaScript** (`ComponenteLogin` / `ComponenteCadastro`). A página só tem o contêiner `#auth-montagem`; **`app.js`** monta o componente conforme “Entrar” ou “Cadastrar”. |
| **Layout deslogado** | **`estilos.css`** cobre cabeçalho e área principal; estilos dos cartões de formulário vêm do componente (escopo `#auth-montagem`). |
| **Correções no fluxo de agenda** | Calendário com **último dia do mês** correto, botões **mês anterior / próximo** na ordem certa, link CSS **`estilos.css`**, variáveis CSS corrigidas, datas na tabela do barbeiro em **`pt-BR`**. |
| **HTML semântico** | Uso de **`main`**, **`article`**, **`header`**, **`footer`**, **`aside`**, **`section`**, **`fieldset`/`legend`**, **`nav`**, listas no calendário, **`caption`** e **`scope`** na tabela de agendamentos, além de **`aria-labelledby`** e classe **`.visually-hidden`** onde faz sentido. |

---

## Funcionalidades por área

| Pasta | Função |
|--------|--------|
| **`deslogado/`** | Login e cadastro; troca entre as duas telas via componentes; redireciona para `cliente/` ou `barbeiro/` após login válido; se já houver sessão válida, pula direto para o painel. |
| **`cliente/`** | Calendário (mês, escolha do dia), formulário de agendamento; só acessível como **cliente**. |
| **`barbeiro/`** | CRUD de serviços (lista + excluir), tabela de agendamentos com cancelar; só acessível como **barbeiro**. |
| **`Sair`** | Limpa a sessão e volta para `deslogado/`. |

### Validação

- **Login:** e-mail com formato aceito (inclui domínios simples tipo `@email` para o mock); senha obrigatória (sem exigir regra forte no login, para permitir o mock `1234`).
- **Cadastro:** senha com **mínimo 8 caracteres**, **letras e números**; confirmação igual à senha; e-mail único.

### Credenciais de demonstração

| Perfil   | E-mail                    | Senha       |
|----------|---------------------------|-------------|
| Cliente  | `cliente@navalha.local`   | `Senha1234` |
| Barbeiro | `barbeiro@navalha.local`  | `Senha5678` |

**Mock rápido:** `cliente@email` / `1234` e `barbeiro@email` / `1234` — definidos em `USUARIOS_MOCK` em `lib/armazenamento.js` e mesclados na lista se ainda não existirem.

> Em produção, autenticação e senhas ficariam no **servidor**; aqui é apenas para **estudo**.

---

## Tecnologias

- HTML5, CSS3, JavaScript (ES5)
- `localStorage` + `sessionStorage`
- Sem frameworks e sem passo de compilação

---

## Como executar

1. Abra **`index.html`** na raiz ou **`deslogado/index.html`**.
2. Se scripts não carregarem com `file://`, suba um servidor estático na pasta do projeto:

```bash
python -m http.server 8080
```

Depois use `http://localhost:8080/deslogado/index.html` (ou a raiz, que redireciona).

---

## Estrutura de pastas

```
etec_navalha3ds/
├── index.html                 # Redireciona → deslogado/
├── lib/
│   └── armazenamento.js       # Chaves, usuários, serviços, agendamentos, sessão
├── deslogado/
│   ├── index.html             # main + #auth-montagem
│   ├── estilos.css            # Página (topo, main, utilitários)
│   ├── app.js                 # Lógica de auth e troca login ↔ cadastro
│   └── componentes/
│       └── auth-views.js      # CSS (injetado) + HTML + API ComponenteLogin/Cadastro
├── cliente/
│   ├── index.html
│   ├── estilos.css
│   └── app.js
├── barbeiro/
│   ├── index.html
│   ├── estilos.css
│   └── app.js
├── Contexto.md                # Enunciado da atividade (ETEC)
└── README.md
```

---

## Dados armazenados (`localStorage` / `sessionStorage`)

| Chave | Uso |
|--------|-----|
| `barbearia_usuarios` | Contas (`email`, `senha`, `papel`) |
| `barbearia_servicos` | Serviços (`id`, `name`) |
| `barbearia_agendamentos` | Agendamentos (`id`, cliente, WhatsApp, data/hora ISO, serviço) |
| `barbearia_sessao` | Sessão atual (`sessionStorage`) |

---

## Contexto acadêmico

O arquivo **`Contexto.md`** traz objetivos da disciplina (refatoração, bugs, UX/UI, login, validação, testes). Use-o para relatório e entregas.

---

## Licença e uso

Projeto educacional; adapte conforme as regras da sua instituição.
