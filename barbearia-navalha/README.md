# Navalha — Agenda da barbearia

Protótipo de agenda para barbearia: o cliente consulta o calendário e cria agendamentos; o barbeiro cadastra serviços e gerencia a lista de agendamentos. Os dados ficam no **localStorage** do navegador (sem servidor).

## Como abrir

Abra o ficheiro `index.html` **desta pasta** (`barbearia/index.html`) no navegador (duplo clique ou *Live Server*). Os caminhos de CSS e JS são relativos a esta pasta.

## Tecnologias

- HTML5  
- CSS3  
- JavaScript (sem frameworks; scripts carregados em sequência)

## Estrutura de pastas e ficheiros JS

A pasta do projeto está organizada em `css/` (apresentação), `js/` (comportamento) e `index.html` (estrutura).

| Ficheiro | Responsabilidade |
|----------|------------------|
| **storage.js** | Chaves do `localStorage`, `carregar`, `salvar`, `gerarId`. |
| **servicos.js** | Módulo `Servicos`: listar, adicionar, remover, obter por id; normalização de dados antigos (`name` → `nome`). |
| **agendamentos.js** | Módulo `Agendamentos`: CRUD lógico, ordenação por data/hora, `formatarDataHoraBr`, `dataHoraLocalParaIso`, dias do mês com agendamento; normalização de registos antigos (`datetime`/`clientName`/…). |
| **ui.js** | Ligação ao DOM: abas (teclado e ARIA), calendário com rótulos acessíveis, formulários, tabela, validação, mensagens de erro/sucesso, estado do botão conforme serviços disponíveis. |

---

## Histórico do que foi feito

### Refatoração e organização

- Projeto concentrado na pasta **`barbearia/`** com `index.html`, `css/estilos.css` e os quatro scripts acima.
- Separação de responsabilidades: HTML só estrutura, CSS só apresentação, JS só comportamento (sem estilos inline nem scripts embutidos no HTML).
- **Nomes em português** para variáveis, funções, IDs e classes (ex.: `painelCliente`, `formularioAgendamento`, `botao-primario`, `data-perfil`).
- Remoção da aplicação monolítica antiga na raiz do repositório (`app.js` único) em favor desta estrutura modular.
- Comentários apenas onde acrescentam contexto (trechos não óbvios); lógica duplicada reduzida (ex.: tabela de agendamentos atualizada sem refazer a lista de serviços em cada confirmação de agendamento).

### Correções de bugs (calendário e dados)

- **Último dia do mês** no calendário; **botões de mês** alinhados aos rótulos; **formatação pt-BR** na tabela; **variáveis CSS** corrigidas onde havia typos.

### Validação, armazenamento e acessibilidade (base)

- Validação do agendamento (serviços, data/hora); **`Agendamentos.adicionar`** com guarda; mensagens de erro; **`:focus-visible`** nos controlos principais.

### UX, UI, responsividade e acessibilidade (revisão completa)

- **Separação cliente/barbeiro**: painéis com `role="tabpanel"`, `aria-labelledby`, `aria-hidden` e `hidden` sincronizados; apenas um painel visível de cada vez.
- **Formulários**: cada campo com `<label for="…">` explícito; textos de ajuda; mensagens de erro mais claras; **confirmação visual** após agendar (`#mensagemSucessoAgendamento`, `role="status"`).
- **Abas**: `aria-controls`, navegação por **setas** / **Home** / **End** na lista de separadores; **roving tabindex** (aba ativa com `tabindex="0"`).
- **Calendário**: `aria-label` dinâmico na área dos dias; cada dia com rótulo falável; foco no campo data ao escolher dia.
- **Tabela**: `<caption>` para leitores de ecrã; `scope="col"` nos cabeçalhos; célula de ações com texto só para leitor (`sr-only`).
- **Tema visual**: hierarquia (epígrafe, títulos, bordas), paleta com melhor contraste, áreas de mensagem com fundo e borda, estados **hover** / **focus** / **disabled** no botão principal e noutros controlos.
- **Responsividade**: `min-width: 360px` na raiz; grelha de data/hora em duas colunas a partir de ~400px; tabela com `min-width` e `overflow-x: auto`; áreas de toque ~44px nas abas e botões relevantes.
- **Saltar para o conteúdo**: link `.link-pular` visível ao focar; `#conteudoPrincipal` com `tabindex="-1"` para receber foco.
- **`prefers-reduced-motion`**: redução de animações no CSS; scroll suave à mensagem de sucesso respeita a preferência do sistema.

### Verificações sem alteração necessária (nessa fase)

- Caminhos relativos de CSS e JS corretos a partir de `barbearia/index.html`.

---

## Melhorias priorizadas (texto de entrega)

**Melhoria 1 — Acessibilidade e formulários**  
Foi feita a associação explícita de cada campo a um `<label for="id">`, textos de ajuda (`aria-describedby` onde faz sentido), região de erro com `role="alert"` e `aria-live="assertive"`, região de sucesso com `role="status"`, legenda e cabeçalhos na tabela, e padrão de abas com teclado e `aria-*`. Isto foi priorizado porque garante uso por leitores de ecrã e teclado, alinhado ao WCAG AA no que toca a estrutura e foco visível.

**Melhoria 2 — Fluxo cliente/barbeiro e feedback**  
O cliente só interage com calendário e agendamento; o barbeiro só com serviços e lista (painéis mutuamente exclusivos e `aria-hidden`). Após criar um agendamento, mostra-se uma mensagem de sucesso clara (e não só erros), e as mensagens de falha passaram a linguagem orientada à pessoa utilizadora. Isto reduz confusão e aumenta confiança no fluxo.

**Melhoria 3 — Interface e responsividade**  
Ajustou-se contraste e hierarquia visual (tipografia, espaçamentos, cartões), estados de botão incluindo `disabled` quando não há serviços, e layout até 360px de largura com tabela em scroll horizontal. Isto prioriza leitura confortável e uso em telemóvel, cenário típico de agendamento rápido.

---

## Manutenção deste documento

**Após cada mudança relevante no código ou no comportamento da aplicação**, atualize a secção **Histórico do que foi feito** (e, se aplicável, **Melhorias priorizadas** ou a tabela de estrutura).
