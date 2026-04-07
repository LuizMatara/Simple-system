// Simple System - frontend
// liga a interface a API do backend

var categorias = [
  { id: 'encanador',   icone: '🔧', nome: 'Encanador' },
  { id: 'eletricista', icone: '⚡', nome: 'Eletricista' },
  { id: 'pintor',      icone: '🎨', nome: 'Pintor' },
  { id: 'veterinario', icone: '🐾', nome: 'Veterinário' },
  { id: 'carpinteiro', icone: '🪚', nome: 'Carpinteiro' },
  { id: 'jardineiro',  icone: '🌿', nome: 'Jardineiro' },
  { id: 'limpeza',     icone: '🧹', nome: 'Limpeza' },
  { id: 'serralheiro', icone: '🔩', nome: 'Serralheiro' },
];

var categoriaSelecionada = null;
var lat = null;
var lng = null;

// elementos da pagina
var grelhaCategorias = document.getElementById('grelha-categorias');
var secaoLocalizacao = document.getElementById('secao-localizacao');
var secaoResultados = document.getElementById('secao-resultados');
var botaoLocalizar = document.getElementById('botao-localizar');
var estadoLocalizacao = document.getElementById('estado-localizacao');
var infoPesquisa = document.getElementById('info-pesquisa');
var listaResultados = document.getElementById('lista-resultados');
var botaoVoltar = document.getElementById('botao-voltar');
var mensagemErro = document.getElementById('mensagem-erro');
var erroTexto = document.getElementById('erro-texto');
var botaoTentar = document.getElementById('botao-tentar');


// quando a pagina carrega
document.addEventListener('DOMContentLoaded', function() {
  montarCategorias();

  grelhaCategorias.addEventListener('click', function(e) {
    var cartao = e.target.closest('.cartao-categoria');
    if (cartao) escolherCategoria(cartao.dataset.categoria);
  });

  botaoLocalizar.addEventListener('click', usarLocalizacao);
  botaoVoltar.addEventListener('click', voltarInicio);
  botaoTentar.addEventListener('click', function() {
    mensagemErro.classList.add('escondido');
    if (categoriaSelecionada) mostrar('localizacao');
  });
});


function montarCategorias() {
  var html = '';
  for (var i = 0; i < categorias.length; i++) {
    var c = categorias[i];
    html += '<div class="cartao-categoria" data-categoria="' + c.id + '">';
    html += '<span class="categoria-icone">' + c.icone + '</span>';
    html += '<span class="categoria-nome">' + c.nome + '</span>';
    html += '</div>';
  }
  grelhaCategorias.innerHTML = html;
}


function escolherCategoria(id) {
  categoriaSelecionada = id;

  var cartoes = document.querySelectorAll('.cartao-categoria');
  for (var i = 0; i < cartoes.length; i++) {
    if (cartoes[i].dataset.categoria === id) cartoes[i].classList.add('selecionado');
    else cartoes[i].classList.remove('selecionado');
  }

  mostrar('localizacao');
}


function mostrar(secao) {
  secaoLocalizacao.classList.add('escondido');
  secaoResultados.classList.add('escondido');
  mensagemErro.classList.add('escondido');

  if (secao === 'localizacao') {
    secaoLocalizacao.classList.remove('escondido');
    botaoLocalizar.classList.remove('escondido');
    estadoLocalizacao.classList.add('escondido');
    secaoLocalizacao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (secao === 'resultados') {
    secaoResultados.classList.remove('escondido');
    secaoResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


function voltarInicio() {
  categoriaSelecionada = null;
  lat = null;
  lng = null;

  var cartoes = document.querySelectorAll('.cartao-categoria');
  for (var i = 0; i < cartoes.length; i++) cartoes[i].classList.remove('selecionado');

  secaoLocalizacao.classList.add('escondido');
  secaoResultados.classList.add('escondido');
  mensagemErro.classList.add('escondido');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// usa a localizacao da INTEP Condeixa como ponto fixo
function usarLocalizacao() {
  lat = 40.1020;
  lng = -8.4940;
  pesquisar();
}


function pesquisar() {
  var url = '/profissionais?categoria=' + categoriaSelecionada + '&lat=' + lat + '&lng=' + lng;

  fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(dados) {
      if (!dados.sucesso) throw new Error(dados.erro);
      mostrarResultados(dados);
    })
    .catch(function(err) {
      console.error(err);
      mostrarErro('Nao foi possivel encontrar profissionais. Verifica a ligação.');
    });
}


function mostrarResultados(dados) {
  var profs = dados.profissionais;
  var catInfo = null;
  for (var i = 0; i < categorias.length; i++) {
    if (categorias[i].id === dados.categoria) catInfo = categorias[i];
  }
  if (!catInfo) catInfo = { nome: dados.categoria, icone: '🔧' };

  if (dados.total === 0) {
    infoPesquisa.innerHTML = 'Nenhum profissional de <strong>' + catInfo.nome + '</strong> encontrado.';
  } else {
    infoPesquisa.innerHTML = catInfo.icone + ' Encontrámos <strong>' + dados.total + '</strong> profissional(is) de <strong>' + catInfo.nome + '</strong> perto de si.';
  }

  if (profs.length === 0) {
    listaResultados.innerHTML = '<div style="text-align:center;padding:40px;color:#5a6b7d;"><p style="font-size:48px">😔</p><p>Nenhum resultado.</p></div>';
  } else {
    var html = '';
    for (var i = 0; i < profs.length; i++) {
      html += criarCartao(profs[i]);
    }
    listaResultados.innerHTML = html;
  }

  mostrar('resultados');
}


function criarCartao(prof) {
  var dist = '';
  if (prof.distancia_km != null) {
    if (prof.distancia_km < 1) dist = '📍 ' + Math.round(prof.distancia_km * 1000) + ' metros';
    else dist = '📍 ' + prof.distancia_km.toFixed(1) + ' km';
  }

  return '<div class="cartao-profissional">' +
    '<div class="profissional-cabecalho">' +
      '<span class="profissional-nome">' + prof.nome + '</span>' +
      '<span class="profissional-avaliacao">⭐ ' + prof.avaliacao.toFixed(1) + '</span>' +
    '</div>' +
    '<p class="profissional-descricao">' + prof.descricao + '</p>' +
    (dist ? '<p class="profissional-distancia">' + dist + '</p>' : '') +
    '<div class="botoes-contacto">' +
      '<a href="tel:' + prof.telefone + '" class="botao-contacto botao-telefone">' +
        '<span class="botao-contacto-icone">📞</span> Ligar</a>' +
      '<a href="https://wa.me/' + prof.whatsapp + '" target="_blank" class="botao-contacto botao-whatsapp">' +
        '<span class="botao-contacto-icone">💬</span> WhatsApp</a>' +
    '</div>' +
  '</div>';
}


function mostrarErro(msg) {
  erroTexto.textContent = msg;
  mensagemErro.classList.remove('escondido');
  estadoLocalizacao.classList.add('escondido');
}
