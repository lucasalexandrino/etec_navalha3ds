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

### Conteúdo de demonstração
- 10 clientes demo adicionais mais o cliente principal
- 3 barbeiros demo com agendas separadas
- 6 serviços iniciais disponíveis para escolha
- Agendamentos de exemplo gerados automaticamente no primeiro carregamento
  - cada cliente recebe de 3 a 5 agendamentos
  - datas distribuídas entre hoje e 15 de julho de 2026
  - métodos de pagamento aleatórios: PIX, cartão, dinheiro e boleto
  - **Status:** horários **futuros** ficam como **Agendado**; **Concluído** só aparece em agendamentos **já passados** em que o pagamento simulado era “pago” (o barbeiro ainda marca conclusão manual nos fluxos reais de atendimento).

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

## Limitações / observações técnicas

1. **Não é produção.** Credenciais de acesso e fluxos de **pagamento são fictícios** (simulação apenas na interface). Não há cobrança real nem validação de identidade em servidor. **Qualquer pessoa** com acesso ao **código-fonte** (por exemplo, contas demo declaradas em `js/app.js`) ou ao **armazenamento do navegador** (`localStorage` e `sessionStorage`, editáveis pelas DevTools) pode **ler, alterar ou apagar** dados como se fosse outro usuário. Em ambiente real, autenticação, regras de negócio sensíveis e integração com pagamento deveriam ficar em **backend** com segredos fora do front-end.

2. **Persistência apenas local.** Serviços, agendamentos, logs simulados e demais registros são gravados com **`localStorage`** (e a sessão do login em **`sessionStorage`**), ou seja, **só naquele navegador e perfil**. Não existe servidor que centralize ou replique essas informações. Consequências práticas: **perda total** dos dados ao limpar dados do site, ao usar aba anônima sem migrar nada, ou ao trocar de máquina; **sem backup oficial** restaurável pela aplicação; **sem histórico único** se a mesma barbearia atender por mais de um computador. Um sistema real usaria banco de dados (ou serviço gerenciado), política de backup e, se necessário, exportação controlada.

3. **Autenticação simulada.** O fluxo de login apenas **compara** e-mail e senha digitados com **arrays fixos em JavaScript** (`DEMO_CLIENTES`, `BARBEIRO_CONTAS` em `js/app.js`). Não há verificação em servidor, **token assinado**, expiração de sessão robusta, **proteção contra brute force**, recuperação de senha nem armazenamento de credenciais com **hash + salt**. Qualquer um que abra o código vê as senhas demo em texto. Em produção espera-se HTTPS, armazenamento seguro de segredos, políticas de senha e, no mínimo, validação e emissão de sessão **no backend**.

4. **Sem backend.** Não há **API REST/GraphQL**, fila de mensagens, **banco relacional ou NoSQL** nem serviço de e-mail/SMS: regras de negócio (conflito de horários, cancelamento, “pagamento”) rodam **inteiras no cliente**. Isso impede **fonte única da verdade** compartilhada por todos os usuários, **integração** com ERP, gateway de pagamento real ou agenda Google, e **auditoria** confiável contra um administrador de sistema (o log em `localStorage` é facilmente apagado). Escalar para muitos barbeiros ou filiais exigiria arquitetura cliente-servidor ou BaaS.

5. **Escopo por dispositivo/navegador.** Cada combinação **usuário do SO + navegador + perfil** mantém seu **próprio** `localStorage`. O barbeiro que agenda no Chrome do salão e o cliente que olha no celular **não veem o mesmo conjunto de dados** a menos que seja o mesmo aparelho e o mesmo armazenamento. Dois barbeiros em PCs diferentes teriam **agendas “paralelas”** fictícias, não uma agenda única da empresa. Colaboração real exigiria sincronização via servidor (ou P2P com conflitos resolvidos), não só armazenamento local.