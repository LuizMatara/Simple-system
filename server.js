// Servidor do Simple System
// API para pesquisar profissionais por categoria e proximidade

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORTA = 3000;
const PUBLIC = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

// carregar dados
let db = { profissionais: [] };
try {
  db = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados.json'), 'utf-8'));
} catch (e) {
  console.log('Aviso: dados.json nao encontrado. Corre "node init-db.js" primeiro.');
}


// calculo de distancia com haversine
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function responderJson(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function lerBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch(e) { reject(new Error('JSON invalido')); }
    });
  });
}

function servirFicheiro(res, filepath) {
  const ext = path.extname(filepath);
  const mime = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filepath, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC, 'index.html'), (err2, html) => {
        if (err2) return responderJson(res, 404, { erro: 'Nao encontrado' });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}


const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const rota = parsed.pathname;
  const params = parsed.query;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // verificar se o servidor esta ativo
  if (rota === '/saude') {
    return responderJson(res, 200, { estado: 'ativo', profissionais: db.profissionais.length });
  }

  // listar categorias disponiveis
  if (rota === '/categorias') {
    const contagem = {};
    db.profissionais.forEach(p => contagem[p.categoria] = (contagem[p.categoria] || 0) + 1);
    const lista = Object.entries(contagem).map(([cat, total]) => ({ categoria: cat, total }));
    return responderJson(res, 200, { sucesso: true, categorias: lista });
  }

  // pesquisar profissionais
  if (rota === '/profissionais' && req.method === 'GET') {
    const cat = params.categoria;
    if (!cat) return responderJson(res, 400, { sucesso: false, erro: 'Parametro "categoria" obrigatorio' });

    let resultado = db.profissionais.filter(p => p.categoria.toLowerCase() === cat.toLowerCase());

    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    const temCoords = !isNaN(lat) && !isNaN(lng);

    resultado = resultado.map(p => ({
      ...p,
      distancia_km: temCoords ? Math.round(haversine(lat, lng, p.latitude, p.longitude) * 100) / 100 : null
    }));

    if (temCoords) resultado.sort((a, b) => a.distancia_km - b.distancia_km);
    else resultado.sort((a, b) => b.avaliacao - a.avaliacao);

    resultado = resultado.slice(0, 20);

    return responderJson(res, 200, {
      sucesso: true,
      total: resultado.length,
      categoria: cat,
      profissionais: resultado
    });
  }

  // registar novo profissional
  if (rota === '/profissionais' && req.method === 'POST') {
    try {
      const d = await lerBody(req);
      if (!d.nome || !d.categoria || !d.telefone || !d.whatsapp)
        return responderJson(res, 400, { sucesso: false, erro: 'Campos obrigatorios em falta' });

      const novoId = db.profissionais.length > 0 ? Math.max(...db.profissionais.map(p => p.id)) + 1 : 1;

      db.profissionais.push({
        id: novoId,
        nome: d.nome.trim(),
        categoria: d.categoria.trim().toLowerCase(),
        telefone: d.telefone.replace(/\s/g, ''),
        whatsapp: d.whatsapp.replace(/\s/g, ''),
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude),
        avaliacao: d.avaliacao || 4.5,
        descricao: d.descricao || ''
      });

      fs.writeFileSync(path.join(__dirname, 'dados.json'), JSON.stringify(db, null, 2));
      return responderJson(res, 201, { sucesso: true, id: novoId });
    } catch (e) {
      return responderJson(res, 400, { sucesso: false, erro: e.message });
    }
  }

  // servir ficheiros da pasta public
  let ficheiro = path.join(PUBLIC, rota === '/' ? 'index.html' : rota);
  if (!ficheiro.startsWith(PUBLIC)) return responderJson(res, 403, { erro: 'Acesso negado' });
  servirFicheiro(res, ficheiro);
});

server.listen(PORTA, () => {
  console.log('Servidor ativo em http://localhost:' + PORTA);
});

process.on('SIGINT', () => process.exit(0));
