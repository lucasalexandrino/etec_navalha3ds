(function () {
  "use strict";

  var A = window.Armazenamento;

  function normalizarAgendamento(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id:           String(item.id),
      nomeCliente:  String(item.clientName  || item.nomeCliente  || ""),
      whatsapp:     String(item.whatsapp    || ""),
      dataHora:     String(item.datetime    || item.dataHora     || ""),
      idServico:    String(item.serviceId   || item.idServico    || ""),
      nomeServico:  String(item.serviceName || item.nomeServico  || ""),
      precoServico: typeof item.precoServico === "number" ? item.precoServico : parseFloat(item.precoServico) || 0,
      profissional: String(item.profissional || ""),
    };
  }

  function listar() {
    var lista = A.carregar(A.CHAVES.AGENDAMENTOS, []);
    if (!Array.isArray(lista)) return [];
    return lista.map(normalizarAgendamento).filter(Boolean);
  }

  function persistir(lista) {
    A.salvar(A.CHAVES.AGENDAMENTOS, lista);
  }

  function adicionar(dados) {
    if (!dados || !dados.dataHora) return;
    var lista = listar();
    lista.push({
      id:           A.gerarId(),
      nomeCliente:  dados.nomeCliente  || "",
      whatsapp:     dados.whatsapp     || "",
      dataHora:     dados.dataHora,
      idServico:    dados.idServico    || "",
      nomeServico:  dados.nomeServico  || "",
      precoServico: typeof dados.precoServico === "number" ? dados.precoServico : 0,
      profissional: dados.profissional || "",
    });
    persistir(lista);
  }

  function remover(id) {
    persistir(listar().filter(function (a) { return a.id !== id; }));
  }

  function ordenarPorDataHora(lista) {
    return lista.slice().sort(function (a, b) {
      var ta = new Date(a.dataHora).getTime();
      var tb = new Date(b.dataHora).getTime();
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    });
  }

  function formatarDataHoraBr(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function dataHoraLocalParaIso(dataStr, horaStr) {
    if (!dataStr || !horaStr) return "";
    var d = new Date(dataStr + "T" + horaStr + ":00");
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  }

  function obterDiasComAgendamentoNoMes(ano, mes, listaAgendamentos) {
    var marcacao = {};
    listaAgendamentos.forEach(function (a) {
      var d = new Date(a.dataHora);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        marcacao[d.getDate()] = true;
      }
    });
    return marcacao;
  }

  window.Agendamentos = {
    listar:                       listar,
    adicionar:                    adicionar,
    remover:                      remover,
    ordenarPorDataHora:           ordenarPorDataHora,
    formatarDataHoraBr:           formatarDataHoraBr,
    dataHoraLocalParaIso:         dataHoraLocalParaIso,
    obterDiasComAgendamentoNoMes: obterDiasComAgendamentoNoMes,
  };
})();