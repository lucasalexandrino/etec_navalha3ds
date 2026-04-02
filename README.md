# Navalha — Agenda da Barbearia

Protótipo web de agendamento para barbearia, desenvolvido como base de estudo em **HTML**, **CSS** e **JavaScript** puro. Os dados ficam salvos no **localStorage** do navegador (sem servidor obrigatório).

## Funcionalidades

| Área | O que dá para fazer |
|------|----------------------|
| **Cliente** | Ver calendário do mês, escolher o dia (preenche a data), criar agendamento com nome, WhatsApp, serviço, data e hora. |
| **Barbeiro** | Cadastrar e excluir serviços; listar agendamentos ordenados por data/hora e cancelar um agendamento. |

A troca entre as telas é feita pelas abas **Cliente** e **Barbeiro** no topo da página.

## Tecnologias

- HTML5  
- CSS3 (variáveis, grid, responsividade básica)  
- JavaScript (ES5, um único arquivo, sem build)

## Como executar

1. Clone ou baixe esta pasta do projeto.
2. Abra o arquivo **`index.html`** no navegador (duplo clique ou arrastar para a janela do Chrome, Edge, Firefox, etc.).

Opcional: com um servidor estático local (útil se no futuro houver módulos ou políticas de arquivo):

```bash
# Exemplo com Python 3 (na pasta do projeto)
python -m http.server 8080
```

Depois acesse `http://localhost:8080` no navegador.

## Estrutura de pastas

```
etec_navalha3ds/
├── index.html          # Página principal e marcação
├── css/
│   └── estilos.css     # Estilos e tema visual
├── js/
│   └── app.js          # Lógica: storage, calendário, formulários, tabelas
├── Contexto.md         # Enunciado da atividade (requisitos e entregáveis)
└── README.md           # Este arquivo
```

## Dados armazenados

As chaves usadas no `localStorage` são:

- `barbearia_servicos` — lista de serviços (`id`, `name`).
- `barbearia_agendamentos` — agendamentos (`id`, nome do cliente, WhatsApp, data/hora em ISO, serviço).

Limpar os dados do site no navegador apaga esses registros.

## Contexto acadêmico

O arquivo **`Contexto.md`** descreve objetivos da disciplina (refatoração, correção de bugs, UX/UI, login simulado, validação de formulários, testes manuais). Use-o como referência para relatório e entregas.

## Licença e uso

Projeto educacional; adapte e cite conforme as regras da sua instituição.
