## Navalha — Sistema de Gestão para Barbearia (Vanilla JS)

Protótipo completo em **HTML5 + CSS3 moderno + JavaScript puro**, com persistência via **LocalStorage**.

### Como executar

- Abra o arquivo `index.html` no navegador (recomendado: Chrome/Edge).
- **Admin:** `admin/index.html` (mesmo LocalStorage que o site).
- Não precisa de backend.

### Acessos (demo)

- **Admin**: `admin@navalha.com` / `1234`
- **Cliente**: `usuario@navalha.com` / `1234`
- **Barbeiro (Rafa)**: `barbeiro@navalha.com` / `1234`

### O que foi implementado

- **Três perfis**: Cliente, Barbeiro e Admin (sessão no LocalStorage).
- **Agendamento com validações reforçadas**:
  - Serviços com **duração dinâmica** (editável no admin).
  - **Intervalo de limpeza**: +10m entre atendimentos.
  - **Bloqueio de conflito** por barbeiro (inclui limpeza).
  - **Somente dias úteis** (segunda a sexta).
  - **Horário de funcionamento** 9h–18h (último início respeita duração + limpeza).
  - **Antecedência mínima de 1 hora** para novos agendamentos.
- **Pagamentos**:
  - **Pix** (modal com QR fictício), **Dinheiro**, **Cartão** (crédito/débito), **Boleto** (linha digitável fictícia).
  - Status: **Pendente**, **Pago**, **Cancelado** (admin confirma recebimento; boleto segue o mesmo fluxo demo).
- **Painel do barbeiro**:
  - **Agenda semanal** (seg–sex) com navegação entre semanas.
  - **Visão “Hoje”** com ações rápidas.
  - **Detalhes do cliente** (contato + histórico recente).
  - **Editar agendamento** (serviço, data e hora, com checagem de conflito).
  - **Ajustar valor** quando a forma de pagamento é **dinheiro**.
  - **Marcar como concluído** (registra data/hora real).
  - **Cancelar** (com confirmação; libera horário).
- **Dashboard Admin** (em `admin/index.html`):
  - KPIs do dia: total, Pix, dinheiro, cartão e **boleto** (somente “Pago”).
  - Pendências, agenda do dia, **coluna de atendimento** (agendado / concluído).
  - Aba **Serviços**: criar, editar (nome, duração, preço) e excluir.
- **Histórico do cliente** com status de pagamento e de **atendimento** (concluído).

### Estrutura

- `index.html` (login, cliente e barbeiro)
- `admin/index.html`, `admin/admin.css`, `admin/admin.js` (painel administrativo)
- `css/styles.css`
- `js/app.js` (UI + fluxo do site principal)
- `js/scheduler.js` (regras de horário, conflito, dia útil, antecedência)
- `js/storage.js` (LocalStorage + dados iniciais)
- `js/ui.js` (toasts/confirm)
