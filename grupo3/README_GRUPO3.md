# Navalha Barbearia - Grupo 3

## Sobre o Projeto

Sistema web completo de agendamento para a **Navalha Barbearia**, desenvolvido pelo **Grupo 3** como atividade prática da disciplina de Análise e Desenvolvimento de Sistemas.

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação e Autorização
- Sistema de autenticação com Manus OAuth
- 3 perfis diferenciados: Cliente, Barbeiro e Administrador
- Proteção de rotas por perfil

### ✅ Interface de Agendamento
- Fluxo passo a passo (4 passos)
- Seleção de serviço, profissional, data e horário
- Validações em tempo real
- Confirmação de agendamento

### ✅ Painéis de Usuário

**Cliente:**
- Visualização de agendamentos futuros
- Histórico de agendamentos
- Cancelamento com validações
- Detalhes de cada agendamento

**Barbeiro:**
- Agenda diária e semanal
- Visualização de atendimentos
- Próximos atendimentos em destaque
- Informações do cliente e serviço

**Administrador:**
- Dashboard com estatísticas
- Gestão de serviços (CRUD)
- Gestão de profissionais
- Relatórios de faturamento e ocupação

### ✅ Validações e Regras de Negócio
- Validação de conflitos de horários
- Antecedência mínima de 1 hora para agendamento
- Antecedência mínima de 2 horas para cancelamento
- Validação de horário de funcionamento (9h-18h, seg-sex)
- Validação de duração do serviço

### ✅ Design e UX
- Tema dark premium com paleta âmbar/ouro
- Design responsivo (mobile, tablet, desktop)
- Componentes com shadcn/ui
- Ícones com lucide-react
- Feedback visual (loading, sucesso, erro)

### ✅ Testes
- 9 testes unitários passando
- Cobertura de validações
- Testes de autenticação

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Tailwind 4 + shadcn/ui |
| **Backend** | Express 4 + tRPC 11 |
| **Banco de Dados** | MySQL (Drizzle ORM) |
| **Autenticação** | Manus OAuth |
| **Testes** | Vitest |
| **Build** | Vite |

---

## 📁 Estrutura do Projeto

```
grupo3/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários e configurações
│   │   └── App.tsx           # Roteamento principal
│   └── public/               # Arquivos estáticos
├── server/                    # Backend Express
│   ├── routers.ts            # Rotas tRPC
│   ├── db.ts                 # Helpers de banco de dados
│   ├── validation.ts         # Validações de negócio
│   └── validation.test.ts    # Testes
├── drizzle/                   # Schema e migrations
│   └── schema.ts             # Definição de tabelas
├── shared/                    # Código compartilhado
├── COMMITS.md                # Histórico de commits
├── GUIA_USO.md               # Guia de uso
└── todo.md                   # Rastreamento de funcionalidades
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- MySQL (ou banco compatível)

### Instalação

```bash
# Instalar dependências
cd grupo3
pnpm install

# Configurar variáveis de ambiente
# Copiar .env.example para .env.local e preencher com suas credenciais

# Executar migrations
pnpm drizzle-kit migrate

# Iniciar servidor de desenvolvimento
pnpm dev
```

O site estará disponível em `http://localhost:3000`

---

## 📊 Commits Estruturados

O projeto foi desenvolvido com 13 commits bem organizados:

1. **Database schema** - Estrutura de dados
2. **Database helpers** - Funções de acesso
3. **tRPC routers** - Rotas API
4. **Validações** - Regras de negócio + testes
5. **Página inicial** - Landing page
6. **Interface de agendamento** - Fluxo 4 passos
7. **Painel do cliente** - Dashboard cliente
8. **Painel do barbeiro** - Dashboard barbeiro
9. **Painel administrativo** - Dashboard admin
10. **Gerenciamento de serviços** - CRUD serviços
11. **Tema visual** - Design premium
12. **Documentação** - Guias e instruções
13. **Histórico de commits** - Referência

Ver `COMMITS.md` para detalhes completos.

---

## ✅ Testes

```bash
# Executar todos os testes
pnpm test

# Executar com cobertura
pnpm test -- --coverage

# Modo watch
pnpm test -- --watch
```

**Status:** ✅ 9/9 testes passando

---

## 📚 Documentação

- **GUIA_USO.md** - Instruções para clientes, barbeiros e administradores
- **COMMITS.md** - Histórico detalhado de cada commit
- **COMMIT_STATS.md** - Estatísticas de desenvolvimento
- **COMMITS_README.md** - Guia de como trabalhar com commits

---

## 👥 Grupo 3

**Membros:**
- [Adicionar nomes dos integrantes]

**Disciplina:** Análise e Desenvolvimento de Sistemas  
**Instituição:** ETEC  
**Período:** 2026

---

## 📝 Fluxo de Trabalho Git

Este projeto segue o fluxo colaborativo obrigatório:

1. ✅ Branch criada: `grupo3-navalha`
2. ✅ Commits estruturados na branch
3. ⏳ Push para o repositório remoto
4. ⏳ Pull Request para revisão

---

## 🔗 Repositório

- **Repositório Base:** https://github.com/lucasalexandrino/etec_navalha3ds
- **Branch do Grupo 3:** `grupo3-navalha`

---

## 📞 Suporte

Para dúvidas sobre o projeto, consulte:
- GUIA_USO.md - Instruções de uso
- COMMITS.md - Histórico de implementação
- Código comentado nas páginas principais

---

**Última atualização:** 2026-04-01  
**Status:** ✅ Pronto para Entrega
