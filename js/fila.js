/* ================================================
   FILA.JS — Lógica da página de fila de acesso
   Controla: cronômetro, barra de progresso, estados de posição,
   transição para tela de "Acesso Liberado" e counter de expiração.
   Usa: setInterval, sessionStorage, CSS classes
   ================================================ */

// ── Referências ao DOM ──────────────────────────────────────────────
var timerNumero  = document.getElementById('timerNumero');
var progressFill = document.getElementById('progressFill');
var posicaoCard  = document.getElementById('posicaoCard');
var posicaoNumero= document.getElementById('posicaoNumero');
var posicaoTexto = document.getElementById('posicaoTexto');
var filaBox      = document.getElementById('filaBox');
var filaLiberado = document.getElementById('filaLiberado');
var expiraTimer  = document.getElementById('expiraTimer');
var btnAcessar   = document.getElementById('btnAcessarCidades');

// ── Configuração ────────────────────────────────────────────────────
var TOTAL_SEGUNDOS = 20;
var segundosRestantes = TOTAL_SEGUNDOS;
var intervaloFila  = null;
var intervaloExpira= null;

/* Formata segundos como MM:SS */
function formatarTempo(s) {
  var min = String(Math.floor(s / 60)).padStart(2, '0');
  var seg = String(s % 60).padStart(2, '0');
  return min + ':' + seg;
}

/* Atualiza estado da posição conforme o tempo restante */
function atualizarEstadoPosicao(segundos) {
  if (segundos > 13) {
    /* 00:20 → 00:14 — 3º lugar, 2 pessoas na frente */
    posicaoNumero.textContent = '3º lugar';
    posicaoTexto.textContent  = '2 pessoas na sua frente';
    posicaoCard.classList.remove('dourado');
    timerNumero.classList.remove('blink');

  } else if (segundos > 6) {
    /* 00:13 → 00:07 — 2º lugar, 1 pessoa na frente */
    posicaoNumero.textContent = '2º lugar';
    posicaoTexto.textContent  = '1 pessoa na sua frente';
    posicaoCard.classList.remove('dourado');
    timerNumero.classList.remove('blink');

  } else if (segundos > 0) {
    /* 00:06 → 00:01 — 1º lugar, você é o próximo */
    posicaoNumero.textContent = '1º lugar';
    posicaoTexto.innerHTML    = '✓ Você é o próximo!';
    posicaoCard.classList.add('dourado');
    timerNumero.classList.remove('blink');
  }
}

/* Tick executado a cada 1 segundo */
function tick() {
  segundosRestantes--;

  /* Atualizar display do cronômetro */
  timerNumero.textContent = formatarTempo(segundosRestantes);

  /* Atualizar barra de progresso — esvazia da direita para a esquerda */
  var porcentagem = (segundosRestantes / TOTAL_SEGUNDOS) * 100;
  progressFill.style.width = porcentagem + '%';

  /* Atualizar barra ARIA */
  var barra = document.querySelector('.fila-progress-bar');
  if (barra) barra.setAttribute('aria-valuenow', segundosRestantes);

  /* Atualizar texto de posição em momentos-chave */
  atualizarEstadoPosicao(segundosRestantes);

  /* Ao chegar em zero: liberar acesso */
  if (segundosRestantes <= 0) {
    clearInterval(intervaloFila);
    mostrarAcessoLiberado();
  }
}

/* Esconde o bloco da fila e exibe tela de "Acesso Liberado" */
function mostrarAcessoLiberado() {
  /* Persistir liberação no sessionStorage */
  sessionStorage.setItem('fila_liberada', 'true');
  sessionStorage.setItem('fila_timestamp', Date.now().toString());

  /* Fade-out da caixa de fila */
  filaBox.style.transition = 'opacity 0.5s ease';
  filaBox.style.opacity = '0';

  /* Após fade-out, exibir bloco de liberação */
  setTimeout(function () {
    filaBox.style.display = 'none';
    filaLiberado.classList.add('ativo');

    /* Iniciar counter de expiração de 5 minutos (299 segundos) */
    iniciarContadorExpiracao(299);
  }, 500);
}

/* Contador regressivo de expiração de acesso (5 min) */
function iniciarContadorExpiracao(totalSeg) {
  var s = totalSeg;
  expiraTimer.textContent = formatarTempo(s);

  intervaloExpira = setInterval(function () {
    s--;
    expiraTimer.textContent = formatarTempo(s);

    if (s <= 0) {
      /* Acesso expirado — invalidar e voltar para fila */
      clearInterval(intervaloExpira);
      sessionStorage.removeItem('fila_liberada');
      sessionStorage.removeItem('fila_timestamp');
      window.location.href = 'fila.html';
    }
  }, 1000);
}

/* Botão "Acessar Cidades" — redireciona para cidades.html */
btnAcessar.addEventListener('click', function () {
  clearInterval(intervaloExpira); /* parar counter ao navegar */
  window.location.href = 'cidades.html';
});

/* ── Partículas douradas flutuantes ────────────────────────────────
   Gera <div class="particula"> posicionados aleatoriamente,
   cada um com duração e posição horizontal diferentes.
   Usa somente CSS @keyframes — sem canvas, sem áudio.
   ─────────────────────────────────────────────────────────────── */
function gerarParticulas() {
  var container = document.getElementById('particulas');
  var total = 30;

  for (var i = 0; i < total; i++) {
    var p = document.createElement('div');
    p.className = 'particula';

    /* Parâmetros aleatórios para variedade visual */
    var esquerda  = Math.random() * 100;           /* % horizontal */
    var tamanho   = 3 + Math.random() * 7;         /* 3–10px */
    var duracao   = 9 + Math.random() * 14;        /* 9–23s */
    var delay     = -(Math.random() * duracao);    /* delay negativo para início imediato */
    var desvio    = (Math.random() - 0.5) * 120;  /* -60px a +60px deslocamento lateral */

    p.style.cssText = [
      'left:' + esquerda + '%;',
      'width:' + tamanho + 'px;',
      'height:' + tamanho + 'px;',
      'animation-duration:' + duracao + 's;',
      'animation-delay:' + delay + 's;',
      '--desvio:' + desvio + 'px;'
    ].join('');

    container.appendChild(p);
  }
}

/* ── Inicialização ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  /* Gerar partículas de fundo */
  gerarParticulas();

  /* Iniciar cronômetro da fila com tick a cada 1000ms */
  intervaloFila = setInterval(tick, 1000);
});
