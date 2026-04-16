# 📋 Contexto do Projeto - Navalha Barbearia

## Sobre o Projeto
Sistema de agendamento para barbearia desenvolvido em JavaScript puro, sem frameworks, utilizando LocalStorage para persistência.

## Público-alvo
- **Clientes**: Agendam horários, veem histórico
- **Barbeiros**: Gerenciam agenda diária/semanal
- **Administradores**: Gerenciam serviços, barbeiros, relatórios

## Diferenciais
- Design moderno com glassmorphism
- Totalmente responsivo
- Funciona offline (dados locais)
- Código modular e organizado

## Regras de Negócio
1. Agendamento apenas em dias úteis (segunda a sexta)
2. Horário comercial: 9h às 18h
3. Antecedência mínima de 1 hora
4. Intervalo de 10 minutos entre atendimentos
5. Valor do serviço fixo (pode ser editado pelo admin)

## Fluxos Principais

### Cliente
Login → Escolher barbeiro → Escolher data → Escolher serviço → Ver horários → Confirmar → Ver no histórico

### Barbeiro
Login → Ver agenda da semana → Ver atendimentos do dia → Concluir/cancelar atendimentos

### Admin
Login → Dashboard com KPIs → Gerenciar serviços → Gerenciar barbeiros → Ver todos agendamentos

## Tecnologias Utilizadas
- HTML5 (semântico)
- CSS3 (Grid, Flexbox, Glassmorphism)
- JavaScript ES6+ (Modules, Arrow Functions, Promises)
- LocalStorage API
- Font Awesome Icons