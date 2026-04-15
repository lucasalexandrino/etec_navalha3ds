# Barbearia Navalha - Sistema de Agendamento

**Projeto Educacional - Ensino Técnico em Desenvolvimento de Sistemas**

Sistema completo de agendamento para Barbearia com autenticação por JWT, controle de acesso por papéis (cliente/barbeiro/admin) e painéis separados para cada perfil.

---

## 📋 Índice

- [Início Rápido](#início-rápido)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Funcionalidades](#funcionalidades)
- [Dados de Teste](#dados-de-teste)
- [Tecnologias](#tecnologias)
- [Documentação](#documentação)

---

## 🚀 Início Rápido

### Requisitos
- Node.js v14+ instalado
- npm (vem com Node.js)
- PowerShell ou Terminal

### Passos

1. **Abra o terminal (PowerShell) na pasta do projeto:**
   ```powershell
   cd C:\Users\etec\Desktop\etec_navalha3ds
   ```

2. **Instale as dependências:**
   ```powershell
   npm install
   ```

3. **Inicie o servidor:**
   ```powershell
   npm start
   ```
   Ou alternativamente:
   ```powershell
   node server.js
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

5. **Faça login** com um dos perfis de teste (veja abaixo)

---

## 📁 Estrutura de Pastas

```
etec_navalha3ds/
├── server.js              ← Servidor Express com API e rotas protegidas
├── package.json           ← Dependências (express, jsonwebtoken, cors)
├── package-lock.json      ← Lock file
│
├── data/
│   └── db.json           ← Banco de dados em JSON (clientes, barbeiros, agendamentos)
│
├── frontend/             ← Aplicação web servida pelo backend
│   ├── index.html        ← Estrutura HTML (painéis, formulários, modais)
│   ├── css/
│   │   └── estilos.css   ← Estilos CSS (responsivo, acessível, visual)
│   ├── js/
│   │   └── app.js        ← Lógica Front-end (1.400+ linhas, bem organizado)
│   └── img/
│       └── Logo.png      ← Logo da barbearia
│
├── RELATORIO.md          ← Relatório de bugs, refatorações e UX/UI ✅
├── TESTES.md             ← Checklist de testes manuais ✅
├── README.md             ← Este arquivo
└── .gitignore            ← Arquivos ignorados no Git
```

### Explicação das Pastas Principais

**`server.js`**
- Backend Node.js com Express
- Autenticação por JWT
- API RESTful com proteção de rotas
- Armazena dados em `data/db.json`
- Executa em http://localhost:3000

**`frontend/`**
- Aplicação web estática servida pelo backend
- HTML semântico com ARIA labels
- CSS responsivo (mobile, tablet, desktop)
- JavaScript com funções bem organizadas

**`data/db.json`**
- Banco de dados simples em JSON
- Estrutura: `{ clients: [], barbers: [], services: [], bookings: [] }`
- Persiste dados entre reinicializações do servidor

---

## ✨ Funcionalidades

### Por Perfil de Usuário

#### 👤 Cliente
- ✅ Fazer login seguro
- ✅ Ver calendário de disponibilidade
- ✅ Agendar com **múltiplos serviços**
- ✅ Visualizar duração total (30 min por serviço)
- ✅ Selecionar data/hora com horários bloqueados
- ✅ Visualizar todos seus agendamentos
- ✅ Cancelar agendamentos (com antecedência mínima de 2h)
- ✅ Logout

#### 💼 Barbeiro
- ✅ Fazer login seguro
- ✅ Ver agenda de hoje
- ✅ Ver próximos agendamentos
- ✅ **Marcar atendimentos como realizados** (botão ✓)
- ✅ **Ver ganhos do mês** (total R$ + quantidade)
- ✅ **Navegar entre meses** para ver ganhos anteriores
- ✅ Ver histórico de atendimentos realizados
- ✅ Cancelar agendamentos próprios
- ✅ Logout

#### 👨‍💼 Administrador
- ✅ Fazer login seguro
- ✅ Cadastrar novos barbeiros
- ✅ Adicionar serviços (nome + preço)
- ✅ Gerenciar lista de clientes
- ✅ Ver agenda completa de todos
- ✅ **Ver atendimentos por mês** (lista detalhada com navegação)
- ✅ Visualizar relatório mensal (faturamento total + estatísticas)
- ✅ Deletar clientes/serviços/agendamentos
- ✅ Logout

### Funcionalidades Técnicas

#### 🔒 Segurança
- ✅ Autenticação por JWT (8 horas de validade)
- ✅ Proteção de rotas por papéis (client/barber/admin)
- ✅ Validação de dados no backend
- ✅ Proteção CORS habilitada

#### 📅 Agendamentos
- ✅ **Múltiplos serviços** com soma de preços
- ✅ **Duração automática**: 30 min × quantidade de serviços
- ✅ **Bloqueio de barbeiro** por período completo
- ✅ Validação de conflitos de horário
- ✅ Respeitam expediente:
  - Segunda a sexta: 09h-18h
  - Sábado: 09h-13h
  - Domingo: fechado
- ✅ Mínimo 1 hora de antecedência

#### 💰 Ganhos
- ✅ Cálculo automático de ganhos por barbeiro
- ✅ Filtro por mês e ano
- ✅ Navegação entre meses (anterior/próximo)
- ✅ Conta quantidade de agendamentos

#### 📊 Relatórios
- ✅ Faturamento mensal por barbeiro
- ✅ Admin vê faturamento total do mês
- ✅ Estatísticas: quantidade serviços, quantidade agendamentos

#### ✅ Status de Atendimentos
- ✅ Campo `status` em cada agendamento: "agendado", "realizado", "cancelado"
- ✅ Badges visuais coloridos para identificação rápida
- ✅ Barbeiro pode marcar atendimentos como "realizados"
- ✅ Cliente pode cancelar agendamentos
- ✅ Status salvo permanentemente no banco de dados

---

## 🧪 Dados de Teste

### Administrador
- **E-mail:** `admlucas@gmail.com`
- **Senha:** `12345678`
- **Acesso:** Painel administrativo completo

### Barbeiro
- **Criar novo** via painel admin ou usar dados salvos
- **Exemplo (se existir em db.json):**
  - E-mail: `barbeiro@example.com`
  - Senha: `navalha` (define ao criar)

### Cliente
- **Criar novo** clicando em "Não tem conta? Cadastre-se"
- **Exemplo de dados:**
  - Nome: João Silva
  - E-mail: joao@example.com
  - WhatsApp: 14991234567
  - Senha: senha123

### Para Testar Rápido
1. Faça login como **admin**
2. Crie um **novo barbeiro**
3. Adicione **serviços** (Corte, Barba, Hidratação, etc.)
4. **Logout** e cadastre como **cliente**
5. Agende múltiplos serviços com esse barbeiro
6. Faça login como **barbeiro** para ver ganhos

---

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **JWT (jsonwebtoken)** - Autenticação por token
- **CORS** - Cross-Origin Resource Sharing
- **JSON** - Armazenamento de dados

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos (flexbox, grid, responsive)
- **JavaScript Vanilla** - Sem frameworks
- **Fetch API** - Requisições HTTP

### Versionamento
- **Git/GitHub** - Controle de versão (opcional)

---

## 📚 Documentação

- **[RELATORIO.md](RELATORIO.md)** - Bugs corrigidos, refatorações, decisões de UX/UI
- **[TESTES.md](TESTES.md)** - Checklist completo de testes manuais (45+ itens)
- **Contexto.md** - Requisitos do projeto educacional

---

## 📝 Observações Importantes

⚠️ **Este é um projeto EDUCACIONAL**

- Senhas são armazenadas em texto simples (INSEGURO - apenas para aprendizado)
- Banco de dados é um arquivo JSON local (não para produção)
- Sem criptografia de dados em trânsito (use HTTPS em produção)
- Sem recuperação de senha ou 2FA
- Sem logs de auditoria

**Em produção real:**
- Use criptografia (bcrypt para senhas)
- Use banco de dados real (PostgreSQL, MongoDB, etc.)
- Use HTTPS obrigatoriamente
- Implemente 2FA
- Use variáveis de ambiente para segredos
- Adicione logging e auditoria

---

## ✅ Verificação Rápida

Após iniciar o servidor, teste:

```
1. http://localhost:3000           → Tela de login
2. Login com admin                 → Painel administrativo
3. Criar barbeiro → Criar serviço  → Logout → Cadastro cliente
4. Login como cliente              → Agendar serviço
5. Verificar ganhos do barbeiro    → Navegar meses
```

---

## 📞 Suporte

Para dúvidas sobre:
- **Bugs:** Consulte `RELATORIO.md`
- **Testes:** Consulte `TESTES.md`
- **Funcionalidades:** Veja os painéis no navegador
- **Código:** Leia comentários em `server.js` e `frontend/js/app.js`

---

**Projeto desenvolvido como atividade educacional - Ensino Técnico**  
**Data: 14 de Abril de 2026**
