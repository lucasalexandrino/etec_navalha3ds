// ATENÇÃO: credenciais em texto puro no navegador são inseguras.
// Esta abordagem serve apenas para fins didáticos.
var USUARIOS = [
  { usuario: "cliente",  senha: "cliente123",  papel: "cliente"  },
  { usuario: "barbeiro", senha: "barbeiro123", papel: "barbeiro" },
];

function verificarSessao() {
  return sessionStorage.getItem("papel");
}

function fazerLogin(usuario, senha) {
  var user = USUARIOS.find(function(u) {
    return u.usuario === usuario && u.senha === senha;
  });
  if (user) {
    sessionStorage.setItem("papel", user.papel);
    return user.papel;
  }
  return null;
}

function fazerLogout() {
  sessionStorage.clear();
}