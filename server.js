// server.js - servidor do Simple System
// corre em Node.js sem dependencias externas
// serve os ficheiros do site e responde a API REST

var http = require('http');  // modulo para criar servidor HTTP
var fs = require('fs');      // modulo para ler/escrever ficheiros
var path = require('path');  // modulo para caminhos de ficheiros
var url = require('url');    // modulo para interpretar URLs

var PORTA = 3000;
var PUBLIC = path.join(__dirname, 'public');

// tipos de ficheiro que o servidor sabe servir
var mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// carregar a base de dados (ficheiro JSON)
var db = { profissionais: [] };
try {
  db = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados.json'), 'utf-8'));
} catch (e) {
  console.log('Aviso: dados.json nao encontrado. Corre "node init-db.js" primeiro.');
}


// formula de haversine - calcula a distancia entre 2 pontos na terra
// recebe latitudes e longitudes, devolve distancia em km
function haversine(lat1, lon1, lat2, lon2) {
  var R = 6371; // raio da terra em km
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// enviar resposta em JSON ao browser
function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}


// ler o corpo de um pedido POST
function lerBody(req) {
  return new Promise(function(resolve, reject) {
    var b = '';
    req.on('data', function(c) { b += c; });
    req.on('end', function() {
      try { resolve(JSON.parse(b)); }
      catch(e) { reject(e); }
    });
  });
}


// servir um ficheiro estatico (html, css, js, imagens)
function servirFicheiro(res, fp) {
  var ext = path.extname(fp);
  var mime = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(fp, function(err, data) {
    if (err) { res.writeHead(404); res.end('Nao encontrado'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}


// criar o servidor HTTP
var server = http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);
  var rota = parsed.pathname;    // ex: /profissionais
  var params = parsed.query;     // ex: { categoria: 'encanador', lat: '40.11' }

  // CORS - permitir pedidos de outros dominios (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // rota / redireciona para o login
  if (rota === '/') {
    res.writeHead(302, { 'Location': '/login.html' });
    return res.end();
  }

  // GET /saude - verificar se o servidor esta ativo
  if (rota === '/saude') {
    return json(res, 200, { estado: 'ativo', profissionais: db.profissionais.length });
  }

  // GET /categorias - listar categorias com totais
  if (rota === '/categorias') {
    var cont = {};
    for (var i = 0; i < db.profissionais.length; i++) {
      var c = db.profissionais[i].categoria;
      cont[c] = (cont[c] || 0) + 1;
    }
    var lista = [];
    for (var k in cont) lista.push({ categoria: k, total: cont[k] });
    return json(res, 200, { sucesso: true, categorias: lista });
  }

  // GET /profissionais?categoria=X&lat=Y&lng=Z
  // filtra por categoria, calcula distancia, ordena por proximidade
  if (rota === '/profissionais' && req.method === 'GET') {
    var cat = params.categoria;
    if (!cat) return json(res, 400, { sucesso: false, erro: 'Categoria obrigatoria' });

    // filtrar profissionais pela categoria pedida
    var resultado = [];
    for (var i = 0; i < db.profissionais.length; i++) {
      if (db.profissionais[i].categoria.toLowerCase() === cat.toLowerCase()) {
        // copiar para nao alterar o original
        resultado.push(JSON.parse(JSON.stringify(db.profissionais[i])));
      }
    }

    // se o utilizador enviou coordenadas, calcular distancia
    var lat = parseFloat(params.lat);
    var lng = parseFloat(params.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      for (var i = 0; i < resultado.length; i++) {
        resultado[i].distancia_km = Math.round(
          haversine(lat, lng, resultado[i].latitude, resultado[i].longitude) * 100
        ) / 100;
      }
      // ordenar por distancia (mais perto primeiro)
      resultado.sort(function(a, b) { return a.distancia_km - b.distancia_km; });
    } else {
      // sem coordenadas, ordenar por avaliacao
      resultado.sort(function(a, b) { return b.avaliacao - a.avaliacao; });
    }

    // devolver no maximo 20 resultados
    return json(res, 200, {
      sucesso: true,
      total: resultado.length,
      categoria: cat,
      profissionais: resultado.slice(0, 20)
    });
  }

  // POST /profissionais - adicionar novo profissional (usado pelo admin)
  if (rota === '/profissionais' && req.method === 'POST') {
    lerBody(req).then(function(d) {
      // validar campos obrigatorios
      if (!d.nome || !d.categoria || !d.telefone || !d.whatsapp) {
        return json(res, 400, { sucesso: false, erro: 'Campos em falta' });
      }

      // gerar novo id
      var novoId = db.profissionais.length > 0
        ? db.profissionais[db.profissionais.length - 1].id + 1
        : 1;

      // adicionar ao array
      db.profissionais.push({
        id: novoId,
        nome: d.nome.trim(),
        categoria: d.categoria.toLowerCase(),
        telefone: d.telefone,
        whatsapp: d.whatsapp,
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude),
        avaliacao: d.avaliacao || 4.5,
        descricao: d.descricao || ''
      });

      // guardar no ficheiro
      fs.writeFileSync(path.join(__dirname, 'dados.json'), JSON.stringify(db, null, 2));
      json(res, 201, { sucesso: true, id: novoId });
    }).catch(function() {
      json(res, 400, { sucesso: false, erro: 'Dados invalidos' });
    });
    return;
  }

  // se nenhuma rota da API correspondeu, servir ficheiro estatico
  var ficheiro = path.join(PUBLIC, rota);
  // seguranca: impedir acesso fora da pasta public
  if (ficheiro.indexOf(PUBLIC) !== 0) {
    return json(res, 403, { erro: 'Acesso negado' });
  }
  servirFicheiro(res, ficheiro);
});

// iniciar o servidor
server.listen(PORTA, function() {
  console.log('Servidor ativo em http://localhost:' + PORTA);
});
