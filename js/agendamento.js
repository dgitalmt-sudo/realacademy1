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

/* ── Botão "Garantir Minha Vaga" — checkout externo ────────── */
/* Navegação tratada pelo href do <a>; nenhuma ação extra necessária. */


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
