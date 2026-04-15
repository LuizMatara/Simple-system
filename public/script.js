// script.js - logica principal do Simple System
// controla: pesquisa, sugestoes, mapa, perfis e avaliacoes

// verificar se o utilizador fez login
// se nao fez, redireciona para a pagina de login
if (!sessionStorage.getItem('logado')) {
  window.location.href = '/login.html';
}

// buscar dados da sessao
var tipoUser = sessionStorage.getItem('tipo');
var nomeUser = sessionStorage.getItem('nome');

// lista de categorias com icones do Bootstrap Icons
// cada categoria tem um id (para a API), icone e nome visivel
var categorias = [
  { id: 'encanador',    icone: 'bi-wrench',       nome: 'Encanador' },
  { id: 'eletricista',  icone: 'bi-lightning',     nome: 'Eletricista' },
  { id: 'pintor',       icone: 'bi-palette',       nome: 'Pintor' },
  { id: 'veterinario',  icone: 'bi-heart-pulse',   nome: 'Veterinario' },
  { id: 'carpinteiro',  icone: 'bi-hammer',        nome: 'Carpinteiro' },
  { id: 'jardineiro',   icone: 'bi-tree',          nome: 'Jardineiro' },
  { id: 'limpeza',      icone: 'bi-droplet',       nome: 'Limpeza' },
  { id: 'serralheiro',  icone: 'bi-gear',          nome: 'Serralheiro' },
  { id: 'mecanico',     icone: 'bi-car-front',     nome: 'Mecanico' },
  { id: 'pedreiro',     icone: 'bi-bricks',        nome: 'Pedreiro' },
  { id: 'explicador',   icone: 'bi-book',          nome: 'Explicador' },
  { id: 'cabeleireiro', icone: 'bi-scissors',      nome: 'Cabeleireiro' },
  { id: 'costureira',   icone: 'bi-scissors',      nome: 'Costureira' },
  { id: 'mudancas',     icone: 'bi-box-seam',      nome: 'Mudancas' },
  { id: 'informatica',  icone: 'bi-laptop',        nome: 'Informatica' },
];

// variaveis do mapa
var mapa = null;
var marcadores = [];

// coordenadas da INTEP - Quinta Nova, Rua de Tomar, Condeixa-a-Velha
// confirmadas no site codigo-postal.pt: 40.110355, -8.495044
var minhaLat = 40.110355;
var minhaLng = -8.495044;

// nota selecionada no modal de avaliacao (0 a 5)
var notaSelecionada = 0;

// avaliacoes guardadas em memoria durante a sessao
// formato: { profissionalId: [ {nota, comentario, autor, data}, ... ] }
var avaliacoes = {};

// guardar os profissionais da ultima pesquisa para aceder nos modais
var ultimosProfissionais = [];

// buscar elementos da pagina
var campoPesquisa = document.getElementById('campo-pesquisa');
var sugestoesLista = document.getElementById('sugestoes-lista');
var secaoHome = document.getElementById('secao-home');
var secaoResultados = document.getElementById('secao-resultados');
var infoPesquisa = document.getElementById('info-pesquisa');
var listaResultados = document.getElementById('lista-resultados');
var botaoVoltar = document.getElementById('botao-voltar');
var mensagemErro = document.getElementById('mensagem-erro');
var erroTexto = document.getElementById('erro-texto');
var botaoSair = document.getElementById('botao-sair');
var destaquesLista = document.getElementById('destaques-lista');


// quando a pagina carrega, configurar tudo
document.addEventListener('DOMContentLoaded', function() {

  // mostrar nome do utilizador na navbar
  var nomeSpan = document.getElementById('nome-user');
  if (nomeSpan) nomeSpan.textContent = nomeUser || '';

  // se for admin, mostrar o link para o painel
  if (tipoUser === 'admin') {
    var la = document.getElementById('link-admin');
    if (la) la.classList.remove('d-none');
  }

  // carregar os profissionais em destaque na pagina inicial
  carregarDestaques();

  // PESQUISA: ao escrever, mostrar sugestoes
  campoPesquisa.addEventListener('input', function() {
    var t = this.value.toLowerCase().trim();
    if (t === '') { sugestoesLista.classList.add('d-none'); return; }
    mostrarSugestoes(t);
  });

  // ao focar na pesquisa, mostrar sugestoes se ja tem texto
  campoPesquisa.addEventListener('focus', function() {
    if (this.value.trim() !== '') mostrarSugestoes(this.value.toLowerCase().trim());
  });

  // fechar sugestoes ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.position-relative')) sugestoesLista.classList.add('d-none');
  });

  // ao carregar Enter, selecionar a primeira sugestao
  campoPesquisa.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var p = sugestoesLista.querySelector('.sugestao-item');
      if (p) p.click();
    }
  });

  // ao clicar numa sugestao, pesquisar essa categoria
  sugestoesLista.addEventListener('click', function(e) {
    var item = e.target.closest('.sugestao-item');
    if (item) {
      campoPesquisa.value = '';
      sugestoesLista.classList.add('d-none');
      pesquisar(item.dataset.categoria);
    }
  });

  // botao voltar - volta para a pagina inicial
  botaoVoltar.addEventListener('click', voltarInicio);

  // botao tentar novamente no erro
  document.getElementById('botao-tentar').addEventListener('click', function() {
    mensagemErro.classList.add('d-none');
  });

  // botao sair - limpa sessao e vai para login
  botaoSair.addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = '/login.html';
  });

  // ESTRELAS: configurar hover e click no modal de avaliacao
  var estrelaBtns = document.querySelectorAll('.estrela-btn');
  for (var i = 0; i < estrelaBtns.length; i++) {
    // ao clicar numa estrela, selecionar a nota
    estrelaBtns[i].addEventListener('click', function() {
      notaSelecionada = parseInt(this.dataset.valor);
      document.getElementById('nota-texto').textContent = notaSelecionada + '/5';
      pintarEstrelas(notaSelecionada);
    });
    // ao passar o rato, preview da nota
    estrelaBtns[i].addEventListener('mouseenter', function() {
      pintarEstrelas(parseInt(this.dataset.valor));
    });
    // ao sair, voltar para a nota selecionada
    estrelaBtns[i].addEventListener('mouseleave', function() {
      pintarEstrelas(notaSelecionada);
    });
  }

  // botao de enviar avaliacao
  document.getElementById('botao-enviar-avaliacao').addEventListener('click', enviarAvaliacao);
});


// pintar as estrelas ate ao numero n (preencher/vazio)
function pintarEstrelas(n) {
  var btns = document.querySelectorAll('.estrela-btn');
  for (var i = 0; i < btns.length; i++) {
    if (i < n) {
      btns[i].classList.remove('bi-star');
      btns[i].classList.add('bi-star-fill', 'ativa');
    } else {
      btns[i].classList.remove('bi-star-fill', 'ativa');
      btns[i].classList.add('bi-star');
    }
  }
}


// mostrar sugestoes de categorias que correspondem ao texto escrito
function mostrarSugestoes(texto) {
  var res = [];
  for (var i = 0; i < categorias.length; i++) {
    var c = categorias[i];
    // procurar no nome ou no id da categoria
    if (c.nome.toLowerCase().indexOf(texto) !== -1 || c.id.indexOf(texto) !== -1) {
      res.push(c);
    }
  }

  // se nao encontrou nenhuma
  if (res.length === 0) {
    sugestoesLista.innerHTML = '<div class="sugestao-item" style="cursor:default;color:var(--cinza)">Nenhum servico encontrado</div>';
    sugestoesLista.classList.remove('d-none');
    return;
  }

  // criar o html das sugestoes
  var html = '';
  for (var i = 0; i < res.length; i++) {
    var r = res[i];
    html += '<div class="sugestao-item" data-categoria="' + r.id + '">';
    html += '<span class="sugestao-icone"><i class="bi ' + r.icone + '"></i></span>';
    html += '<div><div class="sugestao-nome">' + r.nome + '</div>';
    html += '<div class="sugestao-sub">Profissionais em Condeixa</div></div></div>';
  }
  sugestoesLista.innerHTML = html;
  sugestoesLista.classList.remove('d-none');
}


// carregar os profissionais mais bem avaliados para a pagina inicial
function carregarDestaques() {
  // buscar 6 categorias diferentes
  var cats = ['encanador','eletricista','pintor','mecanico','informatica','cabeleireiro'];
  var pedidos = [];

  // fazer um fetch para cada categoria
  for (var i = 0; i < cats.length; i++) {
    pedidos.push(
      fetch('/profissionais?categoria=' + cats[i] + '&lat=' + minhaLat + '&lng=' + minhaLng)
        .then(function(r) { return r.json(); })
    );
  }

  // quando todos os pedidos terminarem
  Promise.all(pedidos).then(function(resps) {
    var todos = [];
    for (var i = 0; i < resps.length; i++) {
      if (resps[i].sucesso && resps[i].profissionais.length > 0) {
        // ordenar por avaliacao e pegar os 2 melhores de cada
        var profs = resps[i].profissionais.slice();
        profs.sort(function(a, b) { return b.avaliacao - a.avaliacao; });
        todos.push(profs[0]);
        if (profs[1]) todos.push(profs[1]);
      }
    }

    // ordenar todos por avaliacao e pegar os 6 melhores
    todos.sort(function(a, b) { return b.avaliacao - a.avaliacao; });
    var top = todos.slice(0, 6);

    // criar os cartoes de destaque
    var html = '';
    for (var i = 0; i < top.length; i++) {
      var p = top[i];
      var est = gerarEstrelasHTML(p.avaliacao);
      var dist = formatarDistancia(p.distancia_km);
      var catInfo = buscarCategoria(p.categoria);

      html += '<div class="col-12 col-sm-6 col-md-4"><div class="destaque-card" data-categoria="' + p.categoria + '">';
      html += '<div class="destaque-topo"><span class="destaque-nome">' + p.nome + '</span><span class="destaque-nota">' + p.avaliacao.toFixed(1) + '</span></div>';
      html += '<span class="destaque-cat"><i class="bi ' + catInfo.icone + ' me-1"></i>' + catInfo.nome + '</span>';
      html += '<p class="destaque-desc">' + p.descricao + '</p>';
      html += '<div class="d-flex justify-content-between align-items-center"><span class="estrelas-small">' + est + '</span><span class="destaque-dist"><i class="bi bi-geo-alt me-1"></i>' + dist + '</span></div>';
      html += '</div></div>';
    }
    destaquesLista.innerHTML = html;

    // ao clicar num destaque, pesquisar a categoria
    destaquesLista.addEventListener('click', function(e) {
      var card = e.target.closest('.destaque-card');
      if (card) pesquisar(card.dataset.categoria);
    });
  });
}


// gerar HTML das estrelas (preenchidas, meia, vazias)
function gerarEstrelasHTML(nota) {
  var s = '';
  for (var i = 0; i < Math.floor(nota); i++) s += '<i class="bi bi-star-fill"></i>';
  if (nota % 1 >= 0.5) s += '<i class="bi bi-star-half"></i>';
  var total = Math.floor(nota) + (nota % 1 >= 0.5 ? 1 : 0);
  for (var i = 0; i < 5 - total; i++) s += '<i class="bi bi-star"></i>';
  return s;
}


// formatar distancia em metros ou km
function formatarDistancia(km) {
  if (km == null) return '';
  if (km < 1) return Math.round(km * 1000) + 'm';
  return km.toFixed(1) + 'km';
}


// buscar info da categoria pelo id
function buscarCategoria(id) {
  for (var i = 0; i < categorias.length; i++) {
    if (categorias[i].id === id) return categorias[i];
  }
  return { id: id, icone: 'bi-circle', nome: id };
}


// voltar para a pagina inicial
function voltarInicio() {
  secaoResultados.classList.add('d-none');
  secaoHome.classList.remove('d-none');
  campoPesquisa.value = '';
  if (mapa) { mapa.remove(); mapa = null; }
  marcadores = [];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// pesquisar profissionais na API
function pesquisar(catId) {
  // fazer pedido ao servidor com a categoria e as coordenadas da INTEP
  fetch('/profissionais?categoria=' + catId + '&lat=' + minhaLat + '&lng=' + minhaLng)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.sucesso) throw new Error(d.erro);
      mostrarResultados(d);
    })
    .catch(function() {
      erroTexto.textContent = 'Erro ao carregar.';
      mensagemErro.classList.remove('d-none');
    });
}


// mostrar os resultados da pesquisa
function mostrarResultados(dados) {
  var profs = dados.profissionais;
  ultimosProfissionais = profs; // guardar para usar nos modais
  var catInfo = buscarCategoria(dados.categoria);

  // esconder home e mostrar resultados
  secaoHome.classList.add('d-none');
  secaoResultados.classList.remove('d-none');

  // info da pesquisa
  infoPesquisa.innerHTML = '<strong>' + profs.length + '</strong> profissional(is) de <strong><i class="bi ' + catInfo.icone + ' me-1"></i>' + catInfo.nome + '</strong>';

  // montar o mapa com marcadores
  montarMapa(profs);

  // criar a lista de cartoes
  var html = '';
  if (profs.length === 0) {
    html = '<div class="text-center py-5 text-muted"><p class="h5">Nenhum profissional encontrado</p></div>';
  } else {
    for (var i = 0; i < profs.length; i++) {
      html += criarCartao(profs[i], i);
    }
  }
  listaResultados.innerHTML = html;

  // ao clicar num cartao, abrir o perfil
  var cartoes = listaResultados.querySelectorAll('.cartao-profissional');
  for (var i = 0; i < cartoes.length; i++) {
    cartoes[i].addEventListener('click', function() {
      var idx = parseInt(this.dataset.indice);
      abrirPerfil(ultimosProfissionais[idx]);
    });
  }

  secaoResultados.scrollIntoView({ behavior: 'smooth' });
}


// montar o mapa leaflet com marcadores
function montarMapa(profs) {
  // se ja existe mapa, remover
  if (mapa) { mapa.remove(); mapa = null; }
  marcadores = [];

  // criar mapa centrado na INTEP
  mapa = L.map('mapa').setView([minhaLat, minhaLng], 15);

  // tiles do OpenStreetMap (gratuito)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);

  // marcador da INTEP (vermelho)
  L.marker([minhaLat, minhaLng], {
    icon: L.divIcon({
      className: '',
      html: '<div style="background:#c0392b;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><i class="bi bi-geo-alt-fill"></i></div>',
      iconSize: [32,32], iconAnchor: [16,16]
    })
  }).addTo(mapa).bindPopup('<strong>INTEP Condeixa</strong><br><small>Quinta Nova, Rua de Tomar</small>');

  // marcadores dos profissionais (azul com numero)
  for (var i = 0; i < profs.length; i++) {
    var p = profs[i];
    var m = L.marker([p.latitude, p.longitude], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#1a5f7a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer">' + (i+1) + '</div>',
        iconSize: [28,28], iconAnchor: [14,14]
      })
    }).addTo(mapa);

    // ao clicar no marcador, abrir o perfil do profissional
    // usamos uma closure para manter a referencia ao profissional correto
    (function(prof) {
      m.on('click', function() {
        abrirPerfil(prof);
      });
    })(p);

    marcadores.push(m);
  }

  // ajustar zoom para mostrar todos os pontos
  if (profs.length > 0) {
    var pts = [[minhaLat, minhaLng]];
    for (var i = 0; i < profs.length; i++) pts.push([profs[i].latitude, profs[i].longitude]);
    mapa.fitBounds(pts, { padding: [30, 30] });
  }
}


// criar o HTML de um cartao de profissional na lista
function criarCartao(prof, idx) {
  var dist = formatarDistancia(prof.distancia_km);
  var numAv = avaliacoes[prof.id] ? avaliacoes[prof.id].length : 0;

  return '<div class="cartao-profissional" data-indice="' + idx + '">' +
    '<div class="prof-topo">' +
      '<span class="prof-nome">' + prof.nome + '</span>' +
      '<span class="prof-nota">' + prof.avaliacao.toFixed(1) + '</span>' +
    '</div>' +
    '<p class="prof-desc">' + prof.descricao + '</p>' +
    (dist ? '<p class="prof-dist"><i class="bi bi-geo-alt me-1"></i>' + dist + '</p>' : '') +
    '<small class="text-muted"><i class="bi bi-chat-left-text me-1"></i>' + numAv + ' avaliacao(es) — clique para ver perfil</small>' +
  '</div>';
}


// abrir o modal de perfil de um profissional
// chamado ao clicar num marcador do mapa ou num cartao da lista
function abrirPerfil(prof) {
  var catInfo = buscarCategoria(prof.categoria);
  var dist = formatarDistancia(prof.distancia_km);

  // preencher dados no modal
  document.getElementById('perfil-nome').textContent = prof.nome;
  document.getElementById('perfil-categoria').innerHTML = '<i class="bi ' + catInfo.icone + ' me-1"></i>' + catInfo.nome;
  document.getElementById('perfil-nota').textContent = prof.avaliacao.toFixed(1) + ' / 5.0';
  document.getElementById('perfil-descricao').textContent = prof.descricao;
  document.getElementById('perfil-distancia').innerHTML = dist ? '<i class="bi bi-geo-alt me-1"></i>' + dist + ' de si' : '';

  // configurar botoes de contacto
  document.getElementById('perfil-btn-tel').href = 'tel:' + prof.telefone;
  document.getElementById('perfil-btn-wpp').href = 'https://wa.me/' + prof.whatsapp;

  // guardar id do profissional para a avaliacao
  document.getElementById('perfil-btn-tel').dataset.profId = prof.id;

  // limpar formulario de avaliacao
  notaSelecionada = 0;
  pintarEstrelas(0);
  document.getElementById('nota-texto').textContent = '';
  document.getElementById('perfil-comentario').value = '';
  document.getElementById('avaliar-msg').classList.add('d-none');

  // guardar o profissional atual para o envio da avaliacao
  window.perfilAtual = prof;

  // mostrar avaliacoes existentes
  mostrarAvaliacoes(prof.id);

  // abrir o modal
  var modal = new bootstrap.Modal(document.getElementById('modalPerfil'));
  modal.show();
}


// mostrar a lista de avaliacoes de um profissional
function mostrarAvaliacoes(profId) {
  var listaAv = document.getElementById('lista-avaliacoes');
  var avs = avaliacoes[profId] || [];

  if (avs.length === 0) {
    listaAv.innerHTML = '<p class="text-muted small text-center">Sem avaliacoes ainda. Seja o primeiro a avaliar.</p>';
    return;
  }

  var html = '';
  // mostrar da mais recente para a mais antiga
  for (var i = avs.length - 1; i >= 0; i--) {
    var a = avs[i];
    // gerar estrelas da avaliacao
    var est = '';
    for (var j = 0; j < a.nota; j++) est += '<i class="bi bi-star-fill" style="color:#d4a017"></i>';
    for (var j = a.nota; j < 5; j++) est += '<i class="bi bi-star" style="color:#ddd"></i>';

    html += '<div class="avaliacao-item">';
    html += '<div class="d-flex justify-content-between align-items-center mb-1">';
    html += '<small class="fw-bold">' + a.autor + '</small>';
    html += '<small>' + est + '</small>';
    html += '</div>';
    if (a.comentario) html += '<small class="text-muted">' + a.comentario + '</small>';
    html += '<div class="text-end"><small class="text-muted" style="font-size:10px">' + a.data + '</small></div>';
    html += '</div>';
  }
  listaAv.innerHTML = html;
}


// enviar uma avaliacao
function enviarAvaliacao() {
  var comentario = document.getElementById('perfil-comentario').value.trim();
  var msgDiv = document.getElementById('avaliar-msg');
  var prof = window.perfilAtual;

  // verificar se selecionou uma nota
  if (notaSelecionada === 0) {
    msgDiv.className = 'alert alert-warning small mt-2';
    msgDiv.textContent = 'Selecione uma nota.';
    msgDiv.classList.remove('d-none');
    return;
  }

  // criar a avaliacao
  if (!avaliacoes[prof.id]) avaliacoes[prof.id] = [];
  avaliacoes[prof.id].push({
    nota: notaSelecionada,
    comentario: comentario,
    autor: nomeUser || 'Anonimo',
    data: new Date().toLocaleDateString('pt-PT')
  });

  // mostrar sucesso
  msgDiv.className = 'alert alert-success small mt-2';
  msgDiv.textContent = 'Avaliacao enviada!';
  msgDiv.classList.remove('d-none');

  // limpar formulario
  notaSelecionada = 0;
  pintarEstrelas(0);
  document.getElementById('nota-texto').textContent = '';
  document.getElementById('perfil-comentario').value = '';

  // atualizar a lista de avaliacoes no modal
  mostrarAvaliacoes(prof.id);
}
