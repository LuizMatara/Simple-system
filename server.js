/**
 * ============================================
 * Simple System - Servidor Backend
 * ============================================
 * 
 * API REST usando APENAS Node.js nativo (zero dependências).
 * Isto significa que não precisas de correr "npm install".
 * 
 * Endpoints:
 *   GET  /profissionais  — pesquisar por categoria e proximidade
 *   POST /profissionais  — registar novo profissional
 *   GET  /categorias     — listar categorias disponíveis
 *   GET  /saude          — verificar se o servidor está ativo
 * 
 * Iniciar com: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// =============================================
// CONFIGURAÇÃO
// =============================================

const PORTA = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'dados.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Tipos MIME para servir ficheiros estáticos ---
const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// =============================================
// BASE DE DADOS (FICHEIRO JSON)
// =============================================

/**
 * Carrega os dados do ficheiro JSON.
 * Se o ficheiro não existir, cria um vazio.
 */
function carregarDados() {
  try {
    const conteudo = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(conteudo);
  } catch (erro) {
    console.error('⚠️  Ficheiro dados.json não encontrado.');
    console.error('👉 Executa primeiro: node init-db.js\n');
    return { profissionais: [] };
  }
}

/**
 * Guarda os dados no ficheiro JSON.
 */
function guardarDados(dados) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2), 'utf-8');
}

// --- Carregar dados ao iniciar ---
let baseDados = carregarDados();
console.log(`📂 Base de dados: ${baseDados.profissionais.length} profissionais carregados.`);

// =============================================
// FÓRMULA DE HAVERSINE
// =============================================

/**
 * Calcula a distância entre dois pontos geográficos.
 * @returns {number} Distância em quilómetros
 */
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// =============================================
// FUNÇÕES AUXILIARES DO SERVIDOR
// =============================================

/**
 * Envia uma resposta JSON.
 */
function enviarJSON(res, codigo, dados) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(dados));
}

/**
 * Lê o corpo de um pedido POST.
 */
function lerCorpo(req) {
  return new Promise((resolver, rejeitar) => {
    let corpo = '';
    req.on('data', parte => { corpo += parte; });
    req.on('end', () => {
      try {
        resolver(JSON.parse(corpo));
      } catch (e) {
        rejeitar(new Error('JSON inválido no corpo do pedido.'));
      }
    });
    req.on('error', rejeitar);
  });
}

/**
 * Serve um ficheiro estático da pasta public/.
 */
function servirFicheiro(res, caminhoFicheiro) {
  const extensao = path.extname(caminhoFicheiro);
  const tipoMime = TIPOS_MIME[extensao] || 'application/octet-stream';

  fs.readFile(caminhoFicheiro, (erro, conteudo) => {
    if (erro) {
      // Se o ficheiro não existir, servir index.html (SPA)
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, html) => {
        if (err2) {
          enviarJSON(res, 404, { erro: 'Ficheiro não encontrado.' });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': tipoMime });
    res.end(conteudo);
  });
}

// =============================================
// ROTAS DA API
// =============================================

/**
 * GET /saude — Verificar se o servidor está ativo
 */
function rotaSaude(req, res) {
  enviarJSON(res, 200, {
    estado: 'ativo',
    mensagem: 'Simple System está a funcionar! 🟢',
    total_profissionais: baseDados.profissionais.length,
    hora: new Date().toISOString(),
  });
}

/**
 * GET /categorias — Listar categorias com totais
 */
function rotaCategorias(req, res) {
  // Contar profissionais por categoria
  const contagem = {};
  baseDados.profissionais.forEach(p => {
    contagem[p.categoria] = (contagem[p.categoria] || 0) + 1;
  });

  const categorias = Object.entries(contagem)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));

  enviarJSON(res, 200, { sucesso: true, categorias });
}

/**
 * GET /profissionais — Pesquisar por categoria e proximidade
 * 
 * Parâmetros:
 *   ?categoria=encanador  (obrigatório)
 *   &lat=40.11            (opcional)
 *   &lng=-8.49            (opcional)
 *   &limite=20            (opcional)
 */
function rotaPesquisar(req, res, parametros) {
  const categoria = parametros.get('categoria');
  const lat = parseFloat(parametros.get('lat'));
  const lng = parseFloat(parametros.get('lng'));
  const limite = parseInt(parametros.get('limite')) || 20;

  // --- Validar categoria ---
  if (!categoria) {
    return enviarJSON(res, 400, {
      sucesso: false,
      erro: 'O parâmetro "categoria" é obrigatório.',
      exemplo: '/profissionais?categoria=encanador&lat=40.11&lng=-8.49',
    });
  }

  // --- Filtrar por categoria ---
  let resultado = baseDados.profissionais.filter(
    p => p.categoria.toLowerCase() === categoria.toLowerCase()
  );

  // --- Calcular distância se tiver localização ---
  const temLocalizacao = !isNaN(lat) && !isNaN(lng);

  resultado = resultado.map(prof => ({
    ...prof,
    distancia_km: temLocalizacao
      ? Math.round(calcularDistancia(lat, lng, prof.latitude, prof.longitude) * 100) / 100
      : null,
  }));

  // --- Ordenar: por distância ou por avaliação ---
  if (temLocalizacao) {
    resultado.sort((a, b) => a.distancia_km - b.distancia_km);
  } else {
    resultado.sort((a, b) => b.avaliacao - a.avaliacao);
  }

  // --- Limitar resultados ---
  resultado = resultado.slice(0, limite);

  enviarJSON(res, 200, {
    sucesso: true,
    total: resultado.length,
    categoria: categoria,
    localizacao_utilizador: temLocalizacao ? { latitude: lat, longitude: lng } : null,
    profissionais: resultado,
  });
}

/**
 * POST /profissionais — Registar novo profissional
 */
async function rotaRegistar(req, res) {
  try {
    const dados = await lerCorpo(req);

    // --- Validações ---
    const erros = [];
    if (!dados.nome || dados.nome.trim().length < 2) erros.push('Nome obrigatório (mín. 2 caracteres).');
    if (!dados.categoria) erros.push('Categoria obrigatória.');
    if (!dados.telefone) erros.push('Telefone obrigatório.');
    if (!dados.whatsapp) erros.push('WhatsApp obrigatório.');
    if (dados.latitude === undefined || isNaN(dados.latitude)) erros.push('Latitude obrigatória.');
    if (dados.longitude === undefined || isNaN(dados.longitude)) erros.push('Longitude obrigatória.');

    if (erros.length > 0) {
      return enviarJSON(res, 400, { sucesso: false, erros });
    }

    // --- Criar novo profissional ---
    const novoId = baseDados.profissionais.length > 0
      ? Math.max(...baseDados.profissionais.map(p => p.id)) + 1
      : 1;

    const novo = {
      id: novoId,
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim().toLowerCase(),
      telefone: dados.telefone.replace(/\s/g, ''),
      whatsapp: dados.whatsapp.replace(/\s/g, ''),
      latitude: parseFloat(dados.latitude),
      longitude: parseFloat(dados.longitude),
      avaliacao: dados.avaliacao || 4.5,
      descricao: dados.descricao || '',
    };

    // --- Adicionar e guardar ---
    baseDados.profissionais.push(novo);
    guardarDados(baseDados);

    enviarJSON(res, 201, {
      sucesso: true,
      mensagem: 'Profissional registado com sucesso!',
      id: novoId,
    });

  } catch (erro) {
    enviarJSON(res, 400, { sucesso: false, erro: erro.message });
  }
}

// =============================================
// SERVIDOR HTTP
// =============================================

const servidor = http.createServer((req, res) => {
  const urlParsed = url.parse(req.url, true);
  const caminho = urlParsed.pathname;
  const parametros = new URLSearchParams(urlParsed.search || '');

  // --- CORS para pedidos OPTIONS (preflight) ---
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // --- Rotas da API ---
  if (caminho === '/saude' && req.method === 'GET') {
    return rotaSaude(req, res);
  }

  if (caminho === '/categorias' && req.method === 'GET') {
    return rotaCategorias(req, res);
  }

  if (caminho === '/profissionais' && req.method === 'GET') {
    return rotaPesquisar(req, res, parametros);
  }

  if (caminho === '/profissionais' && req.method === 'POST') {
    return rotaRegistar(req, res);
  }

  // --- Servir ficheiros estáticos ---
  let caminhoFicheiro = path.join(PUBLIC_DIR, caminho === '/' ? 'index.html' : caminho);
  // Segurança: impedir acesso fora de public/
  if (!caminhoFicheiro.startsWith(PUBLIC_DIR)) {
    return enviarJSON(res, 403, { erro: 'Acesso negado.' });
  }

  servirFicheiro(res, caminhoFicheiro);
});

// --- Iniciar ---
servidor.listen(PORTA, () => {
  console.log('\n🚀 ============================================');
  console.log('   Simple System - Servidor Ativo');
  console.log(`   http://localhost:${PORTA}`);
  console.log('   ============================================');
  console.log(`   📡 API: http://localhost:${PORTA}/profissionais`);
  console.log(`   🏥 Saúde: http://localhost:${PORTA}/saude`);
  console.log(`   📋 Categorias: http://localhost:${PORTA}/categorias`);
  console.log('   ============================================\n');
});

process.on('SIGINT', () => { console.log('\n🛑 Servidor encerrado.'); process.exit(0); });
