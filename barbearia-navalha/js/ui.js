/**
 * ui.js — Módulo de interface do usuário
 * Toasts no canto superior direito, ícones corrigidos,
 * renderização de serviços visuais, horários clicáveis,
 * tabela de serviços administrativa, cards de stats,
 * aba separada de Concluídos.
 *
 * CORREÇÕES v2.1:
 *  - Toast tipo "cancelamento" com ícone lixeira e cor vermelha (bug 8)
 *  - grade-horarios com min-height fixo para não encolher o card (bug 1)
 */

var UI = (function () {
  "use strict";

  // ── Horários reais de barbearia ──────────────────────────────────
  var HORARIOS = [
    { hora: "08:00", periodo: "manha" },
    { hora: "08:30", periodo: "manha" },
    { hora: "09:00", periodo: "manha" },
    { hora: "09:30", periodo: "manha" },
    { hora: "10:00", periodo: "manha" },
    { hora: "10:30", periodo: "manha" },
    { hora: "11:00", periodo: "manha" },
    { hora: "11:30", periodo: "manha" },
    { hora: "13:00", periodo: "tarde" },
    { hora: "13:30", periodo: "tarde" },
    { hora: "14:00", periodo: "tarde" },
    { hora: "14:30", periodo: "tarde" },
    { hora: "15:00", periodo: "tarde" },
    { hora: "15:30", periodo: "tarde" },
    { hora: "16:00", periodo: "tarde" },
    { hora: "16:30", periodo: "tarde" },
    { hora: "17:00", periodo: "tarde" },
    { hora: "17:30", periodo: "tarde" },
    { hora: "18:00", periodo: "tarde" },
    { hora: "18:30", periodo: "tarde" },
    { hora: "19:00", periodo: "tarde" }
  ];

  // ── Utilitários gerais ──────────────────────────────────────────

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escaparHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatarDataHora(iso) {
    if (!iso) return "—";
    var partes = iso.split("T");
    if (partes.length < 2) return iso;
    var dataParts = partes[0].split("-");
    var horaParts = partes[1].slice(0, 5);
    if (dataParts.length < 3) return iso;
    return dataParts[2] + "/" + dataParts[1] + "/" + dataParts[0] + " " + horaParts;
  }

  function formatarData(iso) {
    if (!iso) return "—";
    var partes = iso.split("T")[0].split("-");
    if (partes.length < 3) return iso;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  function formatarPreco(valor) {
    if (valor == null || valor === "") return "—";
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
  }

  // ── Toast ────────────────────────────────────────────────────────

  var container = null;

  function getContainer() {
    if (!container) container = document.getElementById("toast-container");
    return container;
  }

  /**
   * Exibe um toast posicionado abaixo do cabeçalho.
   * Tipos suportados:
   *  - "sucesso"      → ícone ✓ verde
   *  - "erro"         → ícone ✕ vermelho
   *  - "cancelamento" → ícone 🗑 vermelho (para ações de cancelar/remover)
   *  - "info"         → sem ícone (azul)
   */
  function toast(mensagem, tipo, duracao) {
    tipo    = tipo    || "info";
    duracao = duracao || 3500;

    var icones = {
      sucesso:      "✓",
      erro:         "✕",
      cancelamento: "🗑",
      info:         ""
    };

    var el = document.createElement("div");
    // "cancelamento" usa a mesma classe visual de "erro" (vermelho)
    var classeVisual = (tipo === "cancelamento") ? "erro" : tipo;
    el.className = "toast toast-" + classeVisual;
    el.setAttribute("role", "alert");
    el.innerHTML =
      '<span class="toast-icone" aria-hidden="true">' + (icones[tipo] !== undefined ? icones[tipo] : "") + "</span>" +
      '<span class="toast-texto">' + escaparHtml(mensagem) + "</span>";

    getContainer().appendChild(el);

    setTimeout(function () {
      el.classList.add("saindo");
      el.addEventListener("animationend", function () { el.remove(); }, { once: true });
    }, duracao);
  }

  // ── Erros de campo ───────────────────────────────────────────────

  function erroNoCampo(idCampo, mensagem) {
    var campo    = document.getElementById(idCampo);
    var spanErro = document.getElementById("erro-" + idCampo);

    if (!campo || !spanErro) return;

    if (mensagem) {
      campo.classList.add("invalido");
      spanErro.textContent = mensagem;
    } else {
      campo.classList.remove("invalido");
      spanErro.textContent = "";
    }
  }

  function limparErros(form) {
    if (!form) return;
    form.querySelectorAll(".invalido").forEach(function (el) {
      el.classList.remove("invalido");
    });
    form.querySelectorAll(".campo-erro").forEach(function (el) {
      el.textContent = "";
    });
  }

  // ── Renderização de Serviços (cliente — cards visuais) ───────────

  function renderServicosCliente() {
    var grade    = document.getElementById("grade-servicos");
    var avisoEl  = document.getElementById("aviso-sem-servicos");
    var totalEl  = document.getElementById("total-servicos");
    var valorEl  = document.getElementById("valor-total");
    var servicos = Storage.getServicos();

    if (!grade) return;
    grade.innerHTML = "";

    if (servicos.length === 0) {
      if (avisoEl) avisoEl.hidden = false;
      if (totalEl) totalEl.hidden = true;
      return;
    }

    if (avisoEl) avisoEl.hidden = true;

    servicos.forEach(function (s) {
      var card = document.createElement("div");
      card.className = "servico-card";
      card.setAttribute("role", "checkbox");
      card.setAttribute("aria-checked", "false");
      card.setAttribute("tabindex", "0");
      card.setAttribute("data-id", s.id);
      card.setAttribute("data-preco", s.preco || 0);

      card.innerHTML =
        '<span class="servico-card-nome">' + escaparHtml(s.nome) + "</span>" +
        '<span class="servico-card-preco">' + (s.preco ? formatarPreco(s.preco) : "—") + "</span>";

      function toggleServico() {
        var selecionado = card.classList.toggle("selecionado");
        card.setAttribute("aria-checked", selecionado ? "true" : "false");
        atualizarTotal();
      }

      card.addEventListener("click", toggleServico);
      card.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleServico(); }
      });

      grade.appendChild(card);
    });

    function atualizarTotal() {
      var selecionados = grade.querySelectorAll(".servico-card.selecionado");
      var total = 0;
      selecionados.forEach(function (c) {
        total += parseFloat(c.getAttribute("data-preco")) || 0;
      });
      if (totalEl && valorEl) {
        if (selecionados.length > 0) {
          totalEl.hidden = false;
          valorEl.textContent = formatarPreco(total);
        } else {
          totalEl.hidden = true;
        }
      }
    }
  }

  /**
   * Retorna array de { id, nome, preco } dos serviços selecionados.
   */
  function getServicosSelecionados() {
    var grade = document.getElementById("grade-servicos");
    if (!grade) return [];
    var selecionados = grade.querySelectorAll(".servico-card.selecionado");
    var result = [];
    var servicos = Storage.getServicos();
    selecionados.forEach(function (card) {
      var id = card.getAttribute("data-id");
      var s  = null;
      for (var i = 0; i < servicos.length; i++) {
        if (servicos[i].id === id) { s = servicos[i]; break; }
      }
      if (s) result.push(s);
    });
    return result;
  }

  // ── Renderização de Horários (cliente) ──────────────────────────

  function renderHorarios(dataSelecionada) {
    var grade        = document.getElementById("grade-horarios");
    var inputHora    = document.getElementById("ag-hora");
    var periodoAtivo = "todos";

    var filtroAtivo = document.querySelector(".filtro-periodo.ativo");
    if (filtroAtivo) periodoAtivo = filtroAtivo.getAttribute("data-periodo");

    if (!grade) return;
    grade.innerHTML = "";
    if (inputHora) inputHora.value = "";

    // Agendamentos existentes na data
    var ocupados = {};
    if (dataSelecionada) {
      var agendamentos = Storage.getAgendamentos();
      agendamentos.forEach(function (a) {
        if (a.dataHora && a.dataHora.startsWith(dataSelecionada)) {
          var hora = a.dataHora.slice(11, 16);
          ocupados[hora] = true;
        }
      });
    }

    HORARIOS.forEach(function (h) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "horario-btn";
      btn.textContent = h.hora;
      btn.setAttribute("data-hora", h.hora);
      btn.setAttribute("data-periodo", h.periodo);
      btn.setAttribute("aria-label", h.hora + (h.periodo === "manha" ? " — manhã" : " — tarde"));

      if (ocupados[h.hora]) {
        btn.disabled = true;
        btn.title = "Horário ocupado";
      }

      if (periodoAtivo !== "todos" && h.periodo !== periodoAtivo) {
        btn.setAttribute("hidden", "");
      }

      btn.addEventListener("click", function () {
        grade.querySelectorAll(".horario-btn.selecionado").forEach(function (b) {
          b.classList.remove("selecionado");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("selecionado");
        btn.setAttribute("aria-pressed", "true");
        if (inputHora) {
          inputHora.value = h.hora;
          inputHora.dispatchEvent(new Event("change"));
          var erroHora = document.getElementById("erro-ag-hora");
          if (erroHora) erroHora.textContent = "";
        }
      });

      grade.appendChild(btn);
    });
  }

  function inicializarFiltrosPeriodo() {
    var btns = document.querySelectorAll(".filtro-periodo");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("ativo"); });
        btn.classList.add("ativo");
        var periodo = btn.getAttribute("data-periodo");
        var horarioBtns = document.querySelectorAll(".horario-btn");
        horarioBtns.forEach(function (hb) {
          if (periodo === "todos" || hb.getAttribute("data-periodo") === periodo) {
            hb.removeAttribute("hidden");
          } else {
            hb.setAttribute("hidden", "");
          }
        });
      });
    });
  }

  // ── Renderização de Serviços (barbeiro — tabela) ─────────────────

  function renderServicosAdmin(onExcluir) {
    var tbody      = document.getElementById("tbody-servicos");
    var textoVazio = document.getElementById("texto-sem-servicos");
    var servicos   = Storage.getServicos();

    if (!tbody) return;
    tbody.innerHTML = "";

    if (servicos.length === 0) {
      if (textoVazio) textoVazio.style.display = "block";
      return;
    }

    if (textoVazio) textoVazio.style.display = "none";

    servicos.forEach(function (s) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><strong>" + escaparHtml(s.nome) + "</strong></td>" +
        "<td>" + escaparHtml(formatarPreco(s.preco)) + "</td>" +
        "<td>" + escaparHtml(s.duracao ? s.duracao + " min" : "—") + "</td>" +
        "<td></td>";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Excluir";
      btn.className = "btn-icone-perigo";
      btn.setAttribute("aria-label", "Excluir serviço " + s.nome);
      btn.addEventListener("click", function () {
        if (typeof onExcluir === "function") onExcluir(s.id);
      });

      tr.lastElementChild.appendChild(btn);
      tbody.appendChild(tr);
    });
  }

  // ── Renderização de Agendamentos PENDENTES (barbeiro) ────────────

  function renderAgendamentos(onCancelar, onConcluir, filtroData) {
    var tbody    = document.getElementById("tbody-agendamentos");
    var resumoEl = document.getElementById("resumo-barbeiro");
    if (!tbody) return;

    var todos = Storage.getAgendamentos();

    // Apenas pendentes
    var lista = todos.filter(function (a) { return !a.concluido; });

    if (filtroData) {
      lista = lista.filter(function (a) { return a.dataHora.startsWith(filtroData); });
    }

    lista = lista.slice().sort(function (a, b) {
      return a.dataHora > b.dataHora ? 1 : -1;
    });

    tbody.innerHTML = "";

    if (lista.length === 0) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="6" class="texto-vazio" style="text-align:center;padding:1.5rem">Nenhum agendamento pendente.</td>';
      tbody.appendChild(tr);
    } else {
      lista.forEach(function (a) {
        var tr = document.createElement("tr");

        tr.innerHTML =
          "<td>" + escaparHtml(formatarDataHora(a.dataHora))  + "</td>" +
          "<td>" + escaparHtml(a.nomeCliente)                 + "</td>" +
          "<td>" + escaparHtml(a.whatsapp)                    + "</td>" +
          "<td>" + escaparHtml(a.nomeServico || "—")          + "</td>" +
          "<td>" + escaparHtml(formatarPreco(a.precoServico)) + "</td>" +
          "<td></td>";

        var acoes = document.createElement("div");
        acoes.className = "acoes-linha";

        // Botão Concluir
        var btnConcluir = document.createElement("button");
        btnConcluir.type = "button";
        btnConcluir.textContent = "Concluir";
        btnConcluir.className = "btn-icone-sucesso";
        btnConcluir.setAttribute("aria-label", "Concluir agendamento de " + a.nomeCliente);
        (function(id) {
          btnConcluir.addEventListener("click", function () {
            if (typeof onConcluir === "function") onConcluir(id);
          });
        })(a.id);
        acoes.appendChild(btnConcluir);

        // Botão Cancelar
        var btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.className = "btn-icone-perigo";
        btnCancelar.setAttribute("aria-label", "Cancelar agendamento de " + a.nomeCliente);
        (function(id) {
          btnCancelar.addEventListener("click", function () {
            if (typeof onCancelar === "function") onCancelar(id);
          });
        })(a.id);
        acoes.appendChild(btnCancelar);

        tr.lastElementChild.appendChild(acoes);
        tbody.appendChild(tr);
      });
    }

    // Resumo financeiro — apenas pendentes
    if (resumoEl) {
      var total = lista.reduce(function (acc, a) {
        return acc + (parseFloat(a.precoServico) || 0);
      }, 0);
      resumoEl.innerHTML =
        '<span class="resumo-item"><strong>' + lista.length + "</strong> agendamento(s) pendente(s)</span>" +
        '<span class="resumo-item">Total estimado: <strong>' + formatarPreco(total) + "</strong></span>";
    }
  }

  // ── Renderização de Agendamentos CONCLUÍDOS (barbeiro) ───────────

  function renderAgendamentosConcluidos(onExcluir) {
    var tbody    = document.getElementById("tbody-concluidos");
    var resumoEl = document.getElementById("resumo-concluidos");
    if (!tbody) return;

    var todos = Storage.getAgendamentos();
    var lista = todos.filter(function (a) { return a.concluido; });

    lista = lista.slice().sort(function (a, b) {
      return a.dataHora > b.dataHora ? 1 : -1;
    });

    tbody.innerHTML = "";

    if (lista.length === 0) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="6" class="texto-vazio" style="text-align:center;padding:1.5rem">Nenhum agendamento concluído.</td>';
      tbody.appendChild(tr);
    } else {
      lista.forEach(function (a) {
        var tr = document.createElement("tr");

        tr.innerHTML =
          "<td>" + escaparHtml(formatarDataHora(a.dataHora))  + "</td>" +
          "<td>" + escaparHtml(a.nomeCliente)                 + "</td>" +
          "<td>" + escaparHtml(a.whatsapp)                    + "</td>" +
          "<td>" + escaparHtml(a.nomeServico || "—")          + "</td>" +
          "<td>" + escaparHtml(formatarPreco(a.precoServico)) + "</td>" +
          "<td></td>";

        var acoes = document.createElement("div");
        acoes.className = "acoes-linha";

        // Apenas botão Excluir
        var btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.textContent = "Excluir";
        btnExcluir.className = "btn-icone-perigo";
        btnExcluir.setAttribute("aria-label", "Excluir registro de " + a.nomeCliente);
        (function(id) {
          btnExcluir.addEventListener("click", function () {
            if (typeof onExcluir === "function") onExcluir(id);
          });
        })(a.id);
        acoes.appendChild(btnExcluir);

        tr.lastElementChild.appendChild(acoes);
        tbody.appendChild(tr);
      });
    }

    // Resumo de concluídos
    if (resumoEl) {
      var total = lista.reduce(function (acc, a) {
        return acc + (parseFloat(a.precoServico) || 0);
      }, 0);
      resumoEl.innerHTML =
        '<span class="resumo-item"><strong>' + lista.length + "</strong> concluído(s)</span>" +
        '<span class="resumo-item">Total faturado: <strong>' + formatarPreco(total) + "</strong></span>";
    }
  }

  // ── Cards de estatísticas (barbeiro) ────────────────────────────

  function atualizarStats() {
    var agendamentos = Storage.getAgendamentos();
    var servicos     = Storage.getServicos();

    var concluidos  = agendamentos.filter(function (a) { return a.concluido; });
    var marcados    = agendamentos.filter(function (a) { return !a.concluido; });
    var faturamento = concluidos.reduce(function (acc, a) {
      return acc + (parseFloat(a.precoServico) || 0);
    }, 0);

    var elFat = document.getElementById("stat-faturamento");
    var elMar = document.getElementById("stat-marcados");
    var elCon = document.getElementById("stat-concluidos");
    var elSrv = document.getElementById("stat-servicos");

    if (elFat) elFat.textContent = formatarPreco(faturamento);
    if (elMar) elMar.textContent = marcados.length;
    if (elCon) elCon.textContent = concluidos.length;
    if (elSrv) elSrv.textContent = servicos.length;
  }

  // ── Meus Agendamentos (cliente) ──────────────────────────────────

  // Bug 4: parâmetro renomeado para usuarioId — filtro confiável independente do nome digitado
  function renderMeusAgendamentos(usuarioId, onCancelar) {
    var lista = document.getElementById("lista-meus-ag");
    if (!lista) return;

    var todos = Storage.getAgendamentos();
    // Filtra por usuarioId (salvo no agendamento) com fallback para nomeCliente (dados antigos)
    var meus = todos.filter(function (a) {
      if (a.usuarioId) return a.usuarioId === usuarioId;
      return false;
    });

    lista.innerHTML = "";

    if (meus.length === 0) {
      lista.innerHTML = '<p class="texto-vazio">Nenhum agendamento encontrado.</p>';
      return;
    }

    meus = meus.slice().sort(function (a, b) {
      return a.dataHora > b.dataHora ? 1 : -1;
    });

    meus.forEach(function (a) {
      var div = document.createElement("div");
      div.className = "ag-item";

      var partes  = (a.dataHora || "").split("T");
      var dataFmt = partes[0] ? partes[0].split("-").reverse().join("/") : "—";
      var horaFmt = partes[1] ? partes[1].slice(0, 5) : "—";

      // Bug 4: exibe apenas data, hora e serviço(s)
      div.innerHTML =
        '<div class="ag-item-info">' +
          '<span class="ag-item-servico">' + escaparHtml(a.nomeServico || "—") + "</span>" +
          '<span class="ag-item-detalhe">' +
            "📅 " + escaparHtml(dataFmt) + " &nbsp;⏰ " + escaparHtml(horaFmt) +
          "</span>" +
        "</div>";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Cancelar";
      btn.className = "btn-icone-perigo";
      btn.setAttribute("aria-label", "Cancelar agendamento de " + (a.nomeServico || "serviço"));
      (function(id) {
        btn.addEventListener("click", function () {
          if (typeof onCancelar === "function") onCancelar(id);
        });
      })(a.id);

      div.appendChild(btn);
      lista.appendChild(div);
    });
  }

  // ── Modal ────────────────────────────────────────────────────────

  function abrirModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("modal-aberto");
    modal.removeAttribute("hidden");
    var focavel = modal.querySelector("button, [href], input");
    if (focavel) focavel.focus();
  }

  function fecharModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("modal-aberto");
  }

  // ── Exibir/ocultar painéis ───────────────────────────────────────

  function mostrarPainel(papel) {
    var painelCliente  = document.getElementById("painel-cliente");
    var painelBarbeiro = document.getElementById("painel-barbeiro");
    var app            = document.getElementById("app");
    var telaLogin      = document.getElementById("tela-login");

    if (telaLogin) telaLogin.hidden = true;
    if (app)       app.hidden = false;

    if (papel === "cliente") {
      if (painelCliente)  { painelCliente.classList.add("visivel");     painelCliente.hidden = false; }
      if (painelBarbeiro) { painelBarbeiro.classList.remove("visivel"); painelBarbeiro.hidden = true; }
    } else {
      if (painelBarbeiro) { painelBarbeiro.classList.add("visivel");   painelBarbeiro.hidden = false; }
      if (painelCliente)  { painelCliente.classList.remove("visivel"); painelCliente.hidden = true; }
    }
  }

  function mostrarLogin() {
    var app       = document.getElementById("app");
    var telaLogin = document.getElementById("tela-login");
    if (app)       app.hidden = true;
    if (telaLogin) telaLogin.hidden = false;
  }

  // API pública
  return {
    uid:                          uid,
    escaparHtml:                  escaparHtml,
    formatarDataHora:             formatarDataHora,
    formatarData:                 formatarData,
    formatarPreco:                formatarPreco,
    toast:                        toast,
    erroNoCampo:                  erroNoCampo,
    limparErros:                  limparErros,
    renderServicosCliente:        renderServicosCliente,
    renderServicosAdmin:          renderServicosAdmin,
    getServicosSelecionados:      getServicosSelecionados,
    renderHorarios:               renderHorarios,
    inicializarFiltrosPeriodo:    inicializarFiltrosPeriodo,
    renderAgendamentos:           renderAgendamentos,
    renderAgendamentosConcluidos: renderAgendamentosConcluidos,
    renderMeusAgendamentos:       renderMeusAgendamentos,
    atualizarStats:               atualizarStats,
    abrirModal:                   abrirModal,
    fecharModal:                  fecharModal,
    mostrarPainel:                mostrarPainel,
    mostrarLogin:                 mostrarLogin,
    HORARIOS:                     HORARIOS
  };
})();
