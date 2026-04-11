const intervaloLimpezaMinutos = 10;

export const scheduler = {
  intervaloLimpezaMinutos,
  horarioAbertura: { h: 9, m: 0 },
  /** Seg–sex, último início respeitando duração + limpeza (especificação: até 18h). */
  horarioFechamento: { h: 18, m: 0 },
  passoSlotsMinutos: 10,
  antecedenciaAgendamentoMinutos: 60,

  criarDataLocalPorDiaHora(dataYmd, horaHm) {
    const [y, mo, d] = dataYmd.split("-").map((x) => Number(x));
    const [h, m] = horaHm.split(":").map((x) => Number(x));
    return new Date(y, mo - 1, d, h, m, 0, 0);
  },

  formatarHora(date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  },

  somarMinutos(date, minutos) {
    return new Date(date.getTime() + minutos * 60_000);
  },

  inicioDoDiaLocal(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  },

  estaNoMesmoDiaLocal(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  },

  obterFimComLimpeza(inicio, duracaoMinutos) {
    return this.somarMinutos(inicio, duracaoMinutos + intervaloLimpezaMinutos);
  },

  verificarConflito({ novoInicio, novoFimSemLimpeza, agendamentosExistentes }) {
    const novoFimComLimpeza = this.somarMinutos(novoFimSemLimpeza, intervaloLimpezaMinutos);

    for (const ag of agendamentosExistentes) {
      if (ag.statusPagamento === "Cancelado") continue;

      const existenteInicio = new Date(ag.inicioIso);
      const existenteFimSemLimpeza = new Date(ag.fimIso);
      const existenteFimComLimpeza = this.somarMinutos(existenteFimSemLimpeza, intervaloLimpezaMinutos);

      const conflita = novoInicio < existenteFimComLimpeza && novoFimComLimpeza > existenteInicio;
      if (conflita) return true;
    }
    return false;
  },

  gerarSlotsDia({ dataYmd, duracaoMinutos, agora = new Date() }) {
    const abertura = new Date(
      Number(dataYmd.slice(0, 4)),
      Number(dataYmd.slice(5, 7)) - 1,
      Number(dataYmd.slice(8, 10)),
      this.horarioAbertura.h,
      this.horarioAbertura.m,
      0,
      0
    );
    const fechamento = new Date(
      Number(dataYmd.slice(0, 4)),
      Number(dataYmd.slice(5, 7)) - 1,
      Number(dataYmd.slice(8, 10)),
      this.horarioFechamento.h,
      this.horarioFechamento.m,
      0,
      0
    );

    const ultimoInicioPermitido = this.somarMinutos(
      fechamento,
      -(duracaoMinutos + intervaloLimpezaMinutos)
    );

    const slots = [];
    for (
      let cursor = new Date(abertura);
      cursor <= ultimoInicioPermitido;
      cursor = this.somarMinutos(cursor, this.passoSlotsMinutos)
    ) {
      const fimSemLimpeza = this.somarMinutos(cursor, duracaoMinutos);
      const noPassado = this.estaNoMesmoDiaLocal(cursor, agora) ? cursor <= agora : cursor < agora;
      slots.push({
        inicio: new Date(cursor),
        fimSemLimpeza,
        noPassado,
      });
    }
    return slots;
  },

  normalizarMetodoPagamento(metodo) {
    if (metodo === "CartaoCredito" || metodo === "CartaoDebito") return "Cartao";
    return metodo;
  },

  /** Domingo=0 … Sábado=6 — agenda apenas em dias úteis (seg–sex). */
  ehDiaUtil(dataYmd) {
    const [y, mo, d] = dataYmd.split("-").map((x) => Number(x));
    const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
    const dow = dt.getDay();
    return dow >= 1 && dow <= 5;
  },

  antecedenciaRespeitada({ inicio, agora = new Date(), minutos = this.antecedenciaAgendamentoMinutos }) {
    const diffMin = (inicio.getTime() - agora.getTime()) / 60_000;
    return diffMin >= minutos;
  },

  formatarMoedaBR(centavos) {
    const valor = (centavos || 0) / 100;
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },
};

