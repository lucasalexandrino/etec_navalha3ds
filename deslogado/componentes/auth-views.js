/**
 * Telas de login e cadastro: um arquivo com CSS, HTML e JavaScript separados por seção.
 * Os estilos são injetados em <style> (nada de CSS inline nos elementos).
 */
(function (w) {
  "use strict";

  // ==========================================================================
  // CSS — login e cadastro (escopo #auth-montagem; usa variáveis de :root em estilos.css)
  // ==========================================================================
  var CSS_AUTH_VIEWS = `
#auth-montagem .card,
#auth-montagem article.login-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.35rem 1.5rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  margin: 0;
}

#auth-montagem .login-card {
  width: 100%;
  max-width: 420px;
}

#auth-montagem .login-card header {
  margin: 0 0 0.35rem;
}

#auth-montagem .login-card h2 {
  margin: 0;
  font-size: 1.25rem;
}

#auth-montagem .login-mock-hint p {
  margin: 0;
}

#auth-montagem .auth-alternar p {
  margin: 0;
}

#auth-montagem .auth-fieldset-dados {
  margin: 0;
  padding: 0;
  border: none;
}

#auth-montagem .auth-fieldset-dados legend {
  padding: 0;
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

#auth-montagem .login-ajuda {
  margin: 0 0 0.65rem;
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.45;
}

#auth-montagem .login-mock-hint {
  margin: 0 0 1rem;
  padding: 0.55rem 0.65rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--muted);
  background: rgba(201, 162, 39, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(201, 162, 39, 0.25);
}

#auth-montagem .login-mock-hint code {
  font-size: 0.85em;
  color: var(--accent);
}

#auth-montagem .form-login .msg-erro,
#auth-montagem .form-cadastro .msg-erro {
  min-height: 1.15rem;
  font-size: 0.8rem;
  color: var(--danger);
  margin-top: 0.2rem;
}

#auth-montagem .login-msg-info {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  color: var(--accent);
  min-height: 0;
}

#auth-montagem .auth-alternar,
#auth-montagem footer.auth-alternar {
  margin: 1rem 0 0;
  padding: 0;
  text-align: center;
  font-size: 0.88rem;
  color: var(--muted);
  border: none;
  background: transparent;
}

#auth-montagem .link-like {
  display: inline;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

#auth-montagem .link-like:hover {
  color: var(--accent-hover);
}

#auth-montagem .cad-papel-field {
  margin: 0;
  padding: 0.75rem 0 0;
  border: none;
  border-top: 1px solid var(--border);
}

#auth-montagem .cad-papel-legend {
  padding: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

#auth-montagem .cad-papel-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

#auth-montagem .cad-papel-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

#auth-montagem .cad-papel-label input {
  accent-color: var(--accent);
}

#auth-montagem .msg-erro-bloco {
  min-height: 0;
  margin: 0;
  font-size: 0.88rem;
  color: var(--danger);
}

#auth-montagem .form input.campo-erro {
  border-color: var(--danger);
}

#auth-montagem .form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

#auth-montagem .form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

#auth-montagem .form input {
  padding: 0.6rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font: inherit;
}

#auth-montagem .form input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

#auth-montagem .btn-prim {
  margin-top: 0.25rem;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #1a1a12;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

#auth-montagem .btn-prim:hover {
  background: var(--accent-hover);
}
`.trim();

  var ID_ESTILO_AUTH = "estilos-auth-views";

  function garantirEstilosInjetados() {
    if (document.getElementById(ID_ESTILO_AUTH)) return;
    var el = document.createElement("style");
    el.id = ID_ESTILO_AUTH;
    el.textContent = CSS_AUTH_VIEWS;
    document.head.appendChild(el);
  }

  // ==========================================================================
  // HTML — Login (semântico: article, header, aside, form, footer)
  // ==========================================================================
  var HTML_LOGIN =
    "<header>" +
    '<h2 id="login-titulo">Entrar</h2>' +
    "</header>" +
    '<p class="login-ajuda">' +
    "Informe o e-mail e a senha cadastrados. Você será direcionado ao painel de cliente ou de barbeiro conforme o cadastro." +
    "</p>" +
    '<aside class="login-mock-hint" aria-label="Contas de demonstração">' +
    "<p>" +
    "<strong>Mock:</strong> <code>cliente@email</code> ou <code>barbeiro@email</code> — senha <code>1234</code>" +
    "</p>" +
    "</aside>" +
    '<p id="login-msg-info" class="login-msg-info" role="status" aria-live="polite"></p>' +
    '<form id="form-login" class="form form-login" novalidate aria-labelledby="login-titulo">' +
    '<fieldset class="auth-fieldset-dados">' +
    "<legend>Dados de acesso</legend>" +
    "<label>" +
    "E-mail" +
    '<input type="email" id="login-email" name="email" autocomplete="username" inputmode="email" required />' +
    '<span id="erro-email" class="msg-erro" role="alert"></span>' +
    "</label>" +
    "<label>" +
    "Senha" +
    '<input type="password" id="login-senha" name="senha" autocomplete="current-password" required />' +
    '<span id="erro-senha" class="msg-erro" role="alert"></span>' +
    "</label>" +
    "</fieldset>" +
    '<p id="login-erro-geral" class="msg-erro msg-erro-bloco" role="alert"></p>' +
    '<button type="submit" class="btn-prim">Entrar</button>' +
    "</form>" +
    '<footer class="auth-alternar">' +
    "<p>" +
    "Não tem conta? " +
    '<button type="button" class="link-like" id="link-cadastro">Cadastre-se</button>' +
    "</p>" +
    "</footer>";

  // ==========================================================================
  // HTML — Cadastro (semântico: article, header, fieldsets, footer)
  // ==========================================================================
  var HTML_CADASTRO =
    "<header>" +
    '<h2 id="cadastro-titulo">Criar conta</h2>' +
    "</header>" +
    '<p class="login-ajuda">' +
    "Escolha <strong>cliente</strong> para agendar ou <strong>barbeiro</strong> para gerenciar serviços e agendamentos." +
    "</p>" +
    '<form id="form-cadastro" class="form form-cadastro" novalidate aria-labelledby="cadastro-titulo">' +
    '<fieldset class="auth-fieldset-dados">' +
    "<legend>Seus dados</legend>" +
    "<label>" +
    "E-mail" +
    '<input type="email" id="cad-email" name="email" autocomplete="email" inputmode="email" required />' +
    '<span id="erro-cad-email" class="msg-erro" role="alert"></span>' +
    "</label>" +
    "<label>" +
    "Senha" +
    '<input type="password" id="cad-senha" name="senha" autocomplete="new-password" required minlength="8" />' +
    '<span id="erro-cad-senha" class="msg-erro" role="alert"></span>' +
    "</label>" +
    "<label>" +
    "Confirmar senha" +
    '<input type="password" id="cad-senha2" name="senha2" autocomplete="new-password" required minlength="8" />' +
    '<span id="erro-cad-senha2" class="msg-erro" role="alert"></span>' +
    "</label>" +
    "</fieldset>" +
    '<fieldset class="cad-papel-field">' +
    '<legend class="cad-papel-legend">Tipo de conta</legend>' +
    '<div class="cad-papel-opcoes">' +
    '<label class="cad-papel-label">' +
    '<input type="radio" name="cad-papel" value="cliente" checked />' +
    " Cliente" +
    "</label>" +
    '<label class="cad-papel-label">' +
    '<input type="radio" name="cad-papel" value="barbeiro" />' +
    " Barbeiro" +
    "</label>" +
    "</div>" +
    '<span id="erro-cad-papel" class="msg-erro" role="alert"></span>' +
    "</fieldset>" +
    '<p id="cad-erro-geral" class="msg-erro msg-erro-bloco" role="alert"></p>' +
    '<button type="submit" class="btn-prim">Cadastrar</button>' +
    "</form>" +
    '<footer class="auth-alternar">' +
    "<p>" +
    '<button type="button" class="link-like" id="link-login">Já tenho conta — entrar</button>' +
    "</p>" +
    "</footer>";

  // ==========================================================================
  // JavaScript — montagem e API usada por app.js
  // ==========================================================================
  garantirEstilosInjetados();

  w.ComponenteLogin = {
    criar: function () {
      var root = document.createElement("article");
      root.className = "login-card card auth-view";
      root.setAttribute("data-componente", "login");
      root.setAttribute("aria-labelledby", "login-titulo");
      root.innerHTML = HTML_LOGIN;
      return root;
    },
  };

  w.ComponenteCadastro = {
    criar: function () {
      var root = document.createElement("article");
      root.className = "login-card card auth-view";
      root.setAttribute("data-componente", "cadastro");
      root.setAttribute("aria-labelledby", "cadastro-titulo");
      root.innerHTML = HTML_CADASTRO;
      return root;
    },
  };
})(window);
