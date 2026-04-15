// admin.js - painel de administracao
// so acessivel por utilizadores com tipo "admin"

// verificar se e admin - se nao for, volta para o login
if (!sessionStorage.getItem('logado') || sessionStorage.getItem('tipo') !== 'admin') {
  window.location.href = '/login.html';
}

// elementos da pagina
var tabelaProf = document.getElementById('tabela-profissionais');
var totalBadge = document.getElementById('total-badge');
var estatisticas = document.getElementById('estatisticas');
var botaoAdicionar = document.getElementById('botao-adicionar');
var msgSucesso = document.getElementById('msg-sucesso');
var msgErro = document.getElementById('msg-erro-form');

document.addEventListener('DOMContentLoaded', function() {
  // carregar dados ao abrir a pagina
  carregarDados();

  // botao de adicionar profissional
  botaoAdicionar.addEventListener('click', adicionarProfissional);

  // botao sair
  document.getElementById('botao-sair-admin').addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = '/login.html';
  });
});


// carregar estatisticas e tabela
function carregarDados() {
  // buscar categorias com totais na API
  fetch('/categorias').then(function(r) { return r.json(); }).then(function(d) {
    if (!d.sucesso) return;
    var total = 0, html = '';
    var cores = ['primary','success','info','warning','danger','secondary'];

    // criar um cartao para cada categoria
    for (var i = 0; i < d.categorias.length; i++) {
      var c = d.categorias[i];
      total += c.total;
      html += '<div class="col-6 col-md-3"><div class="card text-center border-0 shadow-sm"><div class="card-body py-2"><h5 class="fw-bold text-' + cores[i%cores.length] + ' mb-0">' + c.total + '</h5><small class="text-muted" style="font-size:11px">' + c.categoria + '</small></div></div></div>';
    }

    // cartao de total no inicio
    var totalHtml = '<div class="col-6 col-md-3"><div class="card text-center border-0 shadow-sm" style="background:var(--azul);color:white"><div class="card-body py-2"><h5 class="fw-bold mb-0">' + total + '</h5><small>Total</small></div></div></div>';
    estatisticas.innerHTML = totalHtml + html;
  });

  // carregar tabela com todos os profissionais
  carregarTabela();
}


// buscar todos os profissionais e mostrar na tabela
function carregarTabela() {
  var cats = ['encanador','eletricista','pintor','veterinario','carpinteiro','jardineiro','limpeza','serralheiro','mecanico','pedreiro','explicador','cabeleireiro','costureira','mudancas','informatica'];
  var pedidos = [];

  // fazer fetch para cada categoria
  for (var i = 0; i < cats.length; i++) {
    pedidos.push(fetch('/profissionais?categoria=' + cats[i]).then(function(r) { return r.json(); }));
  }

  // juntar tudo e mostrar na tabela
  Promise.all(pedidos).then(function(resps) {
    var todos = [];
    for (var i = 0; i < resps.length; i++) {
      if (resps[i].sucesso) {
        for (var j = 0; j < resps[i].profissionais.length; j++) {
          todos.push(resps[i].profissionais[j]);
        }
      }
    }

    // ordenar por nome
    todos.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
    totalBadge.textContent = todos.length;

    var html = '';
    for (var i = 0; i < todos.length; i++) {
      var p = todos[i];
      html += '<tr><td class="fw-bold small">' + p.nome + '</td><td><span class="badge bg-secondary">' + p.categoria + '</span></td><td class="small">' + p.telefone + '</td><td class="small">' + p.avaliacao.toFixed(1) + '</td><td class="small text-muted">' + (p.descricao||'-') + '</td></tr>';
    }
    tabelaProf.innerHTML = html;
  });
}


// adicionar novo profissional via API POST
function adicionarProfissional() {
  msgSucesso.classList.add('d-none');
  msgErro.classList.add('d-none');

  // ler valores do formulario
  var nome = document.getElementById('f-nome').value.trim();
  var cat = document.getElementById('f-categoria').value;
  var tel = document.getElementById('f-telefone').value.trim();
  var wpp = document.getElementById('f-whatsapp').value.trim();

  // validar campos obrigatorios
  if (!nome || !cat || !tel || !wpp) {
    msgErro.textContent = 'Preencha os campos obrigatorios.';
    msgErro.classList.remove('d-none');
    return;
  }

  // enviar para a API
  fetch('/profissionais', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome,
      categoria: cat,
      telefone: tel,
      whatsapp: wpp,
      latitude: parseFloat(document.getElementById('f-lat').value),
      longitude: parseFloat(document.getElementById('f-lng').value),
      avaliacao: parseFloat(document.getElementById('f-avaliacao').value),
      descricao: document.getElementById('f-descricao').value.trim()
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(resp) {
    if (resp.sucesso) {
      msgSucesso.textContent = '"' + nome + '" adicionado com sucesso.';
      msgSucesso.classList.remove('d-none');
      // limpar formulario
      document.getElementById('f-nome').value = '';
      document.getElementById('f-categoria').value = '';
      document.getElementById('f-telefone').value = '';
      document.getElementById('f-whatsapp').value = '';
      document.getElementById('f-descricao').value = '';
      // recarregar dados
      carregarDados();
    } else {
      msgErro.textContent = resp.erro;
      msgErro.classList.remove('d-none');
    }
  })
  .catch(function() {
    msgErro.textContent = 'Erro de ligacao ao servidor.';
    msgErro.classList.remove('d-none');
  });
}
