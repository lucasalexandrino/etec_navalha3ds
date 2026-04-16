# Barbearia Navalha - Sistema de Agendamento

Sistema web para agendamento de serviços em barbearia, desenvolvido com HTML, CSS e JavaScript puro. Utiliza localStorage para persistência de dados.

## Como Abrir

1. Clone ou baixe o repositório.
2. Abra o arquivo `index.html` em um navegador web moderno (Chrome, Firefox, etc.).
3. Alternativamente, execute um servidor local:
   ```bash
   python -m http.server 8000
   ```
   E acesse `http://localhost:8000`.

## Estrutura de Pastas

```
/
├── index.html          # Página principal
├── css/
│   └── estilos.css     # Estilos da aplicação
├── js/
│   └── app.js          # Lógica da aplicação
├── logo.png            # Logomarca
├── Contexto.md         # Documentação do projeto
├── TESTES.md           # Checklist de testes
└── Relatório 01.txt    # Relatório de desenvolvimento
```

## Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Layout responsivo com variáveis CSS
- **JavaScript ES5+**: Lógica de negócio, validações, manipulação DOM
- **localStorage**: Persistência de dados (simulada)

## Funcionalidades

### Cliente
- Visualizar serviços disponíveis
- Agendar horários com validações
- Visualizar meus agendamentos
- Cancelar agendamentos

### Barbeiro
- Cadastrar/editar/excluir serviços
- Visualizar todos os agendamentos
- Visualizar agendamentos do dia
- Gerenciar status dos agendamentos (concluir/cancelar)

## Autenticação

Simulada para fins educacionais:
- **Cliente**: cliente@email.com / 123456
- **Barbeiros**:
  - joao@navalha.com / 123456 (João Silva - Cortes clássicos)
  - pedro@navalha.com / 123456 (Pedro Santos - Barba e navalha)
  - lucas@navalha.com / 123456 (Lucas Oliveira - Degradê e styling)

**Atenção**: Em produção, use autenticação server-side. Este sistema armazena senhas em texto plano apenas para aprendizado.

## Requisitos do Sistema

- Navegador com suporte a ES5+
- localStorage habilitado
- Recomendado: Chrome 80+ ou Firefox 75+

## Desenvolvimento

O código segue boas práticas:
- Separação de responsabilidades (HTML/CSS/JS)
- Nomes consistentes em português
- Comentários em trechos complexos
- Responsividade mobile-first

## Limitações

- Dados armazenados localmente (perdem ao limpar navegador)
- Autenticação simulada (não segura)
- Sem integração com backend real
- Funciona apenas no mesmo dispositivo/navegador