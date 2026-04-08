const USERS = {
    cliente: {
        email: 'cliente@email.com',
        _demoPass: '123456',
        nome: 'João Silva',
        tipo: 'cliente'
    },
    barbeiro: {
        email: 'barbeiro@email.com',
        _demoPass: '123456',
        nome: 'Carlos Eduardo',
        tipo: 'barbeiro'
    }
};

const SERVICOS = [
    { id: 1, nome: 'Corte Masculino',    preco: 45.00, duracao: 30, descricao: 'Corte completo com acabamento perfeito' },
    { id: 2, nome: 'Barba',              preco: 35.00, duracao: 25, descricao: 'Barba com toalha quente e produtos premium' },
    { id: 3, nome: 'Corte + Barba',      preco: 70.00, duracao: 50, descricao: 'Pacote completo de cuidados' },
    { id: 4, nome: 'Sobrancelha',        preco: 20.00, duracao: 15, descricao: 'Design e alinhamento de sobrancelhas' },
    { id: 5, nome: 'Pezinho',            preco: 25.00, duracao: 20, descricao: 'Acabamento no pescoço e orelhas' },
    { id: 6, nome: 'Hidratação Capilar', preco: 50.00, duracao: 40, descricao: 'Tratamento profundo para cabelo' }
];

const STATUS_TEXT = {
    agendado:  '✅ Agendado',
    concluido: '✔️ Concluído',
    cancelado: '❌ Cancelado'
};

const State = (() => {
    let currentUser         = null;
    let agendamentos        = [];
    let horariosDisponiveis = [];

    return {
        getUser:    () => currentUser,
        setUser:    (u) => { currentUser = u; },

        getAgendamentos:   () => agendamentos,
        setAgendamentos:   (list) => { agendamentos = list; },
        addAgendamento:    (a) => { agendamentos.push(a); },
        updateAgendamento: (id, patch) => {
            const idx = agendamentos.findIndex(a => a.id === id);
            if (idx !== -1) Object.assign(agendamentos[idx], patch);
        },

        getHorarios:   () => horariosDisponiveis,
        setHorarios:   (list) => { horariosDisponiveis = list; },
        addHorario:    (h) => { horariosDisponiveis.push(h); },
        removeHorario: (id) => { horariosDisponiveis = horariosDisponiveis.filter(h => h.id !== id); },
    };
})();

const Storage = {
    save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.error('Storage.save:', e); }
    },
    load(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch (e) { console.error('Storage.load:', e); return fallback; }
    },
    remove(key) { localStorage.removeItem(key); }
};


const DateUtils = {
    today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    tomorrow() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    format(iso) {
        if (!iso) return '';
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    }
};

const Modal = {
    show(message, confirmLabel = 'Confirmar') {
        return new Promise((resolve) => {
            const tmpl    = document.getElementById('modalTemplate');
            const node    = tmpl.content.cloneNode(true);
            const overlay = node.querySelector('#modalOverlay');

            node.querySelector('#modalMessage').textContent  = message;
            node.querySelector('#modalConfirm').textContent  = confirmLabel;

            const dismiss = (result) => {
                const el = document.getElementById('modalOverlay');
                if (el) document.body.removeChild(el);
                resolve(result);
            };

            node.querySelector('#modalCancel').addEventListener('click',  () => dismiss(false));
            node.querySelector('#modalConfirm').addEventListener('click', () => dismiss(true));

            document.body.appendChild(node);
        });
    }
};


const Toast = {
    show(msg, type = 'info') {
        const icons     = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
        const container = document.getElementById('toastContainer');

        const el   = document.createElement('div');
        el.className = `toast ${type}`;

        const icon = document.createElement('i');
        icon.className = `fas ${icons[type] ?? icons.info}`;

        el.appendChild(icon);
        el.appendChild(document.createTextNode(' ' + msg));
        container.appendChild(el);

        setTimeout(() => {
            el.style.animation = 'slideDown .25s ease forwards';
            setTimeout(() => el.remove(), 250);
        }, 3000);
    }
};

function initData() {
    State.setAgendamentos(Storage.load('agendamentos', []));

    const savedHorarios = Storage.load('horariosDisponiveis', null);
    if (savedHorarios !== null) {
        State.setHorarios(savedHorarios);
    } else {
        const today    = DateUtils.today();
        const tomorrow = DateUtils.tomorrow();
        State.setHorarios([
            { id: 1, data: today,    horario: '14:00' },
            { id: 2, data: today,    horario: '15:00' },
            { id: 3, data: today,    horario: '16:00' },
            { id: 4, data: tomorrow, horario: '10:00' },
            { id: 5, data: tomorrow, horario: '11:00' },
            { id: 6, data: tomorrow, horario: '14:00' }
        ]);
        persistHorarios();
    }
}

function persistAgendamentos() { Storage.save('agendamentos',        State.getAgendamentos()); }
function persistHorarios()     { Storage.save('horariosDisponiveis', State.getHorarios()); }

function handleLogin() {
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const type     = document.getElementById('userType').value;
    const user     = USERS[type];

    if (!email || !password) { Toast.show('Preencha email e senha!', 'error'); return; }

    if (user && user.email === email && user._demoPass === password) {
        const session = { email: user.email, nome: user.nome, tipo: user.tipo };
        State.setUser(session);
        Storage.save('session', session);
        Toast.show('Bem-vindo, ' + user.nome + '!', 'success');
        type === 'cliente' ? showClienteArea() : showBarbeiroArea();
    } else {
        Toast.show('Email ou senha inválidos!', 'error');
    }
}

function logout() {
    State.setUser(null);
    Storage.remove('session');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('clienteScreen').classList.add('hidden');
    document.getElementById('barbeiroScreen').classList.add('hidden');
    Toast.show('Sessão encerrada.', 'info');
}

function restoreSession() {
    const session = Storage.load('session');
    if (!session) return;
    State.setUser(session);
    session.tipo === 'cliente' ? showClienteArea() : showBarbeiroArea();
}

function showClienteArea() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('clienteScreen').classList.remove('hidden');
    document.getElementById('barbeiroScreen').classList.add('hidden');
    document.getElementById('clienteNome').textContent = State.getUser().nome;
    renderServicos();
    populateServicosSelect();
    showClientePage('servicos');
}

function showClientePage(pageId) {
    setActivePage('clienteScreen', pageId);
    if (pageId === 'meus-agendamentos') renderMeusAgendamentos();
    if (pageId === 'agendar') {
        document.getElementById('dataAgendamento').value = '';
        resetHorarioSelect();
    }
}

function showBarbeiroArea() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('clienteScreen').classList.add('hidden');
    document.getElementById('barbeiroScreen').classList.remove('hidden');
    showBarbeiroPage('dashboard');
}

function showBarbeiroPage(pageId) {
    setActivePage('barbeiroScreen', pageId);
    if (pageId === 'dashboard')          renderDashboard();
    if (pageId === 'gerenciar-horarios') renderHorariosGerenciamento();
    if (pageId === 'todos')              renderTodosAgendamentos();
    if (pageId === 'hoje')               renderAgendamentosHoje();
}


function setActivePage(screenId, pageId) {
    const screen = document.getElementById(screenId);
    screen.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    screen.querySelectorAll('.nav-item[data-page]').forEach(b => b.classList.remove('active'));

    const page = document.getElementById(pageId);
    const btn  = screen.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (page) page.classList.add('active');
    if (btn)  btn.classList.add('active');

    const titleEl = document.getElementById(
        screenId === 'clienteScreen' ? 'clientePageTitle' : 'barbeiroPageTitle'
    );
    if (titleEl && btn) {
        titleEl.textContent =
            btn.dataset.label ??
            btn.querySelector('span')?.textContent ??
            btn.textContent.trim();
    }
}


function renderServicos() {
    document.getElementById('servicosList').innerHTML = SERVICOS.map(s => `
        <div class="servico-card">
            <div class="servico-nome">${escHtml(s.nome)}</div>
            <div class="servico-preco">R$ ${s.preco.toFixed(2)}</div>
            <div class="servico-descricao">${escHtml(s.descricao)}</div>
            <div class="servico-duracao">⏱ ${s.duracao} min</div>
        </div>
    `).join('');
}

function populateServicosSelect() {
    document.getElementById('servicoSelect').innerHTML = SERVICOS.map(s =>
        `<option value="${s.id}">${escHtml(s.nome)} — R$ ${s.preco.toFixed(2)}</option>`
    ).join('');
}


function renderMeusAgendamentos() {
    const user      = State.getUser();
    const list      = State.getAgendamentos().filter(a => a.clienteId === user.email);
    const container = document.getElementById('meusAgendamentosList');

    if (!list.length) { renderEmpty(container, 'Nenhum agendamento encontrado'); return; }

    container.innerHTML = [...list]
        .sort((a, b) => b.id - a.id)
        .map(a => `
            <div class="agendamento-card ${a.status !== 'agendado' ? a.status : ''}">
                <div class="agendamento-servico">${escHtml(a.servicoNome)}</div>
                <div class="agendamento-meta">📅 ${DateUtils.format(a.data)} &nbsp;⏰ ${a.horario}</div>
                <div class="badge ${a.status}">${STATUS_TEXT[a.status] ?? a.status}</div>
                ${a.status === 'agendado'
                    ? `<div class="agendamento-actions">
                           <button class="btn-sm danger" data-id="${a.id}" data-action="cancelar-cliente">Cancelar</button>
                       </div>`
                    : ''}
            </div>
        `).join('');
}


function renderDashboard() {
    const todos    = State.getAgendamentos();
    const ativos   = todos.filter(a => a.status !== 'cancelado');
    const hoje     = todos.filter(a => a.data === DateUtils.today() && a.status !== 'cancelado');
    const faturado = todos.filter(a => a.status === 'concluido').reduce((s, a) => s + a.preco, 0);

    document.getElementById('totalAgendamentos').textContent = ativos.length;
    document.getElementById('agendamentosHoje').textContent  = hoje.length;
    document.getElementById('faturamentoTotal').textContent  = `R$ ${faturado.toFixed(2)}`;
    document.getElementById('totalHorarios').textContent     = State.getHorarios().length;
}


function renderHorariosGerenciamento() {
    const container = document.getElementById('horariosDisponiveisList');
    const list = [...State.getHorarios()].sort((a, b) =>
        a.data !== b.data ? a.data.localeCompare(b.data) : a.horario.localeCompare(b.horario)
    );

    if (!list.length) { renderEmpty(container, 'Nenhum horário cadastrado'); return; }

    container.innerHTML = list.map(h => `
        <div class="horario-item">
            <div class="horario-info">
                <span class="horario-data">📅 ${DateUtils.format(h.data)}</span>
                <span class="horario-time">⏰ ${h.horario}</span>
            </div>
            <button class="btn-sm danger" data-id="${h.id}" data-action="remover-horario">Remover</button>
        </div>
    `).join('');
}

function addHorarioDisponivel() {
    const data    = document.getElementById('novaDataHorario').value;
    const horario = document.getElementById('novoHorario').value;
    const today   = DateUtils.today();

    if (!data || !horario) { Toast.show('Preencha data e horário!', 'error'); return; }
    if (data < today)      { Toast.show('Data não pode ser no passado!', 'error'); return; }

    const existe = State.getHorarios().some(h => h.data === data && h.horario === horario);
    if (existe) { Toast.show('Este horário já existe!', 'error'); return; }

    State.addHorario({ id: Date.now(), data, horario });
    persistHorarios();
    Toast.show('Horário adicionado!', 'success');
    document.getElementById('novaDataHorario').value = '';
    document.getElementById('novoHorario').value     = '';
    renderHorariosGerenciamento();
    renderDashboard();
}

function renderTodosAgendamentos() {
    renderListaAgendamentos(
        'todosAgendamentosList',
        State.getAgendamentos().filter(a => a.status !== 'cancelado')
    );
}

function renderAgendamentosHoje() {
    renderListaAgendamentos(
        'hojeAgendamentosList',
        State.getAgendamentos().filter(a => a.data === DateUtils.today() && a.status !== 'cancelado')
    );
}

function renderListaAgendamentos(containerId, list) {
    const container = document.getElementById(containerId);
    if (!list.length) { renderEmpty(container, 'Nenhum agendamento'); return; }

    container.innerHTML = [...list]
        .sort((a, b) => a.data !== b.data
            ? a.data.localeCompare(b.data)
            : a.horario.localeCompare(b.horario))
        .map(a => `
            <div class="agendamento-card ${a.status !== 'agendado' ? a.status : ''}">
                <div class="agendamento-servico">${escHtml(a.servicoNome)}</div>
                <div class="agendamento-meta">👤 ${escHtml(a.clienteNome)}</div>
                <div class="agendamento-meta">📅 ${DateUtils.format(a.data)} &nbsp;⏰ ${a.horario}</div>
                <div class="badge ${a.status}">${STATUS_TEXT[a.status] ?? a.status}</div>
                <div class="agendamento-actions">
                    <button class="btn-sm danger" data-id="${a.id}" data-action="cancelar-barbeiro">Cancelar</button>
                    ${a.status === 'agendado'
                        ? `<button class="btn-sm success" data-id="${a.id}" data-action="concluir">✓ Concluir</button>`
                        : ''}
                </div>
            </div>
        `).join('');
}

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id     = Number(btn.dataset.id);

    if (action === 'cancelar-cliente') {
        const ok = await Modal.show('Deseja cancelar este agendamento?', 'Cancelar Agendamento');
        if (!ok) return;

        State.updateAgendamento(id, { status: 'cancelado' });
        persistAgendamentos();
        renderMeusAgendamentos();
        Toast.show('Agendamento cancelado. O horário está disponível novamente.', 'info');
    }

    if (action === 'cancelar-barbeiro') {
        const ok = await Modal.show('Cancelar este agendamento?', 'Confirmar');
        if (!ok) return;
        State.updateAgendamento(id, { status: 'cancelado' });
        persistAgendamentos();
        refreshBarbeiroCurrentPage();
        renderDashboard();
        Toast.show('Agendamento cancelado!', 'info');
    }

    if (action === 'concluir') {
        const ok = await Modal.show('Marcar como concluído?', 'Confirmar');
        if (!ok) return;
        State.updateAgendamento(id, { status: 'concluido' });
        persistAgendamentos();
        refreshBarbeiroCurrentPage();
        renderDashboard();
        Toast.show('Agendamento concluído!', 'success');
    }

    if (action === 'remover-horario') {
        const ok = await Modal.show('Remover este horário disponível?', 'Remover');
        if (!ok) return;
        State.removeHorario(id);
        persistHorarios();
        renderHorariosGerenciamento();
        renderDashboard();
        Toast.show('Horário removido!', 'info');
    }
});

function refreshBarbeiroCurrentPage() {
    const active = document.querySelector('#barbeiroScreen .page.active');
    if (!active) return;
    if (active.id === 'todos') renderTodosAgendamentos();
    if (active.id === 'hoje')  renderAgendamentosHoje();
}

function getHorariosLivresPorData(data) {
    const ocupados = new Set(
        State.getAgendamentos()
            .filter(a => a.data === data && a.status !== 'cancelado')
            .map(a => a.horario)
    );
    return State.getHorarios().filter(h => h.data === data && !ocupados.has(h.horario));
}

function resetHorarioSelect() {
    const sel     = document.getElementById('horarioSelect');
    sel.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    sel.disabled  = true;
}

function onDataChange() {
    const data = document.getElementById('dataAgendamento').value;
    const sel  = document.getElementById('horarioSelect');

    if (!data) { resetHorarioSelect(); return; }

    const livres = getHorariosLivresPorData(data);
    if (!livres.length) {
        sel.innerHTML = '<option value="">Nenhum horário disponível</option>';
        sel.disabled  = true;
        return;
    }

    sel.disabled  = false;
    sel.innerHTML = '<option value="">Selecione um horário</option>' +
        [...livres]
            .sort((a, b) => a.horario.localeCompare(b.horario))
            .map(h => `<option value="${h.horario}">${h.horario}</option>`)
            .join('');
}

function handleAgendamento() {
    const btn       = document.getElementById('btnAgendar');
    const servicoId = parseInt(document.getElementById('servicoSelect').value, 10);
    const data      = document.getElementById('dataAgendamento').value;
    const horario   = document.getElementById('horarioSelect').value;
    const today     = DateUtils.today();

    if (!servicoId || !data || !horario) { Toast.show('Preencha todos os campos!', 'error'); return; }
    if (data < today)                    { Toast.show('Não é possível agendar no passado!', 'error'); return; }

    const disponivel = getHorariosLivresPorData(data).some(h => h.horario === horario);
    if (!disponivel) {
        Toast.show('Este horário não está mais disponível!', 'error');
        onDataChange();
        return;
    }

    const servico = SERVICOS.find(s => s.id === servicoId);
    const user    = State.getUser();

    btn.disabled    = true;
    btn.textContent = 'Agendando…';

    State.addAgendamento({
        id:          Date.now(),
        clienteId:   user.email,
        clienteNome: user.nome,
        servicoId:   servico.id,
        servicoNome: servico.nome,
        preco:       servico.preco,
        data,
        horario,
        status:      'agendado',
        criadoEm:    new Date().toISOString()
    });
    persistAgendamentos();

    btn.disabled    = false;
    btn.textContent = 'Confirmar Agendamento';

    Toast.show('Agendamento realizado!', 'success');
    document.getElementById('dataAgendamento').value = '';
    resetHorarioSelect();
    showClientePage('meus-agendamentos');
}

function renderEmpty(container, msg) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-xmark"></i>${escHtml(msg)}</div>`;
}

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ESC_MAP[c]);
}


document.addEventListener('DOMContentLoaded', () => {
    initData();

    const today = DateUtils.today();
    document.getElementById('novaDataHorario').min = today;
    document.getElementById('dataAgendamento').min  = today;

    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    document.getElementById('loginEmail').addEventListener('keydown',    e => e.key === 'Enter' && handleLogin());
    document.getElementById('loginPassword').addEventListener('keydown', e => e.key === 'Enter' && handleLogin());

    document.getElementById('clienteLogout').addEventListener('click', logout);
    document.getElementById('barbeiroLogout').addEventListener('click', logout);

    document.getElementById('dataAgendamento').addEventListener('change', onDataChange);
    document.getElementById('btnAgendar').addEventListener('click', handleAgendamento);
    document.getElementById('btnAddHorario').addEventListener('click', addHorarioDisponivel);

    document.getElementById('clienteScreen').addEventListener('click', e => {
        const btn = e.target.closest('.nav-item[data-page]');
        if (!btn) return;
        showClientePage(btn.dataset.page);
        if (window.innerWidth <= 768) closeSidebar('clienteSidebar', 'clienteOverlay');
    });

    document.getElementById('barbeiroScreen').addEventListener('click', e => {
        const btn = e.target.closest('.nav-item[data-page]');
        if (!btn) return;
        showBarbeiroPage(btn.dataset.page);
        if (window.innerWidth <= 768) closeSidebar('barbeiroSidebar', 'barbeiroOverlay');
    });

    document.getElementById('clienteMenuToggle').addEventListener('click',  () => toggleSidebar('clienteSidebar',  'clienteOverlay'));
    document.getElementById('barbeiroMenuToggle').addEventListener('click', () => toggleSidebar('barbeiroSidebar', 'barbeiroOverlay'));
    document.getElementById('clienteOverlay').addEventListener('click',     () => closeSidebar('clienteSidebar',   'clienteOverlay'));
    document.getElementById('barbeiroOverlay').addEventListener('click',    () => closeSidebar('barbeiroSidebar',  'barbeiroOverlay'));

    restoreSession();
});

function toggleSidebar(sidebarId, overlayId) {
    document.getElementById(sidebarId).classList.toggle('open');
    document.getElementById(overlayId).classList.toggle('visible');
}
function closeSidebar(sidebarId, overlayId) {
    document.getElementById(sidebarId).classList.remove('open');
    document.getElementById(overlayId).classList.remove('visible');
}