# ✅ TESTES.md — Checklist de Testes Manuais

Guia de testes manuais para validar todas as funcionalidades do sistema.
Marque cada item conforme for testando.

---

## 🔐 1. Sistema de Login

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 1.1 | Abrir o projeto sem estar logado | Tela de login centralizada com caixa ao redor do formulário | |
| 1.2 | Verificar que não existe botão "Dados de teste" | Apenas credenciais de demonstração visíveis | |
| 1.3 | Submeter formulário vazio | Mensagens de erro nos campos de usuário e senha | |
| 1.4 | Preencher usuário mas não a senha | Erro apenas no campo de senha | |
| 1.5 | Digitar usuário/senha incorretos | Alerta "Usuário ou senha incorretos" com espaço acima dos campos | |
| 1.6 | Verificar espaçamento do erro acima do campo usuário | Há margem entre o alerta de erro e o campo, sem estar colado | |
| 1.7 | Login com `cliente` / `cliente123` | Entra no painel do cliente | |
| 1.8 | Login com `barbeiro` / `barbeiro123` | Entra no painel do barbeiro | |
| 1.9 | Fechar e reabrir o navegador logado | Sessão persiste, entra direto no painel correto | |

---

## 🚪 2. Logout

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 2.1 | Clicar em "Sair" no cabeçalho | Toast "Você saiu da conta." no canto superior direito, retorna ao login | |
| 2.2 | Após logout, tentar voltar com botão do navegador | Tela de login aparece | |
| 2.3 | Fazer logout e login com papel diferente | Painel correto exibido | |

---

## 🎨 3. Visual Geral

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 3.1 | Verificar cor de destaque principal | Azul (#2d7ef7) em botões, bordas ativas, calendário | |
| 3.2 | Verificar fontes nos títulos dos cards | Space Grotesk nos títulos como "Calendário", "Novo Agendamento" | |
| 3.3 | Toasts no canto superior direito | Notificações aparecem no topo direito, não embaixo | |
| 3.4 | Toast de sucesso | Ícone "✓" (checkmark simples, não emoji) | |
| 3.5 | Toast de erro | Ícone "✕" correto | |
| 3.6 | Toast de info | Ícone "i" correto | |

---

## 👤 4. Painel Cliente — Boas-vindas e Layout

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 4.1 | Ao entrar como cliente | Título "Bem-vindo à Navalha" e subtítulo visíveis acima das colunas | |
| 4.2 | Layout em desktop | Coluna esquerda: Calendário + Meus Agendamentos; Coluna direita: formulário | |
| 4.3 | "Meus Agendamentos" na coluna esquerda | Card abaixo do calendário, separado do formulário | |

---

## 📅 5. Calendário

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 5.1 | Abrir painel do cliente | Calendário do mês atual exibido | |
| 5.2 | Dia de hoje | Destacado com borda azul | |
| 5.3 | Clicar em um dia | Dia selecionado em azul + campo data preenchido + horários atualizados | |
| 5.4 | Navegar meses (◀ / ▶) | Calendário avança/recua | |
| 5.5 | Criar agendamento em uma data | Essa data mostra ponto azul no calendário | |

---

## 🛠️ 6. Seleção de Serviços (Cliente)

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 6.1 | Serviços exibidos como cards visuais | Caixas clicáveis com nome e valor, não dropdown | |
| 6.2 | Clicar em um serviço | Card fica destacado visualmente (borda azul + fundo tintado) | |
| 6.3 | Clicar em mais de um serviço | Múltiplos cards selecionados simultaneamente | |
| 6.4 | Ao selecionar qualquer serviço | Campo de valor total aparece com a soma correta | |
| 6.5 | Desmarcar todos os serviços | Campo de valor total desaparece | |
| 6.6 | Tentar enviar sem serviço selecionado | Erro "Selecione ao menos um serviço" | |
| 6.7 | Sem serviços cadastrados | Aviso informativo aparece no lugar dos cards | |

---

## 🕐 7. Seleção de Horários (Cliente)

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 7.1 | Horários exibidos como botões clicáveis | Grade de botões com horas reais (08:00, 08:30... 19:00) | |
| 7.2 | Filtro "Manhã" | Exibe apenas horários das 08:00 às 11:30 | |
| 7.3 | Filtro "Tarde" | Exibe apenas horários das 13:00 às 19:00 | |
| 7.4 | Filtro "Todos" | Todos os horários visíveis | |
| 7.5 | Clicar em um horário | Botão fica azul/selecionado; campo oculto ag-hora recebe o valor | |
| 7.6 | Clicar em outro horário | Seleção anterior desmarcada, novo botão selecionado | |
| 7.7 | Criar agendamento; selecionar a mesma data | Horário usado aparece desabilitado (tachado/opaco) | |
| 7.8 | Tentar enviar sem horário selecionado | Erro "Selecione um horário" | |

---

## 📋 8. Formulário de Agendamento (Cliente)

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 8.1 | Submeter formulário vazio | Erros em todos os campos obrigatórios | |
| 8.2 | Nome com menos de 3 caracteres | Erro "Nome muito curto" | |
| 8.3 | WhatsApp com menos de 10 dígitos | Erro "WhatsApp inválido" | |
| 8.4 | Selecionar data passada | Erro "Não é possível agendar em datas passadas" | |
| 8.5 | Preencher tudo corretamente | Toast de sucesso + agendamento em "Meus agendamentos" | |
| 8.6 | Agendar dois serviços + um horário | Agendamento salvo com nome e preço combinados | |
| 8.7 | Tentar agendar mesmo horário/data duas vezes | Erro "Este horário já está ocupado" | |

---

## 📆 9. Meus Agendamentos (Cliente)

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 9.1 | Após criar agendamento | Aparece em "Meus Agendamentos" na coluna esquerda | |
| 9.2 | Conteúdo do card de agendamento | Exibe: nome do(s) serviço(s), data/hora e profissional | |
| 9.3 | Clicar em "Cancelar" | Agendamento removido + toast informativo | |
| 9.4 | Sem agendamentos | Mensagem "Nenhum agendamento encontrado." | |

---

## 📊 10. Painel Barbeiro — Estatísticas

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 10.1 | Ao entrar como barbeiro | 4 cards de stats visíveis no topo | |
| 10.2 | Card "Agendamentos Marcados" | Mostra a contagem de agendamentos pendentes | |
| 10.3 | Card "Agendamentos Concluídos" | Mostra contagem de concluídos (inicia em 0) | |
| 10.4 | Card "Serviços Cadastrados" | Reflete quantidade real de serviços | |
| 10.5 | Card "Faturamento" | Soma apenas agendamentos com status concluído | |
| 10.6 | Concluir um agendamento | Stats atualizam imediatamente (marcados -1, concluídos +1, faturamento +preço) | |

---

## 🗂️ 11. Abas do Painel Barbeiro

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 11.1 | Aba "Agendamentos" ativa por padrão | Tabela de agendamentos visível ao entrar | |
| 11.2 | Clicar na aba "Serviços" | Conteúdo de serviços exibido, agendamentos ocultados | |
| 11.3 | Clicar na aba "Agendamentos" | Volta para a tabela de agendamentos | |
| 11.4 | Aba ativa com sublinhado azul | Indicação visual clara da aba atual | |

---

## 📊 12. Agendamentos — Barbeiro

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 12.1 | Agendamentos na tabela | Coluna de status com badge "Pendente" (amarelo) | |
| 12.2 | Clicar em "Concluir" | Badge muda para "Concluído" (verde), botão Concluir some | |
| 12.3 | Clicar em "Cancelar" | Agendamento removido da tabela | |
| 12.4 | Filtrar por data | Apenas agendamentos da data filtrada | |
| 12.5 | Limpar filtro | Todos os agendamentos voltam | |
| 12.6 | Resumo no rodapé | Mostra quantidade e total estimado | |

---

## 🛠️ 13. Serviços — Barbeiro

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 13.1 | Campos Nome, Preço e Duração ficam lado a lado | Layout horizontal na mesma linha | |
| 13.2 | Submeter formulário de serviço vazio | Erro em todos os três campos | |
| 13.3 | Tentar cadastrar sem preço | Erro "Informe o preço do serviço" | |
| 13.4 | Tentar cadastrar sem duração | Erro "Informe a duração em minutos" | |
| 13.5 | Cadastrar serviço com todos os campos | Aparece na tabela abaixo com nome, preço e duração | |
| 13.6 | Cadastrar serviço com nome duplicado | Erro "Já existe um serviço com este nome" | |
| 13.7 | Clicar em "Excluir" na tabela | Serviço removido da tabela | |
| 13.8 | Não existem botões de exportar/importar | Confirmado que foram removidos | |

---

## 💾 14. Persistência de Dados

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 14.1 | Cadastrar serviços e recarregar (F5) | Serviços continuam cadastrados | |
| 14.2 | Criar agendamento e recarregar | Agendamento continua na tabela do barbeiro | |
| 14.3 | Concluir agendamento e recarregar | Status "Concluído" persiste após F5 | |
| 14.4 | Abrir o sistema em outra aba | Dados compartilhados (mesmo localStorage) | |

---

## ♿ 15. Acessibilidade e Usabilidade

| # | Teste | Resultado esperado | ✓/✗ |
|---|-------|--------------------|-----|
| 15.1 | Navegar pelo formulário com Tab | Foco visível em todos os campos e botões | |
| 15.2 | Selecionar serviço com Enter/Espaço | Card de serviço selecionado via teclado | |
| 15.3 | Campo com erro: corrigir e reenviar | Borda vermelha e mensagem de erro desaparecem | |
| 15.4 | Reduzir janela para 375px | Layout responsivo, sem quebras | |
| 15.5 | Abrir modal de Política de Privacidade | Modal abre corretamente | |
| 15.6 | Fechar modal clicando fora | Modal fecha | |
| 15.7 | Fechar modal com tecla Escape | Modal fecha | |
| 15.8 | Toast aparece e desaparece | Cerca de 3,5 segundos com animação de entrada e saída | |

---

## 🌐 16. Compatibilidade de Navegadores

| Navegador       | Versão Mínima | Testado | ✓/✗ |
|-----------------|---------------|---------|-----|
| Google Chrome   | 90+           |         |     |
| Mozilla Firefox | 88+           |         |     |
| Microsoft Edge  | 90+           |         |     |
| Safari          | 14+           |         |     |

---

## 📝 Anotações de Bugs Encontrados

```
Data:
Navegador/Versão:
Descrição:
Passos para reproduzir:
Comportamento esperado:
Comportamento observado:
```

---

*Checklist criado para o projeto Navalha — Barbearia | Versão 2.0*
