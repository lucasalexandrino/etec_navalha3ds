## Navalha — Sistema de Gestão para Barbearia (Vanilla JS)

Protótipo completo em **HTML5 + CSS3 moderno + JavaScript puro**, com persistência via **LocalStorage**.

### Como executar

- Abra o arquivo `index.html` no navegador (recomendado: Chrome/Edge).
- Não precisa de backend.

### Acessos (demo)

- **Admin**: `admin@navalha.com` / `1234`
- **Usuário**: `usuario@navalha.com` / `1234`

### O que foi implementado

- **Login e níveis de acesso**: Cliente vs Admin (sessão no LocalStorage).
- **Agendamento com lógica “à prova de erros”**:
  - Serviços com **duração dinâmica** (Corte 30m, Barba 20m, Completo 50m).
  - **Intervalo de limpeza**: +10m entre atendimentos.
  - **Bloqueio de conflito** por barbeiro com a regra:
    - \((Novo\_Inicio < Existente\_Fim+limpeza) && (Novo\_Fim+limpeza > Existente\_Inicio)\)
  - Horários **ocupados** e **passados** ficam desabilitados.
- **Pagamentos**:
  - Cliente escolhe método (Pix/Dinheiro/Cartão Crédito/Débito).
  - Status: **Pendente**, **Pago**, **Cancelado**.
  - **Modal Pix** com QR fictício.
- **Dashboard Admin**:
  - Resumo do dia (total e por método).
  - Lista de pendentes com destaque (laranja/vermelho).
  - Ações: **Marcar como Pago** (registra hora) e **Cancelar**.

### Estrutura

- `index.html`
- `css/styles.css`
- `js/app.js` (UI + fluxo)
- `js/scheduler.js` (regras de horário/conflito)
- `js/storage.js` (LocalStorage)
- `js/ui.js` (toasts/confirm)

