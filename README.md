# ✂ Navalha — Sistema de Agendamento de Barbearia

Sistema web completo para gerenciamento de agendamentos de barbearia, desenvolvido com HTML, CSS e JavaScript puro, sem frameworks.

---

## 🚀 Como Rodar o Projeto

### Opção 1 — Abrir direto no navegador
1. Baixe ou clone este repositório
2. Abra o arquivo `index.html` no seu navegador (Chrome, Firefox, Edge ou Safari)
3. Pronto! Nenhuma instalação adicional é necessária

### Opção 2 — Servidor local simples (recomendado)
**Com Python:**
```bash
python -m http.server 8000
# Acesse: http://localhost:8000
```

**Com Node.js:**
```bash
npx serve .
```

> ⚠️ O projeto funciona inteiramente no navegador. Nenhum backend ou banco de dados é necessário.

---

## 🔑 Credenciais de Acesso (Demonstração)

| Papel     | Usuário    | Senha         |
|-----------|------------|---------------|
| Cliente   | `cliente`  | `cliente123`  |
| Barbeiro  | `barbeiro` | `barbeiro123` |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia     | Uso                                       |
|----------------|-------------------------------------------|
| HTML5          | Estrutura semântica e acessibilidade      |
| CSS3           | Variáveis CSS, Grid, Flexbox, animações   |
| JavaScript ES5+| Lógica, módulos IIFE, localStorage        |
| Google Fonts   | Space Grotesk + DM Sans + Playfair Display|
| localStorage   | Persistência total de dados               |

---

## 📁 Estrutura de Pastas

```
barbearia/
├── index.html              # Página principal
├── css/
│   └── estilos.css         # Estilos completos
├── js/
│   ├── storage.js          # Módulo de persistência (localStorage)
│   ├── ui.js               # Módulo de interface (toasts, DOM, renders)
│   ├── calendario.js       # Calendário interativo
│   ├── validacao.js        # Validação de formulários
│   └── app.js              # Orquestrador principal
├── README.md
└── TESTES.md
```

---

## 📋 Funcionalidades

### Área do Cliente
- Calendário interativo para seleção de data
- Seleção visual de serviços (cards clicáveis, múltipla seleção)
- Campo de valor total dos serviços selecionados
- Seleção de horário por caixas clicáveis (não digitação)
- Filtro de horários por período: Todos / Manhã / Tarde
- Horários ocupados marcados como desabilitados
- Visualização dos próprios agendamentos com serviço, data/hora e profissional
- Cancelamento de agendamento

### Área do Barbeiro
- 4 cards de estatísticas: Faturamento, Marcados, Concluídos, Serviços
- Abas de navegação: Agendamentos / Serviços
- Tabela de agendamentos com badge de status (Pendente / Concluído)
- Botão "Concluir" para marcar agendamento como finalizado
- Filtro de agendamentos por data e botão limpar
- Resumo financeiro com total estimado
- Cadastro de serviços com campos lado a lado
- Tabela de serviços com nome, preço, duração e botão excluir

### Sistema Geral
- Tela de login centralizada com caixa ao redor do formulário
- Sessão persistida no localStorage
- Logout funcional
- Modal de Política de Privacidade
- Toasts no canto superior direito com ícones corrigidos
- Layout responsivo para celular e desktop

---

## 📝 Histórico de Desenvolvimento

### Versão 1.0 — Projeto base
- Código em arquivo único sem separação de responsabilidades
- Sem sistema de login ou controle de acesso
- Validação dependente apenas dos atributos HTML5
- Mistura de idiomas nos identificadores
- Problemas com fuso horário
- Inserção de HTML sem sanitização

### Versão 1.1 — Refatoração e organização
- Separação em módulos IIFE: `storage.js`, `ui.js`, `calendario.js`, `validacao.js`, `app.js`
- Padronização em português
- Documentação JSDoc simplificada
- Sanitização anti-XSS com `escaparHtml()`
- Data/hora como string local `YYYY-MM-DDTHH:MM` para evitar UTC offset

### Versão 1.2 — Autenticação e validação
- Tela de login com dois papéis: cliente e barbeiro
- Sessão salva em localStorage
- Validação completa via JavaScript (sem depender só do HTML5)
- Mensagens de erro por campo com visual de borda vermelha
- Toasts de feedback para todas as ações

### Versão 1.3 — UI/UX e novas funcionalidades
- Paleta azul escuro com destaques em azul (#2d7ef7)
- Fonte Space Grotesk em títulos e elementos de UI
- Funcionalidades extras: exportar/importar JSON, dados de teste, filtro por data, resumo financeiro

### Versão 2.0 — Melhorias completas (atual)

#### Login
- Painel visual lateral removido; formulário centralizado com caixa ao redor
- Botão "Carregar dados de teste" removido
- Espaçamento corrigido entre o alerta de erro e o campo de usuário
- Visual mais limpo e direto

#### Área do Cliente
- Adicionado título "Bem-vindo à Navalha" e subtítulo acima das colunas
- Card "Meus Agendamentos" movido para a coluna esquerda (abaixo do calendário)
- Meus Agendamentos exibe: serviço, data/hora e profissional responsável
- Serviços trocados de dropdown para **cards visuais clicáveis** com nome e valor
- Seleção múltipla de serviços habilitada
- Campo de valor total aparece dinamicamente ao selecionar serviços
- Horários substituídos de input de texto para **botões clicáveis** organizados em grade
- Filtro de período nos horários: Todos / Manhã / Tarde
- Horários pré-definidos com base em funcionamento real de barbearia (08:00–19:00, excl. 12:00)
- Horários já ocupados na data selecionada aparecem desabilitados

#### Área do Barbeiro — Dashboard
- 4 cards de estatísticas no topo:
  - Faturamento (soma apenas agendamentos concluídos)
  - Agendamentos marcados (pendentes)
  - Agendamentos concluídos
  - Serviços cadastrados
- Estatísticas atualizam em tempo real a cada ação

#### Área do Barbeiro — Abas
- Navegação por abas: Agendamentos e Serviços em vez de colunas lado a lado

#### Agendamentos (barbeiro)
- Novo badge de status: "Pendente" (amarelo) / "Concluído" (verde)
- Novo botão "Concluir" para finalizar um agendamento
- Tabela mantém filtro por data, botão limpar e resumo financeiro

#### Serviços (barbeiro)
- Formulário com campos lado a lado (nome, preço, duração na mesma linha)
- Preço e duração agora são **obrigatórios** — validação corrigida
- Serviços cadastrados exibidos em tabela (nome, preço, duração, excluir)
- Botões de importar/exportar JSON removidos (simplificação)

#### Notificações (toasts)
- Movidas para o **canto superior direito** da tela
- Ícones corrigidos: ✓ para sucesso, ✕ para erro, i para info (sem dependência de emoji)

#### Visual geral
- Cor principal alterada de dourado para **azul escuro** (`#2d7ef7`) em todo o sistema
- Fonte **Space Grotesk** adotada para títulos e elementos de UI
- Cards de calendário com `box-shadow` sutil para profundidade
- Botão "Concluir" com estilo verde distinto do botão "Cancelar"

---

## ⚙️ Decisões Técnicas

**Por que IIFE?** Máxima compatibilidade sem necessidade de bundler (Webpack/Vite).

**Por que `localStorage` para dados?** Serviços e agendamentos devem persistir após fechar o navegador.

**Por que datas como string local?** `new Date().toISOString()` converte para UTC, o que pode mudar a data para usuários em UTC-3 (Brasília). A string `YYYY-MM-DDTHH:MM` preserva o horário local.

**Por que múltiplos serviços?** Barbearias reais frequentemente fazem corte + barba na mesma visita; o sistema reflete isso.

---

## 🎨 Paleta de Cores

| Variável        | Valor      | Uso                         |
|-----------------|------------|-----------------------------|
| `--bg`          | `#090e16`  | Fundo principal             |
| `--card`        | `#111927`  | Fundo dos cards             |
| `--acento`      | `#2d7ef7`  | Cor principal (azul)        |
| `--perigo`      | `#e05252`  | Erros e exclusões           |
| `--sucesso`     | `#3dba82`  | Confirmações e conclusões   |
| `--aviso`       | `#f5a623`  | Badges de status pendente   |
| `--info`        | `#5b9bd5`  | Notificações informativas   |

---

## 👨‍💻 Autor

Projeto desenvolvido como exercício didático de desenvolvimento web front-end.
Nível: Ensino Técnico em Informática / Desenvolvimento de Sistemas.
