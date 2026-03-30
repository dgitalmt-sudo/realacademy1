/* ================================================
   PROTEÇÃO ANTI-CLONAGEM — Real Academy Brasil
   Domínio autorizado: realacademybrazil.online
   © Real Academy Brasil — Todos os direitos reservados
   ================================================ */

(function () {
  'use strict';

  /* ── 1. VERIFICAÇÃO DE DOMÍNIO ─────────────────────────────────── */
  var DOMINIOS_AUTORIZADOS = [
    'realacademybrazil.online',
    'www.realacademybrazil.online'
  ];

  var host = window.location.hostname.toLowerCase();
  var isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';

  if (!isLocalhost && DOMINIOS_AUTORIZADOS.indexOf(host) === -1) {
    /* Domínio não autorizado: apaga conteúdo e redireciona */
    document.documentElement.innerHTML =
      '<body style="background:#000;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">' +
      '<p style="color:#fff;font-family:sans-serif;text-align:center;font-size:1rem;">' +
      'Acesso não autorizado.<br>Redirecionando...' +
      '</p></body>';
    setTimeout(function () {
      window.location.replace('https://realacademybrazil.online');
    }, 1500);
    return;
  }

  /* ── 2. PROTEÇÃO CONTRA IFRAME (clickjacking) ──────────────────── */
  if (window.self !== window.top) {
    window.top.location.replace(window.self.location.href);
  }

  /* ── 3. BLOQUEAR ATALHOS DE INSPECIONAR / SALVAR CÓDIGO ────────── */
  document.addEventListener('keydown', function (e) {
    /* F12 */
    if (e.key === 'F12') { e.preventDefault(); return false; }

    var ctrl = e.ctrlKey || e.metaKey;

    /* Ctrl+U (ver fonte), Ctrl+S (salvar), Ctrl+Shift+I/J/C (devtools) */
    if (ctrl && (
      e.key === 'u' || e.key === 'U' ||
      e.key === 's' || e.key === 'S' ||
      (e.shiftKey && (e.key === 'I' || e.key === 'i' ||
                      e.key === 'J' || e.key === 'j' ||
                      e.key === 'C' || e.key === 'c'))
    )) {
      e.preventDefault();
      return false;
    }
  });

  /* ── 4. BLOQUEAR MENU DE CONTEXTO (botão direito) ──────────────── */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  /* ── 5. BLOQUEAR SELEÇÃO E ARRASTAR IMAGENS ────────────────────── */
  document.addEventListener('selectstart', function (e) {
    /* Permitir seleção apenas em inputs e textareas */
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });

  /* ── 6. DETECÇÃO DE DEVTOOLS ABERTOS ───────────────────────────── */
  var devtoolsAberto = false;
  var limiar = 160;

  function verificarDevtools() {
    var diferenca = window.outerWidth - window.innerWidth > limiar ||
                    window.outerHeight - window.innerHeight > limiar;
    if (diferenca && !devtoolsAberto) {
      devtoolsAberto = true;
      /* Limpa o console ao abrir devtools */
      console.clear();
      console.log('%c⛔ Acesso Restrito', 'color:red;font-size:1.4rem;font-weight:bold;');
      console.log('%cEste site é protegido por lei de direitos autorais.', 'color:#333;font-size:0.9rem;');
    } else if (!diferenca) {
      devtoolsAberto = false;
    }
  }

  setInterval(verificarDevtools, 1000);

  /* ── 7. MARCA D'ÁGUA NO CONSOLE (assinatura do criador) ─────────── */
  var estiloTitulo = [
    'background: #001489',
    'color: #C8A84B',
    'font-size: 1.2rem',
    'font-weight: bold',
    'padding: 8px 20px',
    'border-radius: 4px'
  ].join(';');

  var estiloInfo = [
    'color: #001489',
    'font-size: 0.85rem',
    'padding: 2px 0'
  ].join(';');

  console.log('%c REAL ACADEMY BRASIL ', estiloTitulo);
  console.log('%c© ' + new Date().getFullYear() + ' Real Academy Brasil — Todos os direitos reservados.', estiloInfo);
  console.log('%cDomínio autorizado: realacademybrazil.online', estiloInfo);
  console.log('%cReprodução, cópia ou distribuição não autorizada é crime (Lei 9.610/98).', estiloInfo);

  /* ── 8. META AUTOR INJETADO DINAMICAMENTE ──────────────────────── */
  var metaAutor = document.createElement('meta');
  metaAutor.name = 'author';
  metaAutor.content = 'Real Academy Brasil — realacademybrazil.online';
  document.head.appendChild(metaAutor);

  var metaCopy = document.createElement('meta');
  metaCopy.name = 'copyright';
  metaCopy.content = '© ' + new Date().getFullYear() + ' Real Academy Brasil. Todos os direitos reservados.';
  document.head.appendChild(metaCopy);

})();
