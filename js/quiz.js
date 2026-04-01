/* ================================================
   QUIZ.JS — Lógica do formulário multi-etapas
   16 perguntas:
     Q1–Q10  → Informações básicas (Q10 = e-mail + confirmação)
     Q11     → Parentesco (condicional: só se idade < 18)
     Q12–Q16 → Histórico de saúde
   ================================================ */

/* ── Estado do quiz ─────────────────────────────────────────────── */
var questaoAtual  = 1;
var totalQuestoes = 16;
var dadosAtleta   = {};
var idadeAtleta   = 0; /* calculada em Q3, controla se Q11 é exibida */

var barraProg  = document.getElementById('barraProg');
var etapaTexto = document.getElementById('etapaTexto');

/* ── Utilitários ─────────────────────────────────────────────────── */
function esconderErro(id) {
  var el = document.getElementById('erro-' + id);
  if (el) el.classList.remove('ativo');
}
function mostrarErroMsg(id, msg) {
  var el = document.getElementById('erro-' + id);
  if (!el) return;
  if (msg) el.textContent = msg;
  el.classList.add('ativo');
}

/* Conta palavras em uma string (ignora espaços extras) */
function contarPalavras(str) {
  return str.trim().split(/\s+/).filter(function(w){ return w.length > 0; }).length;
}

/* Valida formato de e-mail */
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/* Valida DDD + número brasileiro — 10 ou 11 dígitos, DDD válido */
var DDDS_VALIDOS = [
  11,12,13,14,15,16,17,18,19,
  21,22,24,27,28,
  31,32,33,34,35,37,38,
  41,42,43,44,45,46,47,48,49,
  51,53,54,55,
  61,62,63,64,65,66,67,68,69,
  71,73,74,75,77,79,
  81,82,83,84,85,86,87,88,89,
  91,92,93,94,95,96,97,98,99
];
function telefoneValido(tel) {
  var digits = tel.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return false;
  var ddd = parseInt(digits.substring(0, 2), 10);
  if (DDDS_VALIDOS.indexOf(ddd) === -1) return false;
  var numero = digits.substring(2);
  /* Celular: 11 dígitos, número começa com 9 */
  if (digits.length === 11 && numero[0] !== '9') return false;
  /* Fixo: 10 dígitos, começa com 2-5 */
  if (digits.length === 10 && !/^[2-5]/.test(numero)) return false;
  return true;
}

/* Atualiza barra de progresso e texto descritivo de etapa */
function atualizarProgresso(q) {
  var pct = Math.round((q / totalQuestoes) * 100);
  barraProg.style.width = pct + '%';
  barraProg.parentElement.setAttribute('aria-valuenow', pct);

  if (q <= 11)       etapaTexto.textContent = 'Etapa 1 de 4 — Informações Básicas (pergunta ' + q + ' de 16)';
  else if (q <= 16)  etapaTexto.textContent = 'Etapa 2 de 4 — Histórico de Saúde (pergunta ' + q + ' de 16)';
}

/* Transição para a próxima pergunta (slide para esquerda) */
function irParaCard(de, para) {
  var cardDe   = document.getElementById('card-' + de);
  var cardPara = document.getElementById('card-' + para);
  if (!cardDe || !cardPara) return;

  cardDe.classList.add('saindo');
  setTimeout(function () {
    cardDe.classList.remove('ativo', 'saindo');
    cardPara.classList.add('ativo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 280);
}

/* Transição para a pergunta anterior (slide para direita) */
function voltarParaCard(de, para) {
  var cardDe   = document.getElementById('card-' + de);
  var cardPara = document.getElementById('card-' + para);
  if (!cardDe || !cardPara) return;

  cardDe.classList.add('saindo');
  setTimeout(function () {
    cardDe.classList.remove('ativo', 'saindo');
    cardPara.style.animation = 'slideInLeft 0.35s ease';
    cardPara.classList.add('ativo');
    setTimeout(function () { cardPara.style.animation = ''; }, 360);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 280);
}

/* ── Validações por questão ──────────────────────────────────────── */
function validarQ(n) {
  esconderErro('q' + n);

  switch (n) {

    /* Q1 — Nome do atleta: mínimo 2 palavras */
    case 1: {
      var v = document.getElementById('q1').value.trim();
      if (!v) {
        mostrarErroMsg('q1', 'Por favor, preencha o nome do atleta.');
        return false;
      }
      if (contarPalavras(v) < 2) {
        mostrarErroMsg('q1', 'Informe o nome completo (nome e sobrenome). Ex: Lucas Henrique Ferreira');
        return false;
      }
      dadosAtleta.nomeAtleta = v;
      return true;
    }

    /* Q2 — Nome do responsável: mínimo 2 palavras */
    case 2: {
      var v = document.getElementById('q2').value.trim();
      if (!v) {
        mostrarErroMsg('q2', 'Por favor, preencha o nome do responsável.');
        return false;
      }
      if (contarPalavras(v) < 2) {
        mostrarErroMsg('q2', 'Informe o nome completo (nome e sobrenome). Ex: Ana Paula Rodrigues');
        return false;
      }
      dadosAtleta.nomeResponsavel = v;
      return true;
    }

    /* Q3 — Data de nascimento: atleta deve ter 7–18 anos no dia 14/06/2026 */
    case 3: {
      var v = document.getElementById('q3').value;
      if (!v) {
        mostrarErroMsg('q3', 'Por favor, informe a data de nascimento.');
        return false;
      }
      var nasc       = new Date(v + 'T00:00:00');
      var eventoData = new Date('2026-06-14T00:00:00');

      /* Calcular idade na data do evento */
      var idadeEvento = eventoData.getFullYear() - nasc.getFullYear();
      var mDiff = eventoData.getMonth() - nasc.getMonth();
      if (mDiff < 0 || (mDiff === 0 && eventoData.getDate() < nasc.getDate())) idadeEvento--;

      if (idadeEvento < 7 || idadeEvento > 18) {
        mostrarErroMsg('q3',
          'A peneira é para atletas com 7 a 18 anos em 14/06/2026. ' +
          'Idade calculada: ' + idadeEvento + ' anos.'
        );
        return false;
      }

      /* Calcular idade atual também (para lógica interna) */
      var hoje = new Date();
      var anos = hoje.getFullYear() - nasc.getFullYear();
      var m    = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
      idadeAtleta = anos;

      dadosAtleta.nascimento   = v;
      dadosAtleta.idade        = anos;
      dadosAtleta.idadeEvento  = idadeEvento;
      return true;
    }

    case 4: {
      var alt = document.getElementById('q4a').value;
      var pes = document.getElementById('q4b').value;
      if (!alt || !pes) {
        mostrarErroMsg('q4', 'Por favor, preencha a altura e o peso.');
        return false;
      }
      dadosAtleta.altura = alt;
      dadosAtleta.peso   = pes;
      return true;
    }

    case 5: {
      var v = document.getElementById('q5').value;
      if (!v) { mostrarErroMsg('q5', 'Por favor, selecione uma posição.'); return false; }
      dadosAtleta.posicaoPrincipal = v;
      return true;
    }

    case 6: {
      dadosAtleta.posicaoSecundaria = document.getElementById('q6').value || '';
      return true;
    }

    case 7: {
      var v = document.getElementById('q7').value;
      if (!v) { mostrarErroMsg('q7', 'Por favor, selecione o pé dominante.'); return false; }
      dadosAtleta.peDominante = v;
      return true;
    }

    /* Q8 — Cidade: mínimo 3 letras */
    case 8: {
      var cidade = document.getElementById('q8a').value.trim();
      if (cidade.replace(/\s/g, '').length < 3) {
        mostrarErroMsg('q8', 'O nome da cidade deve ter pelo menos 3 letras.');
        return false;
      }
      dadosAtleta.cidadeAtleta = cidade;
      dadosAtleta.bairroAtleta = document.getElementById('q8b').value.trim();
      return true;
    }

    /* Q9 — Telefone: DDD válido + formato brasileiro */
    case 9: {
      var telRaw = document.getElementById('q9').value;
      if (!telefoneValido(telRaw)) {
        mostrarErroMsg('q9',
          'Número inválido. Use DDD + número (ex: (11) 99999-9999 ou (11) 3333-3333).'
        );
        return false;
      }
      dadosAtleta.telefone = telRaw;
      return true;
    }

    /* Q10 — E-mail com confirmação */
    case 10: {
      var email     = document.getElementById('q10').value.trim();
      var emailConf = document.getElementById('q10conf').value.trim();

      if (!email || !emailValido(email)) {
        mostrarErroMsg('q10', 'Informe um endereço de e-mail válido. Ex: nome@gmail.com');
        return false;
      }
      if (!emailConf) {
        mostrarErroMsg('q10', 'Por favor, confirme seu e-mail no segundo campo.');
        return false;
      }
      if (email.toLowerCase() !== emailConf.toLowerCase()) {
        mostrarErroMsg('q10', 'Os e-mails não coincidem. Verifique e tente novamente.');
        return false;
      }
      dadosAtleta.email = email;
      return true;
    }

    /* Q11 — Parentesco (condicional para menor de 18) */
    case 11: {
      var v = document.getElementById('q11').value;
      if (!v) { mostrarErroMsg('q11', 'Por favor, selecione o parentesco.'); return false; }
      dadosAtleta.parentesco = v;
      return true;
    }

    case 12: {
      var v = document.getElementById('q12').value;
      if (!v) { mostrarErroMsg('q12', 'Por favor, responda esta pergunta.'); return false; }
      dadosAtleta.doencaDiagnosticada = v;
      if (v === 'Sim') dadosAtleta.doencaDesc = document.getElementById('q12desc').value;
      return true;
    }

    case 13: {
      var v = document.getElementById('q13').value;
      if (!v) { mostrarErroMsg('q13', 'Por favor, responda esta pergunta.'); return false; }
      dadosAtleta.problemasCardiacos = v;
      if (v === 'Sim') dadosAtleta.cardiacosDesc = document.getElementById('q13desc').value;
      return true;
    }

    case 14: {
      var v = document.getElementById('q14').value;
      if (!v) { mostrarErroMsg('q14', 'Por favor, responda esta pergunta.'); return false; }
      dadosAtleta.desmaioExercicio = v;
      return true;
    }

    case 15: {
      var v = document.getElementById('q15').value;
      if (!v) { mostrarErroMsg('q15', 'Por favor, responda esta pergunta.'); return false; }
      dadosAtleta.remediosContinuos = v;
      if (v === 'Sim') dadosAtleta.remedioDesc = document.getElementById('q15desc').value;
      return true;
    }

    case 16: {
      var v = document.getElementById('q16').value;
      if (!v) { mostrarErroMsg('q16', 'Por favor, responda esta pergunta.'); return false; }
      dadosAtleta.restricaoMedica = v;
      if (v === 'Sim') dadosAtleta.restricaoDesc = document.getElementById('q16desc').value;
      return true;
    }
  }
  return true;
}

/* ── Persistência de progresso ───────────────────────────────────── */
var CAMPOS_TEXTO = ['q1','q2','q3','q4a','q4b','q5','q6','q8a','q8b','q9','q10','q10conf','q11','q12desc','q13desc','q15desc','q16desc'];
var CAMPOS_HIDDEN = ['q7','q12','q13','q14','q15','q16'];

function salvarProgresso() {
  var prog = { q: questaoAtual, idade: idadeAtleta, dados: dadosAtleta, campos: {} };
  CAMPOS_TEXTO.concat(CAMPOS_HIDDEN).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) prog.campos[id] = el.value;
  });
  try { localStorage.setItem('quiz_progresso', JSON.stringify(prog)); } catch(e) {}
}

function restaurarProgresso() {
  var raw = localStorage.getItem('quiz_progresso');
  if (!raw) return false;
  try {
    var prog = JSON.parse(raw);
    if (!prog || !prog.q || prog.q < 2) return false;

    if (prog.dados)  dadosAtleta = prog.dados;
    if (prog.idade)  idadeAtleta = prog.idade;

    /* Preencher campos de texto e select */
    CAMPOS_TEXTO.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && prog.campos && prog.campos[id]) el.value = prog.campos[id];
    });

    /* Preencher campos hidden e reativar botões de opção e condicionais */
    CAMPOS_HIDDEN.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el || !prog.campos || !prog.campos[id]) return;
      el.value = prog.campos[id];

      /* Marcar o botão correspondente como selecionado */
      var btns = document.querySelectorAll('[onclick*="selecionarOpcao(\'' + id + '\'"]');
      btns.forEach(function(btn) {
        if (btn.dataset.valor === prog.campos[id]) {
          btn.classList.add('selecionado');
          /* Reativar campo condicional (cond-q12, cond-q13 etc.) */
          var cond = document.getElementById('cond-' + id);
          if (cond) cond.classList.toggle('ativo', prog.campos[id] === 'Sim');
        }
      });
    });

    /* Navegar para a questão salva */
    questaoAtual = prog.q;
    document.querySelectorAll('.quiz-card').forEach(function(c) { c.classList.remove('ativo'); });
    var card = document.getElementById('card-' + questaoAtual);
    if (card) card.classList.add('ativo');
    atualizarProgresso(questaoAtual);
    return true;
  } catch(e) { return false; }
}

/* ── Navegação ──────────────────────────────────────────────────── */
function proximaQ(n) {
  if (!validarQ(n)) return;

  var proxima = n + 1;
  /* Após Q10: pular Q11 (parentesco) se atleta tem >= 18 anos */
  if (n === 10 && idadeAtleta >= 18) proxima = 12;

  if (proxima <= totalQuestoes) {
    questaoAtual = proxima;
    irParaCard(n, proxima);
    atualizarProgresso(proxima);
    salvarProgresso();
  }
}

function anteriorQ(n) {
  var anterior = n - 1;
  /* Se estamos em Q12 e atleta >= 18, voltar para Q10 (skip Q11) */
  if (n === 12 && idadeAtleta >= 18) anterior = 10;

  if (anterior >= 1) {
    questaoAtual = anterior;
    voltarParaCard(n, anterior);
    atualizarProgresso(anterior);
    salvarProgresso();
  }
}

function pularQ(n) {
  var proxima = n + 1;
  questaoAtual = proxima;
  irParaCard(n, proxima);
  atualizarProgresso(proxima);
}

/* Selecionar opção (botões Sim/Não, Destro/Canhoto) */
function selecionarOpcao(campo, valor, btn) {
  var container = btn.closest('.quiz-opcoes');
  if (container) {
    container.querySelectorAll('.quiz-opcao-btn').forEach(function (b) {
      b.classList.remove('selecionado');
    });
  }
  btn.classList.add('selecionado');

  var input = document.getElementById(campo);
  if (input) input.value = valor;

  var cond = document.getElementById('cond-' + campo);
  if (cond) cond.classList.toggle('ativo', valor === 'Sim');
}

/* ── Finalizar quiz ──────────────────────────────────────────────── */
var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx1zPy44elS_VbKu5HScFLgprawGsx7w9S0a0pUmP8YAY2Ue1PbMMlfW4NjX0HAmvHF/exec';

function finalizarQuiz() {
  if (!validarQ(16)) return;
  localStorage.setItem('dadosAtleta', JSON.stringify(dadosAtleta));
  localStorage.removeItem('quiz_progresso');

  /* Enviar lead para Google Sheets (silencioso — não bloqueia o fluxo) */
  try {
    fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtleta)
    });
  } catch (e) { /* falha silenciosa */ }

  iniciarAnalise();
}

/* ── Animação de análise ─────────────────────────────────────────── */
var textoAnalise = [
  'Analisando informações...',
  'Verificando elegibilidade...',
  'Processando dados do atleta...',
  'Consultando vagas disponíveis...'
];
var indiceTexto = 0;

function iniciarAnalise() {
  var tela    = document.getElementById('analiseTela');
  var textoEl = document.getElementById('analiseTexto');

  document.getElementById('quizContainer').style.display = 'none';
  document.querySelector('.quiz-progresso').style.display = 'none';
  var selo = document.getElementById('quizSeloSeguranca');
  if (selo) selo.style.display = 'none';

  tela.classList.add('ativa');
  textoEl.textContent = textoAnalise[0];

  var intervaloTexto = setInterval(function () {
    indiceTexto++;
    if (indiceTexto < textoAnalise.length) {
      textoEl.style.opacity = '0';
      setTimeout(function () {
        textoEl.textContent = textoAnalise[indiceTexto];
        textoEl.style.transition = 'opacity 0.4s';
        textoEl.style.opacity = '1';
      }, 300);
    }
  }, 1500);

  setTimeout(function () {
    clearInterval(intervaloTexto);
    tela.classList.remove('ativa');
    mostrarAprovacao();
  }, 6000);
}

/* ── Tela de aprovação ──────────────────────────────────────────── */
function mostrarAprovacao() {
  var tela   = document.getElementById('aprovacaoTela');
  var titulo = document.getElementById('aprovacaoTitulo');

  var primeiroNome = (dadosAtleta.nomeAtleta || 'Atleta').split(' ')[0];
  titulo.textContent = primeiroNome + ' está apto para participar da peneira!';
  tela.classList.add('ativa');
}

document.getElementById('btnContinuarAgendamento').addEventListener('click', function () {
  document.getElementById('aprovacaoTela').classList.remove('ativa');
  document.getElementById('agendamentoSection').classList.add('ativa');

  barraProg.style.width = '75%';
  etapaTexto.textContent = 'Etapa 3 de 4 — Agendamento';
  document.querySelector('.quiz-progresso').style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Máscara de telefone (00) 00000-0000 ─────────────────────────── */
document.getElementById('q9').addEventListener('input', function () {
  var digits = this.value.replace(/\D/g, '').slice(0, 11);
  var masked = '';

  if (digits.length > 0) masked = '(' + digits.substring(0, 2);
  if (digits.length >= 2) masked += ') ';
  if (digits.length >= 3) masked += digits.substring(2, 7);
  if (digits.length >= 7) masked += '-' + digits.substring(7, 11);

  this.value = masked;
});

/* ── Cálculo de idade em tempo real (Q3) ─────────────────────────── */
document.getElementById('q3').addEventListener('change', function () {
  var val = this.value;
  if (!val) return;

  var nasc       = new Date(val + 'T00:00:00');
  var eventoData = new Date('2026-06-14T00:00:00');

  /* Idade na data do evento */
  var idadeEv = eventoData.getFullYear() - nasc.getFullYear();
  var mDiff   = eventoData.getMonth() - nasc.getMonth();
  if (mDiff < 0 || (mDiff === 0 && eventoData.getDate() < nasc.getDate())) idadeEv--;

  /* Idade atual */
  var hoje = new Date();
  var anos = hoje.getFullYear() - nasc.getFullYear();
  var m    = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  idadeAtleta = anos;

  var display = document.getElementById('idadeDisplay');
  if (idadeEv >= 7 && idadeEv <= 18) {
    display.textContent = '🎂 Idade na data do evento: ' + idadeEv + ' anos ✓';
    display.style.display = 'block';
    display.style.background = 'rgba(34,197,94,0.08)';
    display.style.color = '#166534';
  } else if (!isNaN(idadeEv)) {
    display.textContent = '⚠️ Idade na data do evento: ' + idadeEv + ' anos — fora do intervalo permitido (7–18)';
    display.style.display = 'block';
    display.style.background = 'rgba(229,62,62,0.08)';
    display.style.color = '#c53030';
  } else {
    display.style.display = 'none';
  }
});

/* ── Definir limites de data para Q3 (7–18 anos em 14/06/2026) ──── */
(function definirLimitesData() {
  var input      = document.getElementById('q3');
  var eventoData = new Date('2026-06-14T00:00:00');
  /* Mais novo: faz 7 anos no dia do evento */
  var maxD = new Date(eventoData.getFullYear() - 7, eventoData.getMonth(), eventoData.getDate());
  /* Mais velho: ainda tem 18 anos no dia do evento (faz 19 no dia seguinte) */
  var minD = new Date(eventoData.getFullYear() - 18, eventoData.getMonth(), eventoData.getDate() + 1);

  input.max = maxD.toISOString().split('T')[0];
  input.min = minD.toISOString().split('T')[0];
})();

/* ── Alerta "1 vaga restante" ao selecionar posição (Q5) ─────────── */
document.getElementById('q5').addEventListener('change', function () {
  var alerta = document.getElementById('alertaPosicao');
  if (!alerta) return;
  /* Exibe o alerta somente quando uma posição for escolhida */
  if (this.value) {
    alerta.classList.add('visivel');
  } else {
    alerta.classList.remove('visivel');
  }
});

/* ── Inicialização ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  /* Tentar restaurar progresso salvo; se não houver, preencher cidade */
  var restaurado = restaurarProgresso();

  if (!restaurado) {
    var cidadeSalva = localStorage.getItem('cidade_selecionada');
    if (cidadeSalva) {
      try {
        var obj = JSON.parse(cidadeSalva);
        var inputCidade = document.getElementById('q8a');
        if (inputCidade && obj.cidade) inputCidade.value = obj.cidade;
      } catch (e) {}
    }
    atualizarProgresso(1);
  }
});
