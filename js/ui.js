export const ui = {
  qs(sel, root = document) {
    const el = root.querySelector(sel);
    if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
    return el;
  },
  qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  },

  setHidden(el, hidden) {
    el.hidden = Boolean(hidden);
  },

  limpar(el) {
    el.innerHTML = "";
  },

  setFieldHelp(elHelp, msg, isError = false) {
    if (!elHelp) return;
    elHelp.textContent = msg || "";
    elHelp.classList.toggle("isError", Boolean(isError));
  },

  toast({ titulo, msg, tipo = "ok", ms = 3200 }) {
    const root = document.getElementById("toasts");
    if (!root) return;

    const t = document.createElement("div");
    t.className = `toast ${tipo === "ok" ? "isOk" : tipo === "warn" ? "isWarn" : "isDanger"}`;
    t.innerHTML = `<div class="toastTitle"></div><div class="toastMsg"></div>`;
    t.querySelector(".toastTitle").textContent = titulo || "Aviso";
    t.querySelector(".toastMsg").textContent = msg || "";
    root.appendChild(t);

    window.setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(6px)";
      t.style.transition = "opacity .2s ease, transform .2s ease";
      window.setTimeout(() => t.remove(), 220);
    }, ms);
  },

  confirmar({ titulo, msg, confirmarTexto = "Confirmar", cancelarTexto = "Cancelar" }) {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog");
      dlg.className = "modal";
      dlg.innerHTML = `
        <form method="dialog" class="modalCard">
          <div class="modalHeader">
            <div>
              <div class="modalTitle"></div>
              <div class="modalSubtitle"></div>
            </div>
            <button class="btn btnGhost btnSm" value="cancelar" aria-label="Fechar">${cancelarTexto}</button>
          </div>
          <div class="modalBody">
            <div class="row" style="justify-content:flex-end; gap:10px; margin-top:10px">
              <button class="btn btnGhost" value="cancelar">${cancelarTexto}</button>
              <button class="btn btnPrimary" value="confirmar">${confirmarTexto}</button>
            </div>
          </div>
        </form>
      `;
      dlg.querySelector(".modalTitle").textContent = titulo || "Confirmar";
      dlg.querySelector(".modalSubtitle").textContent = msg || "";
      document.body.appendChild(dlg);
      dlg.addEventListener("close", () => {
        const ok = dlg.returnValue === "confirmar";
        dlg.remove();
        resolve(ok);
      });
      dlg.showModal();
    });
  },
};

