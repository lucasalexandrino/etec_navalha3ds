(function () {
  "use strict";

  var na = window.NavalhaArmazenamento;
  var CompLogin = window.ComponenteLogin;
  var CompCadastro = window.ComponenteCadastro;
  if (!na || !CompLogin || !CompCadastro) return;

  na.garantirUsuariosIniciais();

  var uCliente = na.getSessaoValidaCliente();
  if (uCliente) {
    window.location.replace("../cliente/index.html");
    return;
  }
  var uBarbeiro = na.getSessaoValidaBarbeiro();
  if (uBarbeiro) {
    window.location.replace("../barbeiro/index.html");
    return;
  }

  var authMontagem = document.getElementById("auth-montagem");

  function emailValido(str) {
    if (!str || typeof str !== "string") return false;
    var t = str.trim();
    return /^[^\s@]+@[^\s@]+(\.[^\s@]+)*$/.test(t);
  }

  function senhaAtendeRegras(senha) {
    if (!senha || senha.length < 8) return false;
    return /[A-Za-z]/.test(senha) && /\d/.test(senha);
  }

  function redirecionarAposLogin(papel, email) {
    na.setSessao(papel, email);
    if (papel === "cliente") {
      window.location.href = "../cliente/index.html";
    } else {
      window.location.href = "../barbeiro/index.html";
    }
  }

  function limparErrosLogin() {
    var erroEmail = document.getElementById("erro-email");
    var erroSenha = document.getElementById("erro-senha");
    var loginErroGeral = document.getElementById("login-erro-geral");
    var loginEmail = document.getElementById("login-email");
    var loginSenha = document.getElementById("login-senha");
    if (erroEmail) erroEmail.textContent = "";
    if (erroSenha) erroSenha.textContent = "";
    if (loginErroGeral) loginErroGeral.textContent = "";
    if (loginEmail) loginEmail.classList.remove("campo-erro");
    if (loginSenha) loginSenha.classList.remove("campo-erro");
  }

  function limparErrosCadastro() {
    var ids = [
      "erro-cad-email",
      "erro-cad-senha",
      "erro-cad-senha2",
      "erro-cad-papel",
      "cad-erro-geral",
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    ["cad-email", "cad-senha", "cad-senha2"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("campo-erro");
    });
  }

  function ligarLogin() {
    var formLogin = document.getElementById("form-login");
    var loginEmail = document.getElementById("login-email");
    var loginSenha = document.getElementById("login-senha");
    var erroEmail = document.getElementById("erro-email");
    var erroSenha = document.getElementById("erro-senha");
    var loginErroGeral = document.getElementById("login-erro-geral");
    var loginMsgInfo = document.getElementById("login-msg-info");
    var linkCadastro = document.getElementById("link-cadastro");

    if (!formLogin) return;

    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      limparErrosLogin();

      var email = loginEmail.value.trim();
      var senha = loginSenha.value;
      var okEmail = true;
      var okSenha = true;

      if (!email) {
        erroEmail.textContent = "Informe o e-mail.";
        loginEmail.classList.add("campo-erro");
        okEmail = false;
      } else if (!emailValido(email)) {
        erroEmail.textContent = "Informe um e-mail válido.";
        loginEmail.classList.add("campo-erro");
        okEmail = false;
      }

      if (!senha) {
        erroSenha.textContent = "Informe a senha.";
        loginSenha.classList.add("campo-erro");
        okSenha = false;
      }

      if (!okEmail || !okSenha) return;

      var emailNorm = email.toLowerCase();
      var u = na.encontrarUsuarioPorEmail(emailNorm);

      if (!u) {
        loginErroGeral.textContent =
          "Este e-mail não está cadastrado. Crie uma conta ou verifique o endereço.";
        return;
      }

      if (u.senha !== senha) {
        loginErroGeral.textContent = "Senha incorreta.";
        return;
      }

      var papel = u.papel;
      if (papel !== "cliente" && papel !== "barbeiro") {
        loginErroGeral.textContent = "Conta sem perfil válido.";
        return;
      }

      loginMsgInfo.textContent = "";
      redirecionarAposLogin(papel, u.email);
    });

    if (linkCadastro) {
      linkCadastro.addEventListener("click", function () {
        limparErrosLogin();
        var leg = document.getElementById("login-erro-geral");
        var msg = document.getElementById("login-msg-info");
        if (leg) leg.textContent = "";
        if (msg) msg.textContent = "";
        montarCadastro();
      });
    }
  }

  function ligarCadastro() {
    var formCadastro = document.getElementById("form-cadastro");
    var cadEmail = document.getElementById("cad-email");
    var cadSenha = document.getElementById("cad-senha");
    var cadSenha2 = document.getElementById("cad-senha2");
    var erroCadEmail = document.getElementById("erro-cad-email");
    var erroCadSenha = document.getElementById("erro-cad-senha");
    var erroCadSenha2 = document.getElementById("erro-cad-senha2");
    var erroCadPapel = document.getElementById("erro-cad-papel");
    var cadErroGeral = document.getElementById("cad-erro-geral");
    var linkLogin = document.getElementById("link-login");

    if (!formCadastro) return;

    formCadastro.addEventListener("submit", function (e) {
      e.preventDefault();
      limparErrosCadastro();

      var email = cadEmail.value.trim();
      var senha = cadSenha.value;
      var senha2 = cadSenha2.value;
      var papelRadio = formCadastro.querySelector('input[name="cad-papel"]:checked');
      var papel = papelRadio ? papelRadio.value : "";
      var ok = true;

      if (!email) {
        erroCadEmail.textContent = "Informe o e-mail.";
        cadEmail.classList.add("campo-erro");
        ok = false;
      } else if (!emailValido(email)) {
        erroCadEmail.textContent = "Informe um e-mail válido.";
        cadEmail.classList.add("campo-erro");
        ok = false;
      }

      if (!senha) {
        erroCadSenha.textContent = "Informe a senha.";
        cadSenha.classList.add("campo-erro");
        ok = false;
      } else if (!senhaAtendeRegras(senha)) {
        erroCadSenha.textContent =
          "A senha deve ter no mínimo 8 caracteres, com letras e números.";
        cadSenha.classList.add("campo-erro");
        ok = false;
      }

      if (!senha2) {
        erroCadSenha2.textContent = "Confirme a senha.";
        cadSenha2.classList.add("campo-erro");
        ok = false;
      } else if (senha !== senha2) {
        erroCadSenha2.textContent = "As senhas não coincidem.";
        cadSenha2.classList.add("campo-erro");
        ok = false;
      }

      if (papel !== "cliente" && papel !== "barbeiro") {
        erroCadPapel.textContent = "Escolha cliente ou barbeiro.";
        ok = false;
      }

      if (!ok) return;

      var emailNorm = email.toLowerCase();
      if (na.encontrarUsuarioPorEmail(emailNorm)) {
        cadErroGeral.textContent = "Já existe uma conta com este e-mail.";
        return;
      }

      na.salvarNovoUsuario({
        email: emailNorm,
        senha: senha,
        papel: papel,
      });

      montarLogin();
      var loginEmail = document.getElementById("login-email");
      var loginMsgInfo = document.getElementById("login-msg-info");
      if (loginEmail) loginEmail.value = emailNorm;
      if (loginMsgInfo) {
        loginMsgInfo.textContent =
          "Cadastro concluído como " +
          (papel === "cliente" ? "cliente" : "barbeiro") +
          ". Entre com sua senha.";
      }
    });

    if (linkLogin) {
      linkLogin.addEventListener("click", function () {
        limparErrosCadastro();
        montarLogin();
      });
    }
  }

  function montarLogin() {
    authMontagem.replaceChildren(CompLogin.criar());
    ligarLogin();
  }

  function montarCadastro() {
    authMontagem.replaceChildren(CompCadastro.criar());
    ligarCadastro();
  }

  montarLogin();
})();
