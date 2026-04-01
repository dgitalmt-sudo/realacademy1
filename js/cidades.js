/* ================================================
   CIDADES.JS — Busca de cidades com fórmula de Haversine
   Proteção de acesso via sessionStorage.
   Geolocalização via navigator.geolocation.
   Busca textual por nome de cidade/estado.
   ================================================ */

/* ── Proteção de acesso ─────────────────────────────────────────────
   Se o usuário chegar direto em cidades.html sem passar pela fila,
   redirecionar de volta para fila.html.
   ─────────────────────────────────────────────────────────────────── */
(function verificarAcesso() {
  var liberada = sessionStorage.getItem('fila_liberada');
  if (liberada !== 'true') {
    window.location.replace('fila.html');
  }
})();

/* ── Estado global ─────────────────────────────────────────────────── */
var cidadesData      = [];   /* array carregado do JSON */
var cidadeSelecionada = null; /* objeto da cidade escolhida */

/* ── Fórmula de Haversine ──────────────────────────────────────────
   Calcula a distância em km entre dois pontos geográficos.
   Parâmetros em graus decimais (latitude/longitude).
   ─────────────────────────────────────────────────────────────────── */
function haversine(lat1, lon1, lat2, lon2) {
  var R = 6371; /* Raio médio da Terra em km */
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Formatar distância legível */
function formatarDistancia(km) {
  if (km < 1)   return 'menos de 1 km';
  if (km < 10)  return 'aproximadamente ' + Math.round(km) + ' km';
  return 'aproximadamente ' + Math.round(km / 5) * 5 + ' km';
}

/* Calcular tempo estimado de viagem a 80 km/h médios */
function calcularTempoCarro(km) {
  var horas = km / 80;
  if (horas < 0.25) return 'menos de 15 minutos de carro';
  if (horas < 1) {
    return 'cerca de ' + Math.round(horas * 60) + ' minutos de carro';
  }
  var h   = Math.floor(horas);
  var min = Math.round((horas - h) * 60);
  if (min === 0) return 'cerca de ' + h + 'h de carro';
  return 'cerca de ' + h + 'h' + min + 'min de carro';
}

/* Encontrar a cidade mais próxima por coordenadas GPS */
function encontrarMaisProxima(latUser, lngUser) {
  var menorDist = Infinity;
  var maisProxima = null;

  cidadesData.forEach(function (c) {
    var dist = haversine(latUser, lngUser, c.lat, c.lng);
    if (dist < menorDist) {
      menorDist = dist;
      maisProxima = Object.assign({}, c, { distancia: dist });
    }
  });

  return maisProxima;
}

/* Buscar cidade por texto (nome) e/ou estado */
function buscarPorNome(nome, estado) {
  var nomeLower = nome.toLowerCase().trim();

  /* Filtro combinado: nome E estado (se fornecido) */
  var resultados = cidadesData.filter(function (c) {
    var cidadeLower = c.cidade.toLowerCase();
    /* correspondência parcial: digitou São Paulo → encontra "São Paulo" */
    var matchNome  = !nomeLower || cidadeLower.includes(nomeLower) || nomeLower.includes(cidadeLower.split(' ')[0].toLowerCase());
    var matchEstado= !estado  || c.estado === estado;
    return matchNome && matchEstado;
  });

  /* Se não encontrou: tentar só pelo estado */
  if (resultados.length === 0 && estado) {
    resultados = cidadesData.filter(function (c) { return c.estado === estado; });
  }

  /* Último recurso: retornar qualquer cidade */
  if (resultados.length === 0) {
    resultados = cidadesData.slice();
  }

  /* Priorizar correspondência exata no início do nome */
  resultados.sort(function (a, b) {
    var aExato = a.cidade.toLowerCase().startsWith(nomeLower) ? 0 : 1;
    var bExato = b.cidade.toLowerCase().startsWith(nomeLower) ? 0 : 1;
    return aExato - bExato;
  });

  return resultados[0] || null;
}

/* Exibir o card de resultado com animação */
function mostrarResultado(cidade, distancia, tempo) {
  cidadeSelecionada = cidade;

  document.getElementById('resultCidade').textContent = cidade.cidade;
  document.getElementById('resultEstado').textContent = cidade.estado + ' — Brasil';

  /* Informações de distância (só quando vêm de geolocalização) */
  var itemDist  = document.getElementById('resultDistanciaItem');
  var itemTempo = document.getElementById('resultTempoItem');

  if (distancia !== null && distancia !== undefined) {
    itemDist.style.display = 'flex';
    document.getElementById('resultDistanciaTexto').textContent =
      '📍 ' + formatarDistancia(distancia) + ' de distância';
    itemTempo.style.display = 'flex';
    document.getElementById('resultTempoTexto').textContent =
      '🚗 ' + tempo;
  } else {
    itemDist.style.display  = 'none';
    itemTempo.style.display = 'none';
  }

  /* Data e horário */
  document.getElementById('resultData').textContent    = '📅 Data: 14 de junho de 2026 (domingo)';
  document.getElementById('resultHorario').textContent = '⏰ Horário: ' + cidade.hora;

  /* Mostrar seção com fade */
  var section = document.getElementById('resultadoSection');
  section.classList.add('ativo');

  /* Rolar suavemente para o resultado */
  setTimeout(function () {
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/* ── Contagem regressiva de vagas restantes ──────────────────────
   Começa em 30 na primeira visita.
   Persiste o valor no localStorage: visitantes que retornam
   continuam de onde o contador parou.
   Decrementa 1 vaga a cada 5 segundos. Para em 1.
   ─────────────────────────────────────────────────────────────── */
var _vagasInterval = null;
var VAGAS_KEY = 'vagas_restantes_contador';

function iniciarContagemVagas() {
  if (_vagasInterval) clearInterval(_vagasInterval);

  var contador = document.getElementById('vagasContador');
  if (!contador) return;

  /* Recuperar valor salvo ou começar do 30 */
  var salvo = localStorage.getItem(VAGAS_KEY);
  var vagas = (salvo !== null) ? parseInt(salvo, 10) : 30;

  /* Garantir que nunca exiba 0 ou negativo */
  if (isNaN(vagas) || vagas < 1) vagas = 1;

  contador.textContent = vagas;

  /* Não iniciar intervalo se já chegou no mínimo */
  if (vagas <= 1) return;

  _vagasInterval = setInterval(function () {
    if (vagas > 1) {
      vagas--;
      contador.textContent = vagas;
      localStorage.setItem(VAGAS_KEY, vagas); /* persistir a cada tick */
    } else {
      clearInterval(_vagasInterval);
    }
  }, 5000); /* decrementa 1 vaga a cada 5 segundos */
}

/* ── Eventos de botões ─────────────────────────────────────────── */

/* Botão "Verificar Cidade Mais Próxima" */
document.getElementById('btnBuscar').addEventListener('click', function () {
  var estado = document.getElementById('selectEstado').value;
  var idade  = document.getElementById('selectIdade').value;

  /* Salvar idade informada para uso nas próximas etapas */
  if (idade) localStorage.setItem('idade_atleta_busca', idade);

  if (!estado || !idade) {
    alert('Por favor, selecione o estado e a idade do atleta.');
    return;
  }

  var cidade = buscarPorNome('', estado);
  if (cidade) {
    mostrarResultado(cidade, null, null);
  } else {
    alert('Nenhuma cidade encontrada para este estado.');
  }
});

/* Botão "Usar minha localização" */
document.getElementById('btnLocalizacao').addEventListener('click', function () {
  var btn = this;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obtendo localização...';
  btn.style.pointerEvents = 'none';

  if (!navigator.geolocation) {
    alert('Geolocalização não suportada neste navegador.');
    btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Usar minha localização atual';
    btn.style.pointerEvents = '';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    /* sucesso */
    function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      var maisProxima = encontrarMaisProxima(lat, lng);

      if (maisProxima) {
        var tempo = calcularTempoCarro(maisProxima.distancia);
        mostrarResultado(maisProxima, maisProxima.distancia, tempo);
      }

      btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Usar minha localização atual';
      btn.style.pointerEvents = '';
    },
    /* erro */
    function (err) {
      var msg = 'Não foi possível obter sua localização.';
      if (err.code === 1) msg = 'Permissão de localização negada pelo usuário.';
      if (err.code === 2) msg = 'Localização indisponível no momento.';
      if (err.code === 3) msg = 'Tempo esgotado ao obter localização.';
      alert(msg + '\n\nDigite o nome da sua cidade manualmente.');
      btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Usar minha localização atual';
      btn.style.pointerEvents = '';
    },
    { timeout: 10000, maximumAge: 60000 }
  );
});

/* Botão "Fazer Inscrição" — salvar cidade no localStorage e redirecionar */
document.getElementById('btnInscrever').addEventListener('click', function () {
  if (cidadeSelecionada) {
    localStorage.setItem('cidade_selecionada', JSON.stringify(cidadeSelecionada));
    localStorage.setItem('data_evento', cidadeSelecionada.data);
  }
  window.location.href = 'inscricao.html';
});

/* ── Carregar cidades.json ──────────────────────────────────────────
   Tenta via fetch (funciona em servidor).
   Fallback inline para abertura via file:// no navegador.
   ─────────────────────────────────────────────────────────────────── */
var CIDADES_FALLBACK = [
  { "cidade": "São Paulo",       "estado": "SP", "lat": -23.5505, "lng": -46.6333, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Rio de Janeiro",  "estado": "RJ", "lat": -22.9068, "lng": -43.1729, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Belo Horizonte",  "estado": "MG", "lat": -19.9167, "lng": -43.9345, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Salvador",        "estado": "BA", "lat": -12.9714, "lng": -38.5014, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Fortaleza",       "estado": "CE", "lat": -3.7172,  "lng": -38.5433, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Curitiba",        "estado": "PR", "lat": -25.4284, "lng": -49.2733, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Manaus",          "estado": "AM", "lat": -3.1190,  "lng": -60.0217, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Recife",          "estado": "PE", "lat": -8.0476,  "lng": -34.8770, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Porto Alegre",    "estado": "RS", "lat": -30.0346, "lng": -51.2177, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Belém",           "estado": "PA", "lat": -1.4558,  "lng": -48.5044, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Goiânia",         "estado": "GO", "lat": -16.6869, "lng": -49.2648, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Florianópolis",   "estado": "SC", "lat": -27.5954, "lng": -48.5480, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Maceió",          "estado": "AL", "lat": -9.6658,  "lng": -35.7350, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Natal",           "estado": "RN", "lat": -5.7945,  "lng": -35.2110, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Teresina",        "estado": "PI", "lat": -5.0892,  "lng": -42.8019, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Campo Grande",    "estado": "MS", "lat": -20.4697, "lng": -54.6201, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "João Pessoa",     "estado": "PB", "lat": -7.1195,  "lng": -34.8450, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Aracaju",         "estado": "SE", "lat": -10.9472, "lng": -37.0731, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Cuiabá",          "estado": "MT", "lat": -15.6014, "lng": -56.0979, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Porto Velho",     "estado": "RO", "lat": -8.7612,  "lng": -63.9004, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Macapá",          "estado": "AP", "lat": 0.0349,   "lng": -51.0694, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Rio Branco",      "estado": "AC", "lat": -9.9754,  "lng": -67.8249, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Palmas",          "estado": "TO", "lat": -10.2491, "lng": -48.3243, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "São Luís",        "estado": "MA", "lat": -2.5297,  "lng": -44.3028, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Vitória",         "estado": "ES", "lat": -20.3155, "lng": -40.3128, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Boa Vista",       "estado": "RR", "lat": 2.8235,   "lng": -60.6758, "data": "2026-06-14", "hora": "08:00" },
  { "cidade": "Brasília",        "estado": "DF", "lat": -15.7801, "lng": -47.9292, "data": "2026-06-14", "hora": "08:00" }
];

/* Tentar carregar via fetch; em caso de erro usar fallback */
fetch('data/cidades.json')
  .then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function (data) {
    cidadesData = data;
  })
  .catch(function () {
    /* file:// ou erro de rede — usar dados embutidos */
    cidadesData = CIDADES_FALLBACK;
  });
