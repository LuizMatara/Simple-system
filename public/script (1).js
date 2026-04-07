/**
 * ============================================
 * Simple System - JavaScript (Frontend)
 * ============================================
 * 
 * Este ficheiro liga o frontend à API real do backend.
 * Substitui os dados fictícios hardcoded por chamadas
 * fetch() reais ao servidor.
 * 
 * Funcionalidades:
 *   - Mostrar categorias de serviço
 *   - Obter localização do utilizador (Geolocation API)
 *   - Pesquisar profissionais via API
 *   - Mostrar resultados ordenados por proximidade
 *   - Botões de contacto (telefone e WhatsApp)
 */

// =============================================
// CONFIGURAÇÃO
// =============================================

/**
 * URL base da API.
 * Em desenvolvimento local: '' (mesmo servidor)
 * Em produção: mudar para o URL do servidor real
 */
const API_BASE = '';

/**
 * Categorias de serviço com ícones e nomes amigáveis.
 * Os ícones grandes ajudam os idosos a identificar o serviço.
 */
const CATEGORIAS = [
  { id: 'encanador',   icone: '🔧', nome: 'Encanador' },
  { id: 'eletricista', icone: '⚡', nome: 'Eletricista' },
  { id: 'pintor',      icone: '🎨', nome: 'Pintor' },
  { id: 'veterinario', icone: '🐾', nome: 'Veterinário' },
  { id: 'carpinteiro', icone: '🪚', nome: 'Carpinteiro' },
  { id: 'jardineiro',  icone: '🌿', nome: 'Jardineiro' },
  { id: 'limpeza',     icone: '🧹', nome: 'Limpeza' },
  { id: 'serralheiro', icone: '🔩', nome: 'Serralheiro' },
];

// =============================================
// ESTADO DA APLICAÇÃO
// =============================================

/** Guarda o estado atual da aplicação */
const estado = {
  categoriaSelecionada: null,  // Categoria escolhida pelo utilizador
  latitude: null,              // Latitude do utilizador
  longitude: null,             // Longitude do utilizador
};

// =============================================
// ELEMENTOS DO DOM
// =============================================

const elementos = {
  grelhaCategorias:   document.getElementById('grelha-categorias'),
  secaoLocalizacao:   document.getElementById('secao-localizacao'),
  secaoResultados:    document.getElementById('secao-resultados'),
  botaoLocalizar:     document.getElementById('botao-localizar'),
  estadoLocalizacao:  document.getElementById('estado-localizacao'),
  infoPesquisa:       document.getElementById('info-pesquisa'),
  listaResultados:    document.getElementById('lista-resultados'),
  botaoVoltar:        document.getElementById('botao-voltar'),
  mensagemErro:       document.getElementById('mensagem-erro'),
  erroTexto:          document.getElementById('erro-texto'),
  botaoTentar:        document.getElementById('botao-tentar'),
};

// =============================================
// INICIALIZAÇÃO
// =============================================

/** Iniciar a aplicação quando a página carregar */
document.addEventListener('DOMContentLoaded', () => {
  criarCartoesCategorias();
  configurarEventos();
});

// =============================================
// CRIAR INTERFACE
// =============================================

/**
 * Cria os cartões de categoria na grelha.
 * Cada cartão tem um ícone grande e o nome do serviço.
 */
function criarCartoesCategorias() {
  elementos.grelhaCategorias.innerHTML = CATEGORIAS.map(cat => `
    <div class="cartao-categoria" data-categoria="${cat.id}" tabindex="0" role="button" aria-label="${cat.nome}">
      <span class="categoria-icone">${cat.icone}</span>
      <span class="categoria-nome">${cat.nome}</span>
    </div>
  `).join('');
}

/**
 * Configura todos os eventos da interface.
 */
function configurarEventos() {
  // --- Clique nos cartões de categoria ---
  elementos.grelhaCategorias.addEventListener('click', (evento) => {
    const cartao = evento.target.closest('.cartao-categoria');
    if (cartao) {
      selecionarCategoria(cartao.dataset.categoria);
    }
  });

  // --- Teclado nos cartões (acessibilidade) ---
  elementos.grelhaCategorias.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      const cartao = evento.target.closest('.cartao-categoria');
      if (cartao) {
        evento.preventDefault();
        selecionarCategoria(cartao.dataset.categoria);
      }
    }
  });

  // --- Botão de localização ---
  elementos.botaoLocalizar.addEventListener('click', obterLocalizacao);

  // --- Botão voltar ---
  elementos.botaoVoltar.addEventListener('click', voltarInicio);

  // --- Botão tentar novamente ---
  elementos.botaoTentar.addEventListener('click', () => {
    esconderErro();
    if (estado.categoriaSelecionada) {
      mostrarSecao('localizacao');
    }
  });
}

// =============================================
// NAVEGAÇÃO ENTRE SECÇÕES
// =============================================

/**
 * Mostra uma secção específica e esconde as outras.
 * @param {string} secao - 'categorias', 'localizacao' ou 'resultados'
 */
function mostrarSecao(secao) {
  // Esconder todas as secções
  elementos.secaoLocalizacao.classList.add('escondido');
  elementos.secaoResultados.classList.add('escondido');
  elementos.mensagemErro.classList.add('escondido');

  // Mostrar a secção pedida
  switch (secao) {
    case 'localizacao':
      elementos.secaoLocalizacao.classList.remove('escondido');
      elementos.botaoLocalizar.classList.remove('escondido');
      elementos.estadoLocalizacao.classList.add('escondido');
      // Rolar suavemente para a secção
      elementos.secaoLocalizacao.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;

    case 'resultados':
      elementos.secaoResultados.classList.remove('escondido');
      elementos.secaoResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
  }
}

/**
 * Volta ao início (seleção de categoria).
 */
function voltarInicio() {
  estado.categoriaSelecionada = null;
  estado.latitude = null;
  estado.longitude = null;

  // Remover seleção visual dos cartões
  document.querySelectorAll('.cartao-categoria').forEach(c => {
    c.classList.remove('selecionado');
  });

  // Esconder secções
  elementos.secaoLocalizacao.classList.add('escondido');
  elementos.secaoResultados.classList.add('escondido');
  elementos.mensagemErro.classList.add('escondido');

  // Rolar para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// SELEÇÃO DE CATEGORIA
// =============================================

/**
 * Processa a seleção de uma categoria pelo utilizador.
 * @param {string} categoriaId - ID da categoria selecionada
 */
function selecionarCategoria(categoriaId) {
  // Guardar a categoria selecionada
  estado.categoriaSelecionada = categoriaId;

  // Atualizar visual: destacar o cartão selecionado
  document.querySelectorAll('.cartao-categoria').forEach(cartao => {
    if (cartao.dataset.categoria === categoriaId) {
      cartao.classList.add('selecionado');
    } else {
      cartao.classList.remove('selecionado');
    }
  });

  // Mostrar a secção de localização
  mostrarSecao('localizacao');
}

// =============================================
// GEOLOCALIZAÇÃO
// =============================================

/**
 * Obtém a localização do utilizador usando a Geolocation API do browser.
 * Quando obtida, pesquisa automaticamente os profissionais.
 */
function obterLocalizacao() {
  // Verificar se o browser suporta geolocalização
  if (!navigator.geolocation) {
    mostrarErro('O seu navegador não suporta localização. Tente com outro navegador.');
    return;
  }

  // Mostrar o estado de carregamento
  elementos.botaoLocalizar.classList.add('escondido');
  elementos.estadoLocalizacao.classList.remove('escondido');

  // Pedir a localização ao browser
  navigator.geolocation.getCurrentPosition(
    // --- Sucesso: localização obtida ---
    (posicao) => {
      estado.latitude = posicao.coords.latitude;
      estado.longitude = posicao.coords.longitude;

      console.log(`📍 Localização obtida: ${estado.latitude}, ${estado.longitude}`);

      // Pesquisar profissionais com a localização
      pesquisarProfissionais();
    },

    // --- Erro: não foi possível obter a localização ---
    (erro) => {
      console.error('Erro de geolocalização:', erro);

      let mensagem = '';
      switch (erro.code) {
        case erro.PERMISSION_DENIED:
          mensagem = 'Não deu permissão para aceder à sua localização. Por favor, permita o acesso e tente novamente.';
          break;
        case erro.POSITION_UNAVAILABLE:
          mensagem = 'Não foi possível determinar a sua localização. Verifique se o GPS está ligado.';
          break;
        case erro.TIMEOUT:
          mensagem = 'O pedido de localização demorou demasiado. Tente novamente.';
          break;
        default:
          mensagem = 'Ocorreu um erro ao obter a sua localização. Tente novamente.';
      }
      mostrarErro(mensagem);
    },

    // --- Opções ---
    {
      enableHighAccuracy: true,  // Pedir localização precisa
      timeout: 15000,            // Esperar até 15 segundos
      maximumAge: 60000,         // Cache de 1 minuto
    }
  );
}

// =============================================
// PESQUISA NA API
// =============================================

/**
 * Pesquisa profissionais na API do backend.
 * Envia a categoria e a localização do utilizador.
 */
async function pesquisarProfissionais() {
  try {
    // --- Construir o URL com os parâmetros ---
    const parametros = new URLSearchParams({
      categoria: estado.categoriaSelecionada,
    });

    // Adicionar localização se disponível
    if (estado.latitude !== null && estado.longitude !== null) {
      parametros.append('lat', estado.latitude);
      parametros.append('lng', estado.longitude);
    }

    const url = `${API_BASE}/profissionais?${parametros.toString()}`;
    console.log('🔍 A pesquisar:', url);

    // --- Fazer o pedido à API ---
    const resposta = await fetch(url);

    // Verificar se o pedido foi bem-sucedido
    if (!resposta.ok) {
      throw new Error(`Erro do servidor: ${resposta.status}`);
    }

    // --- Processar a resposta ---
    const dados = await resposta.json();
    console.log('📦 Dados recebidos:', dados);

    // Verificar se houve sucesso
    if (!dados.sucesso) {
      throw new Error(dados.erro || 'Erro desconhecido');
    }

    // --- Mostrar os resultados ---
    mostrarResultados(dados);

  } catch (erro) {
    console.error('Erro na pesquisa:', erro);
    mostrarErro('Não foi possível encontrar profissionais. Verifique a sua ligação à internet e tente novamente.');
  }
}

// =============================================
// MOSTRAR RESULTADOS
// =============================================

/**
 * Mostra os resultados da pesquisa no ecrã.
 * @param {Object} dados - Resposta da API com os profissionais
 */
function mostrarResultados(dados) {
  const { profissionais, categoria, total } = dados;

  // --- Encontrar o nome amigável da categoria ---
  const catInfo = CATEGORIAS.find(c => c.id === categoria) || { nome: categoria, icone: '🔧' };

  // --- Informação sobre a pesquisa ---
  if (total === 0) {
    elementos.infoPesquisa.innerHTML = `
      Nenhum profissional de <strong>${catInfo.nome}</strong> encontrado na sua zona.
    `;
  } else {
    elementos.infoPesquisa.innerHTML = `
      ${catInfo.icone} Encontrámos <strong>${total}</strong> profissional(is) de 
      <strong>${catInfo.nome}</strong> perto de si.
    `;
  }

  // --- Criar os cartões de profissionais ---
  if (profissionais.length === 0) {
    elementos.listaResultados.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto-claro);">
        <p style="font-size: 48px; margin-bottom: 16px;">😔</p>
        <p style="font-size: 20px; font-weight: 600;">Nenhum resultado encontrado.</p>
        <p style="font-size: 16px; margin-top: 8px;">Tente outra categoria de serviço.</p>
      </div>
    `;
  } else {
    elementos.listaResultados.innerHTML = profissionais.map((prof, indice) => 
      criarCartaoProfissional(prof, indice)
    ).join('');
  }

  // --- Mostrar a secção de resultados ---
  mostrarSecao('resultados');
}

/**
 * Cria o HTML de um cartão de profissional.
 * @param {Object} prof - Dados do profissional
 * @param {number} indice - Posição na lista
 * @returns {string} HTML do cartão
 */
function criarCartaoProfissional(prof, indice) {
  // --- Formatar a distância ---
  let textoDistancia = '';
  if (prof.distancia_km !== null && prof.distancia_km !== undefined) {
    if (prof.distancia_km < 1) {
      // Mostrar em metros se for menos de 1 km
      const metros = Math.round(prof.distancia_km * 1000);
      textoDistancia = `📍 ${metros} metros de si`;
    } else {
      textoDistancia = `📍 ${prof.distancia_km.toFixed(1)} km de si`;
    }
  }

  // --- Formatar a avaliação com estrelas ---
  const estrelas = gerarEstrelas(prof.avaliacao);

  // --- Criar o cartão ---
  return `
    <div class="cartao-profissional" style="animation-delay: ${indice * 0.08}s">
      <div class="profissional-cabecalho">
        <span class="profissional-nome">${escapeHTML(prof.nome)}</span>
        <span class="profissional-avaliacao">
          ⭐ ${prof.avaliacao.toFixed(1)}
        </span>
      </div>
      
      <p class="profissional-descricao">${escapeHTML(prof.descricao)}</p>
      
      ${textoDistancia ? `<p class="profissional-distancia">${textoDistancia}</p>` : ''}
      
      <div class="botoes-contacto">
        <a href="tel:${escapeHTML(prof.telefone)}" class="botao-contacto botao-telefone">
          <span class="botao-contacto-icone">📞</span>
          Ligar
        </a>
        <a href="https://wa.me/${escapeHTML(prof.whatsapp)}" target="_blank" rel="noopener" class="botao-contacto botao-whatsapp">
          <span class="botao-contacto-icone">💬</span>
          WhatsApp
        </a>
      </div>
    </div>
  `;
}

/**
 * Gera texto com estrelas para a avaliação.
 * @param {number} avaliacao - Valor da avaliação (0-5)
 * @returns {string} Texto com estrelas
 */
function gerarEstrelas(avaliacao) {
  const cheias = Math.floor(avaliacao);
  const meia = avaliacao % 1 >= 0.5 ? 1 : 0;
  const vazias = 5 - cheias - meia;
  return '★'.repeat(cheias) + (meia ? '½' : '') + '☆'.repeat(vazias);
}

// =============================================
// GESTÃO DE ERROS
// =============================================

/**
 * Mostra uma mensagem de erro ao utilizador.
 * @param {string} mensagem - Texto do erro
 */
function mostrarErro(mensagem) {
  elementos.erroTexto.textContent = mensagem;
  elementos.mensagemErro.classList.remove('escondido');
  elementos.estadoLocalizacao.classList.add('escondido');
  elementos.mensagemErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Esconde a mensagem de erro.
 */
function esconderErro() {
  elementos.mensagemErro.classList.add('escondido');
}

// =============================================
// UTILITÁRIOS
// =============================================

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto seguro
 */
function escapeHTML(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
