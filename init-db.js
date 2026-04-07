/**
 * ============================================
 * Simple System - Inicialização da Base de Dados
 * ============================================
 * 
 * Cria o ficheiro dados.json com profissionais fictícios
 * localizados em Condeixa-a-Nova.
 * 
 * Usamos JSON como "base de dados" para zero dependências.
 * Para produção com muitos dados, migrar para SQLite.
 * 
 * Executar com: node init-db.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dados.json');
console.log('📂 A criar base de dados em:', DB_PATH);

// --- Localizações reais em Condeixa-a-Nova ---
const locais = [
  { nome: 'Centro de Condeixa (Praça)',           lat: 40.1138, lng: -8.4981 },
  { nome: 'Tenesse Original',                      lat: 40.1125, lng: -8.4965 },
  { nome: 'Escola Básica de Condeixa',             lat: 40.1150, lng: -8.5002 },
  { nome: 'Café Central (Rua Principal)',          lat: 40.1132, lng: -8.4975 },
  { nome: 'Junta de Freguesia de Condeixa',       lat: 40.1145, lng: -8.4990 },
  { nome: 'Zona do Museu (PO.RO.S)',              lat: 40.1118, lng: -8.4950 },
  { nome: 'Rua João Mendes (zona residencial)',    lat: 40.1160, lng: -8.5010 },
  { nome: 'Supermercado Pingo Doce Condeixa',     lat: 40.1100, lng: -8.4935 },
  { nome: 'Estação de Correios',                   lat: 40.1142, lng: -8.4988 },
  { nome: 'Parque Municipal de Condeixa',         lat: 40.1170, lng: -8.5020 },
  { nome: 'Zona Industrial de Condeixa',          lat: 40.1080, lng: -8.4910 },
  { nome: 'Conimbriga (zona arqueológica)',        lat: 40.0980, lng: -8.4920 },
];

const categorias = ['encanador','eletricista','pintor','veterinario','carpinteiro','jardineiro','limpeza','serralheiro'];

const nomesPorCategoria = {
  encanador: ['José Felipe','Manuel Rodrigues','António Ferreira','Paulo Soares','Fernando Dias','Carlos Pereira','Rui Almeida','Nuno Costa','Pedro Martins','Tiago Ribeiro','Hugo Silva','André Oliveira'],
  eletricista: ['Bruno Silva','Ricardo Santos','João Carvalho','Luís Gonçalves','Sérgio Lopes','Marco Pinto','David Mendes','Filipe Rocha','Vítor Moreira','Daniel Correia','Miguel Teixeira','Hélder Nunes'],
  pintor: ['Francisco Marques','Alberto Monteiro','Joaquim Sousa','Jorge Figueiredo','Artur Gomes','Henrique Barbosa','Raul Cardoso','Alfredo Lima','Domingos Cunha','Tomás Vieira','Gaspar Ramos','Sebastião Coelho'],
  veterinario: ['Dra. Ana Mendes','Dr. Carlos Mendes','Dra. Sofia Lopes','Dr. Diogo Fernandes','Dra. Marta Reis','Dr. Gonçalo Pires','Dra. Inês Tavares','Dr. Bernardo Neves','Dra. Catarina Mota','Dr. Simão Brito','Dra. Leonor Duarte','Dr. Tomé Araújo'],
  carpinteiro: ['Adelino Fonseca','Belmiro Machado','Custódio Antunes','Delfim Nogueira','Estêvão Pinho','Fortunato Leite','Graciano Melo','Hermínio Azevedo','Isidro Campos','Justino Freitas','Lázaro Simões','Maximino Borges'],
  jardineiro: ['Abel Nascimento','Benedito Loureiro','Celestino Pacheco','Donato Faria','Elísio Baptista','Firmino Valente','Germano Branco','Hilário Magalhães','Inocêncio Vaz','Jesuíno Amorim','Lino Pimentel','Mateus Esteves'],
  limpeza: ['Maria da Graça','Fernanda Leal','Rosa Domingues','Teresa Moura','Conceição Neves','Lurdes Henriques','Adelaide Guerreiro','Emília Fonseca','Glória Sampaio','Helena Queirós','Irene Maia','Judite Roque'],
  serralheiro: ['Agostinho Couto','Baltazar Lemos','Clemente Serra','Demétrio Morato','Eugénio Resende','Feliciano Andrade','Guilherme Bento','Humberto Paiva','Isaías Cruz','Januário Teles','Leandro Sá','Narciso Viana'],
};

const descricoesPorCategoria = {
  encanador: ['Reparação de canos e torneiras. Mais de 15 anos de experiência.','Desentupimentos e instalação de canalização. Trabalho rápido e limpo.','Especialista em fugas de água e reparação de esquentadores.','Serviço de canalização ao domicílio. Orçamento gratuito.','Instalação de casas de banho completas. Preços acessíveis.','Manutenção de sistemas de água. Disponível ao fim de semana.','Reparações urgentes de canalização. Atendimento em menos de 1 hora.','Canalização residencial e comercial. Trabalho garantido.','Especialista em aquecimento central e caldeiras.','Desentupimentos com equipamento profissional. 24 horas.','Instalação de torneiras, autoclismos e chuveiros.','Reparação de canalizações antigas. Experiência com casas centenárias.'],
  eletricista: ['Instalações elétricas residenciais. Certificado pela DGEG.','Reparação de quadros elétricos e curto-circuitos.','Instalação de iluminação LED. Poupança garantida.','Electricidade doméstica e industrial. 20 anos de experiência.','Manutenção de instalações elétricas. Inspeções periódicas.','Instalação de tomadas, interruptores e disjuntores.','Reparações elétricas urgentes. Disponível 7 dias por semana.','Projeto e instalação elétrica para novas construções.','Diagnóstico de problemas elétricos com equipamento moderno.','Instalação de painéis solares e sistemas fotovoltaicos.','Certificação de instalações elétricas para seguros.','Reparação de avarias elétricas. Atendimento rápido.'],
  pintor: ['Pintura de interiores e exteriores. Acabamento perfeito.','Pintura decorativa e efeitos especiais em paredes.','Pinturas de casas e apartamentos. Preço por m².','Restauro e pintura de fachadas. Trabalho em altura.','Pintura de tetos, paredes e madeiras. Materiais incluídos.','Especialista em pintura com tintas ecológicas.','Pintura residencial e comercial. Orçamento sem compromisso.','Restauro de móveis e pintura com verniz.','Pintura anti-humidade e impermeabilização.','Trabalhos de pintura rápidos e limpos. Flexibilidade horária.','Pintura de garagens, armazéns e espaços comerciais.','Especialista em pintura de apartamentos para arrendamento.'],
  veterinario: ['Consultas ao domicílio para cães e gatos. Vacinação incluída.','Clínica veterinária com cirurgia e internamento.','Especialista em animais exóticos e aves.','Veterinário de animais de companhia. Urgências 24h.','Desparasitação, vacinação e microchip. Preços económicos.','Consultas veterinárias ao domicílio. Atendimento carinhoso.','Cirurgia veterinária e esterilização. Pós-operatório acompanhado.','Medicina preventiva para animais. Check-ups anuais.','Tratamento de doenças de pele em animais.','Odontologia veterinária. Limpeza dentária para cães e gatos.','Fisioterapia e reabilitação animal.','Nutrição e aconselhamento alimentar para animais.'],
  carpinteiro: ['Fabrico e reparação de móveis em madeira maciça.','Portas, janelas e caixilharia em madeira. Medida exata.','Montagem de cozinhas e roupeiros. Trabalho personalizado.','Restauro de móveis antigos. Tratamento contra caruncho.','Carpintaria geral e pequenas reparações domésticas.','Construção de decks e pergolados em madeira tratada.','Armários embutidos e estantes por medida.','Reparação de soalhos e rodapés em madeira.','Carpintaria artesanal. Peças únicas e personalizadas.','Montagem de móveis IKEA e similares.','Portas interiores e exteriores. Instalação completa.','Trabalhos em madeira para exteriores. Tratamento autoclave.'],
  jardineiro: ['Manutenção de jardins e espaços verdes. Corte de relva.','Poda de árvores e arbustos. Equipamento profissional.','Projeto e construção de jardins. Sistemas de rega.','Limpeza de terrenos e quintais. Remoção de entulho verde.','Plantação de flores, árvores e sebes. Aconselhamento incluído.','Manutenção mensal de jardins residenciais.','Corte de árvores perigosas. Trabalho em altura com segurança.','Instalação de relva natural e artificial.','Tratamento fitossanitário de plantas e árvores.','Rega automática. Instalação e manutenção de sistemas.','Jardinagem ecológica e hortas urbanas.','Limpeza sazonal de jardins. Primavera e outono.'],
  limpeza: ['Limpeza doméstica regular e pontual. Pessoa de confiança.','Limpeza de escritórios e espaços comerciais.','Limpeza pós-obra. Remoção de pó e resíduos de construção.','Engomadoria e tratamento de roupa ao domicílio.','Limpeza profunda de casas. Inclui vidros e persianas.','Serviço de limpeza semanal ou quinzenal.','Limpeza de apartamentos para arrendamento turístico.','Limpeza e desinfeção de espaços. Produtos ecológicos.','Limpeza de garagens e arrecadações. Organização incluída.','Serviço de limpeza para mudanças. Entrada e saída.','Limpeza de estofos, tapetes e cortinados.','Apoio doméstico para idosos. Limpeza e compras.'],
  serralheiro: ['Portões, gradeamentos e vedações em ferro e alumínio.','Reparação de fechaduras e portas blindadas.','Serralharia civil e artística. Trabalhos por medida.','Escadas metálicas e corrimãos. Instalação completa.','Reparação de estores e persianas metálicas.','Estruturas metálicas para construção. Soldadura MIG/TIG.','Portas de garagem automáticas. Instalação e reparação.','Grades de segurança para janelas e varandas.','Mobiliário metálico por medida. Design moderno.','Reparação de portões automáticos e motores.','Serralharia de alumínio. Janelas e portas de correr.','Trabalhos urgentes de serralharia. Abertura de portas.'],
};

function gerarTelefone(i) {
  const p = ['91','92','93','96'];
  return `${p[i%p.length]}${String(1000000+(i*7919)%9000000)}`;
}

function gerarAvaliacao(i) {
  const a = [4.0,4.2,4.5,4.7,4.8,5.0,3.8,4.3,4.6,4.9,3.5,4.1];
  return a[i%a.length];
}

// --- Gerar todos os profissionais ---
const profissionais = [];
let id = 1;

locais.forEach((local, iL) => {
  categorias.forEach((cat, iC) => {
    const ig = iL * categorias.length + iC;
    const tel = gerarTelefone(ig);
    profissionais.push({
      id: id++,
      nome: nomesPorCategoria[cat][iL],
      categoria: cat,
      telefone: tel,
      whatsapp: `351${tel}`,
      latitude: local.lat,
      longitude: local.lng,
      avaliacao: gerarAvaliacao(ig),
      descricao: descricoesPorCategoria[cat][iL],
    });
  });
});

// --- Guardar ---
fs.writeFileSync(DB_PATH, JSON.stringify({ profissionais }, null, 2), 'utf-8');

console.log(`\n🎉 ${profissionais.length} profissionais criados!`);
console.log(`📍 ${locais.length} localizações × ${categorias.length} categorias`);
console.log('\n✅ Ficheiro guardado:', DB_PATH);
console.log('👉 Agora inicia o servidor com: node server.js\n');
