const storagePrefix = "navalha_";

function lerJson(chave, fallback) {
  const bruto = localStorage.getItem(storagePrefix + chave);
  if (!bruto) return fallback;
  try {
    return JSON.parse(bruto);
  } catch {
    return fallback;
  }
}

function salvarJson(chave, valor) {
  localStorage.setItem(storagePrefix + chave, JSON.stringify(valor));
}

function gerarId(prefixo) {
  const rnd = Math.random().toString(16).slice(2);
  return `${prefixo}_${Date.now().toString(16)}_${rnd}`;
}

export const storage = {
  lerSessao() {
    return lerJson("sessao", null);
  },
  salvarSessao(sessao) {
    salvarJson("sessao", sessao);
  },
  limparSessao() {
    localStorage.removeItem(storagePrefix + "sessao");
  },

  lerUsuarios() {
    return lerJson("usuarios", []);
  },
  salvarUsuarios(listaUsuarios) {
    salvarJson("usuarios", listaUsuarios);
  },

  lerBarbeiros() {
    return lerJson("barbeiros", []);
  },
  salvarBarbeiros(listaBarbeiros) {
    salvarJson("barbeiros", listaBarbeiros);
  },

  lerServicos() {
    return lerJson("servicos", []);
  },
  salvarServicos(listaServicos) {
    salvarJson("servicos", listaServicos);
  },

  lerAgendamentos() {
    return lerJson("agendamentos", []);
  },
  salvarAgendamentos(listaAgendamentos) {
    salvarJson("agendamentos", listaAgendamentos);
  },

  gerarId,

  garantirDadosIniciais() {
    const usuarios = this.lerUsuarios();
    const barbeiros = this.lerBarbeiros();
    const servicos = this.lerServicos();

    const precisaUsuarios = usuarios.length === 0;
    const precisaBarbeiros = barbeiros.length === 0;
    const precisaServicos = servicos.length === 0;

    const garantirUsuario = (u) => {
      const idx = usuarios.findIndex((x) => String(x.email || "").toLowerCase() === u.email.toLowerCase());
      if (idx === -1) {
        usuarios.push(u);
        return;
      }
      usuarios[idx] = { ...usuarios[idx], ...u };
    };

    if (precisaUsuarios) {
      usuarios.push(
        {
          id: "usr_admin",
          nome: "Admin Navalha",
          email: "admin@navalha.com",
          whatsapp: "",
          senha: "1234",
          nivelAcesso: "Admin",
          criadoEmIso: new Date().toISOString(),
        },
        {
          id: "usr_usuario",
          nome: "Usuário",
          email: "usuario@navalha.com",
          whatsapp: "11999999999",
          senha: "1234",
          nivelAcesso: "Cliente",
          criadoEmIso: new Date().toISOString(),
        },
        {
          id: "usr_barbeiro",
          nome: "Rafa (Barbeiro)",
          email: "barbeiro@navalha.com",
          whatsapp: "11988887777",
          senha: "1234",
          nivelAcesso: "Barbeiro",
          barbeiroId: "barb_1",
          criadoEmIso: new Date().toISOString(),
        }
      );
      this.salvarUsuarios(usuarios);
    } else {
      // Migração simples: garante as duas contas padrão e senha 1234
      garantirUsuario({
        id: "usr_admin",
        nome: "Admin Navalha",
        email: "admin@navalha.com",
        whatsapp: "",
        senha: "1234",
        nivelAcesso: "Admin",
      });
      garantirUsuario({
        id: "usr_usuario",
        nome: "Usuário",
        email: "usuario@navalha.com",
        whatsapp: "11999999999",
        senha: "1234",
        nivelAcesso: "Cliente",
      });
      garantirUsuario({
        id: "usr_barbeiro",
        nome: "Rafa (Barbeiro)",
        email: "barbeiro@navalha.com",
        whatsapp: "11988887777",
        senha: "1234",
        nivelAcesso: "Barbeiro",
        barbeiroId: "barb_1",
      });
      this.salvarUsuarios(usuarios);
    }

    if (precisaBarbeiros) {
      this.salvarBarbeiros([
        { id: "barb_1", nome: "Rafa" },
        { id: "barb_2", nome: "Diego" },
        { id: "barb_3", nome: "Bia" },
      ]);
    }

    if (precisaServicos) {
      this.salvarServicos([
        { id: "srv_corte", nome: "Corte", duracaoMinutos: 30, precoCentavos: 3500 },
        { id: "srv_barba", nome: "Barba", duracaoMinutos: 20, precoCentavos: 2500 },
        { id: "srv_completo", nome: "Completo", duracaoMinutos: 50, precoCentavos: 5500 },
      ]);
    }

    if (!lerJson("agendamentos", null)) {
      this.salvarAgendamentos([]);
    }
  },
};

