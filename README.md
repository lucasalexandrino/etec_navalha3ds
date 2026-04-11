# Barbearia Navalha - Sistema de Agendamento

Sistema de agendamento para Barbearia Navalha com autenticação real, controle de acesso e painéis separados para cliente, barbeiro e administrador.

## Estrutura

- `frontend/` — frontend estático servido pelo backend.
- `server.js` — backend Express que protege rotas e emite tokens JWT.
- `data/db.json` — armazenamento leve em JSON.

## Funcionalidades implementadas

- Login único com detecção automática de perfil:
  - Cliente
  - Barbeiro
  - Administrador
- Autenticação baseada em token JWT.
- Controle de acesso no backend para proteger rotas de administração e barbeiro.
- Painel separado para cada perfil:
  - Cliente: agendar e cancelar com antecedência mínima de 2h.
  - Barbeiro: ver agenda pessoal e cancelar seus próprios agendamentos.
  - Admin: ver agenda completa, cadastrar barbeiros, adicionar serviços e gerenciar clientes.
- Agenda com bloqueio de horários já ocupados.
- Regras de funcionamento:
  - Segunda a sexta: 09h às 18h
  - Sábado: 09h às 13h
  - Domingo: fechado

## Como rodar

1. Abra o PowerShell na pasta do projeto:
   ```powershell
   cd C:\Users\driel\Desktop\etec_navalha3ds
   ```
2. Instale dependências:
   ```powershell
   npm install
   ```
3. Inicie o servidor:
   ```powershell
   npm start
   ```
4. Acesse no navegador:
   ```text
   http://localhost:3000
   ```

## Logins de teste

- Administrador:
  - E-mail: `admlucas@gmail.com`
  - Senha: `12345678`
- Barbeiro demo:
  - E-mail: `barbeiro@navalha.com`
  - Senha: `navalha`

## Observações

- O backend usa JWT para autenticação e protege rotas sensíveis.
- O frontend mantém o token em `localStorage` e redireciona automaticamente após login.
- O botão `Entrar` abre o login único para todos os perfis.
