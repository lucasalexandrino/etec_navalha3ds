# 📝 Guia de Commits - Navalha Barbearia

Este documento descreve como os commits foram organizados e como trabalhar com o histórico de commits do projeto.

---

## 📋 Estrutura de Commits

O projeto foi desenvolvido seguindo a **Conventional Commits**, uma especificação para adicionar significado legível por humanos às mensagens de commit.

### Formato de Commit

```
<tipo>: <descrição>

<corpo opcional>
```

### Tipos de Commit

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **feat** | Nova funcionalidade | `feat: interface de agendamento` |
| **fix** | Correção de bug | `fix: validação de horário` |
| **docs** | Documentação | `docs: guia de uso` |
| **style** | Estilo (CSS, formatação) | `style: tema dark` |
| **test** | Testes | `test: validações de conflito` |
| **refactor** | Refatoração | `refactor: otimizar queries` |
| **chore** | Tarefas de manutenção | `chore: atualizar dependências` |

---

## 🎯 Commits Implementados

### Backend (4 commits)

1. **feat: database schema com tabelas de agendamento**
   - Hash: `edb0c36`
   - Cria estrutura de dados completa

2. **feat: database helpers e query functions**
   - Hash: `3c0a388`
   - Implementa funções de acesso ao banco

3. **feat: tRPC routers com autenticação e autorização**
   - Hash: `5d2b9bf`
   - Define rotas API com autenticação

4. **feat: validações de regras de negócio e testes**
   - Hash: `051369b`
   - Implementa validações e testes unitários

### Frontend (6 commits)

5. **feat: página inicial com apresentação da barbearia**
   - Hash: `a9af51f`
   - Landing page com CTA

6. **feat: interface de agendamento passo a passo**
   - Hash: `8d1b079`
   - Fluxo de 4 passos para agendamento

7. **feat: painel do cliente com agendamentos**
   - Hash: `3a9f848`
   - Dashboard para visualizar agendamentos

8. **feat: painel do barbeiro com agenda**
   - Hash: `1bfac4c`
   - Dashboard para gerenciar agenda

9. **feat: painel administrativo com visão geral**
   - Hash: `a753e34`
   - Dashboard para administração

10. **feat: página de gerenciamento de serviços (CRUD)**
    - Hash: `0048041`
    - Gestão completa de serviços

### Estilo (1 commit)

11. **style: tema dark premium com paleta âmbar/ouro**
    - Hash: `5c4d0ab`
    - Implementa design visual

### Documentação (2 commits)

12. **docs: guia de uso e documentação do projeto**
    - Hash: `4ef8f28`
    - Documentação de uso

13. **docs: adicionar histórico estruturado de commits**
    - Hash: `db68112`
    - Este arquivo de histórico

---

## 🔍 Como Explorar os Commits

### Ver todos os commits
```bash
git log --oneline
```

### Ver detalhes de um commit específico
```bash
git show edb0c36
```

### Ver mudanças entre dois commits
```bash
git diff 3c0a388 5d2b9bf
```

### Ver estatísticas de um commit
```bash
git show --stat edb0c36
```

### Ver histórico de um arquivo específico
```bash
git log --oneline -- server/db.ts
```

### Ver quem modificou cada linha
```bash
git blame client/src/pages/Booking.tsx
```

### Ver gráfico visual do histórico
```bash
git log --graph --oneline --all --decorate
```

---

## 📊 Estatísticas de Commits

- **Total de commits:** 13
- **Commits de funcionalidade:** 10
- **Commits de documentação:** 2
- **Commits de estilo:** 1
- **Linhas de código:** ~2900
- **Testes:** 9/9 passando

---

## 🚀 Como Continuar Desenvolvendo

Ao adicionar novas funcionalidades, siga este padrão:

### 1. Criar uma branch para a feature
```bash
git checkout -b feat/nova-funcionalidade
```

### 2. Fazer commits atômicos
```bash
git add arquivo-modificado.ts
git commit -m "feat: descrição da mudança

Descrição mais detalhada se necessário.
- Ponto 1
- Ponto 2"
```

### 3. Fazer push da branch
```bash
git push origin feat/nova-funcionalidade
```

### 4. Criar Pull Request
- Descreva as mudanças
- Referencie issues relacionadas
- Solicite review

---

## ✅ Checklist para Commits

Antes de fazer commit, verifique:

- [ ] Código está formatado corretamente
- [ ] Testes passam (`pnpm test`)
- [ ] TypeScript sem erros (`pnpm check`)
- [ ] Mensagem de commit é clara e descritiva
- [ ] Commit é atômico (uma mudança por commit)
- [ ] Não há arquivos desnecessários

---

## 📚 Recursos Úteis

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 🎓 Exemplo de Workflow Completo

```bash
# 1. Criar branch
git checkout -b feat/integrar-pagamento

# 2. Fazer mudanças e commits
git add server/payment.ts
git commit -m "feat: adicionar integração com Stripe

- Implementar webhook de pagamento
- Validar transações
- Atualizar status do agendamento"

# 3. Ver histórico
git log --oneline -5

# 4. Fazer push
git push origin feat/integrar-pagamento

# 5. Voltar para main
git checkout main
git pull origin main
```

---

**Última atualização:** 2026-04-01  
**Versão:** d80a5dae  
**Status:** ✅ Pronto para Produção
