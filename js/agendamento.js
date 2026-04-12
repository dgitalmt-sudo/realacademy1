/* ================================================
   AGENDAMENTO.JS — Etapas 3 e 4: agendamento e pagamento
   ================================================ */

/* ── Estado local ─────────────────────────────────────────── */
var horarioSelecionado = null;
var cidadeAgendamento  = null;

/* ── Seleção de horário ──────────────────────────────────── */
function selecionarHorario(btn) {
  document.querySelectorAll('.horario-btn').forEach(function (b) {
    b.classList.remove('selecionado');
  });
  btn.classList.add('selecionado');
  horarioSelecionado = btn.getAttribute('data-horario');
  document.getElementById('erro-horario').style.display = 'none';
}

/* ── Botão "Confirmar Agendamento" ───────────────────────── */
document.getElementById('btnConfirmarAgendamento').addEventListener('click', function () {
  if (!horarioSelecionado) {
    var errHorario = document.getElementById('erro-horario');
    errHorario.style.display = 'block';
    errHorario.classList.add('ativo');
    return;
  }

  var dropWrap = document.getElementById('cidadeDropdownWrap');
  if (dropWrap && dropWrap.style.display !== 'none') {
    var sel = document.getElementById('agendCidadeSelect');
    var opt = sel.options[sel.selectedIndex];
    if (opt && opt.dataset.json) {
      try { cidadeAgendamento = JSON.parse(opt.dataset.json); } catch(e) {}
    }
  }

  localStorage.setItem('horario_agendamento', horarioSelecionado);
  if (cidadeAgendamento) {
    localStorage.setItem('cidade_selecionada', JSON.stringify(cidadeAgendamento));
  }

  preencherResumo();

  document.getElementById('agendamentoSection').classList.remove('ativa');
  document.getElementById('resumoSection').classList.add('ativa');

  document.getElementById('barraProg').style.width = '100%';
  document.getElementById('etapaTexto').textContent = 'Etapa 4 de 4 — Confirmação e Pagamento';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ── Evento Meta: InitiateCheckout ──────────────────────────── */
  _dispararEventoMeta('InitiateCheckout', { value: 79.90, currency: 'BRL', num_items: 1 });
});

/* ── Preencher card de resumo ────────────────────────────── */
function preencherResumo() {
  var dados = {};
  try { dados = JSON.parse(localStorage.getItem('dadosAtleta') || '{}'); } catch(e) {}

  var cidade = {};
  try { cidade = JSON.parse(localStorage.getItem('cidade_selecionada') || '{}'); } catch(e) {}

  var horario = localStorage.getItem('horario_agendamento') || horarioSelecionado || '—';

  var el = function(id) { return document.getElementById(id); };

  el('resumoAtleta').textContent      = dados.nomeAtleta       || '—';
  el('resumoResponsavel').textContent = dados.nomeResponsavel  || '—';
  el('resumoEmail').textContent       = dados.email            || '—';
  el('resumoPosicao').textContent     = dados.posicaoPrincipal || '—';
  el('resumoCidade').textContent      = (cidade.cidade ? cidade.cidade + ' — ' + cidade.estado : '—');
  el('resumoHorario').textContent     = horario;

  var idadeExibir = dados.idadeEvento || dados.idade;
  el('resumoIdade').textContent = idadeExibir ? idadeExibir + ' anos (em 14/06/2026)' : '—';
}

/* ── Helpers de tracking Meta ───────────────────────────────── */
function _sha256(str) {
  /* Retorna Promise<hex> — usa SubtleCrypto nativo do browser */
  var buf = new TextEncoder().encode(str.trim().toLowerCase());
  return crypto.subtle.digest('SHA-256', buf).then(function (hash) {
    return Array.from(new Uint8Array(hash)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  });
}

function _dispararEventoMeta(eventName, params) {
  try {
    if (typeof fbq === 'function') {
      fbq('track', eventName, params || {});
    }
    /* Utmify custom event (se disponível) */
    if (window.UtmifyPixel && typeof window.UtmifyPixel.track === 'function') {
      window.UtmifyPixel.track(eventName, params || {});
    }
  } catch (e) { /* falha silenciosa */ }
}

/* ── Botão "Garantir Minha Vaga" — dispara Lead antes do checkout ── */
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('btnFinalizar');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var dados = {};
    try { dados = JSON.parse(localStorage.getItem('dadosAtleta') || '{}'); } catch (e) {}

    var email    = (dados.email    || '').trim().toLowerCase();
    var telefone = (dados.telefone || '').replace(/\D/g, '');

    /* Hashes SHA-256 obrigatórios pelo Meta para dados pessoais */
    Promise.all([
      email    ? _sha256(email)    : Promise.resolve(null),
      telefone ? _sha256(telefone) : Promise.resolve(null)
    ]).then(function (hashes) {
      var params = { value: 79.90, currency: 'BRL' };
      if (hashes[0]) params.em = hashes[0];
      if (hashes[1]) params.ph = hashes[1];
      _dispararEventoMeta('Lead', params);
    });
  });
});

/* ── Inicialização da etapa de agendamento ───────────────── */
(function inicializarAgendamento() {
  var cidadeSalva = localStorage.getItem('cidade_selecionada');
  if (cidadeSalva) {
    try {
      cidadeAgendamento = JSON.parse(cidadeSalva);
      document.getElementById('agendCidadeNome').textContent =
        cidadeAgendamento.cidade + ' — ' + cidadeAgendamento.estado;
      document.getElementById('cidadeDropdownWrap').style.display = 'none';
    } catch(e) {
      cidadeAgendamento = null;
    }
  }

  if (!cidadeAgendamento) {
    var badgeCidade = document.getElementById('agendBadgeCidade');
    if (badgeCidade) badgeCidade.style.display = 'none';
    document.getElementById('cidadeDropdownWrap').style.display = 'block';

    var sel = document.getElementById('agendCidadeSelect');
    sel.innerHTML = '<option value="">Carregando cidades...</option>';

    fetch('data/cidades.json')
      .then(function (r) { return r.json(); })
      .then(function (cidades) {
        cidades.sort(function (a, b) { return a.cidade.localeCompare(b.cidade, 'pt-BR'); });
        sel.innerHTML = '<option value="">Selecione a cidade...</option>';
        cidades.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.cidade;
          opt.textContent = c.cidade + ' — ' + c.estado;
          opt.dataset.json = JSON.stringify(c);
          sel.appendChild(opt);
        });
      })
      .catch(function () {
        sel.innerHTML = '<option value="">Erro ao carregar cidades</option>';
      });

    sel.addEventListener('change', function () {
      var opt = sel.options[sel.selectedIndex];
      if (opt && opt.dataset.json) {
        try { cidadeAgendamento = JSON.parse(opt.dataset.json); } catch(e) {}
      }
    });
  }
})();
