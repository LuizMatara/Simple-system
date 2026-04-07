// Gera a base de dados com profissionais ficticios em Condeixa-a-Nova
// Correr com: node init-db.js

const fs = require('fs');
const path = require('path');

// locais reais em condeixa
const locais = [
  { lat: 40.1138, lng: -8.4981 }, // centro / praça
  { lat: 40.1125, lng: -8.4965 }, // tenesse original
  { lat: 40.1150, lng: -8.5002 }, // escola basica
  { lat: 40.1132, lng: -8.4975 }, // cafe central
  { lat: 40.1145, lng: -8.4990 }, // junta de freguesia
  { lat: 40.1118, lng: -8.4950 }, // zona do museu
  { lat: 40.1160, lng: -8.5010 }, // rua joao mendes
  { lat: 40.1100, lng: -8.4935 }, // pingo doce
  { lat: 40.1142, lng: -8.4988 }, // correios
  { lat: 40.1170, lng: -8.5020 }, // parque municipal
  { lat: 40.1080, lng: -8.4910 }, // zona industrial
  { lat: 40.0980, lng: -8.4920 }, // conimbriga
];

const categorias = ['encanador','eletricista','pintor','veterinario','carpinteiro','jardineiro','limpeza','serralheiro'];

const nomes = {
  encanador: ['José Felipe','Manuel Rodrigues','António Ferreira','Paulo Soares','Fernando Dias','Carlos Pereira','Rui Almeida','Nuno Costa','Pedro Martins','Tiago Ribeiro','Hugo Silva','André Oliveira'],
  eletricista: ['Bruno Silva','Ricardo Santos','João Carvalho','Luís Gonçalves','Sérgio Lopes','Marco Pinto','David Mendes','Filipe Rocha','Vítor Moreira','Daniel Correia','Miguel Teixeira','Hélder Nunes'],
  pintor: ['Francisco Marques','Alberto Monteiro','Joaquim Sousa','Jorge Figueiredo','Artur Gomes','Henrique Barbosa','Raul Cardoso','Alfredo Lima','Domingos Cunha','Tomás Vieira','Gaspar Ramos','Sebastião Coelho'],
  veterinario: ['Dra. Ana Mendes','Dr. Carlos Mendes','Dra. Sofia Lopes','Dr. Diogo Fernandes','Dra. Marta Reis','Dr. Gonçalo Pires','Dra. Inês Tavares','Dr. Bernardo Neves','Dra. Catarina Mota','Dr. Simão Brito','Dra. Leonor Duarte','Dr. Tomé Araújo'],
  carpinteiro: ['Adelino Fonseca','Belmiro Machado','Custódio Antunes','Delfim Nogueira','Estêvão Pinho','Fortunato Leite','Graciano Melo','Hermínio Azevedo','Isidro Campos','Justino Freitas','Lázaro Simões','Maximino Borges'],
  jardineiro: ['Abel Nascimento','Benedito Loureiro','Celestino Pacheco','Donato Faria','Elísio Baptista','Firmino Valente','Germano Branco','Hilário Magalhães','Inocêncio Vaz','Jesuíno Amorim','Lino Pimentel','Mateus Esteves'],
  limpeza: ['Maria da Graça','Fernanda Leal','Rosa Domingues','Teresa Moura','Conceição Neves','Lurdes Henriques','Adelaide Guerreiro','Emília Fonseca','Glória Sampaio','Helena Queirós','Irene Maia','Judite Roque'],
  serralheiro: ['Agostinho Couto','Baltazar Lemos','Clemente Serra','Demétrio Morato','Eugénio Resende','Feliciano Andrade','Guilherme Bento','Humberto Paiva','Isaías Cruz','Januário Teles','Leandro Sá','Narciso Viana'],
};

const descricoes = {
  encanador: ['Reparação de canos e torneiras. Mais de 15 anos de experiência.','Desentupimentos e instalação de canalização.','Especialista em fugas de água e esquentadores.','Canalização ao domicílio. Orçamento gratuito.','Instalação de casas de banho. Preços acessíveis.','Manutenção de sistemas de água.','Reparações urgentes de canalização.','Canalização residencial e comercial.','Especialista em aquecimento central.','Desentupimentos profissionais. 24 horas.','Instalação de torneiras e autoclismos.','Reparação de canalizações antigas.'],
  eletricista: ['Instalações elétricas residenciais. Certificado DGEG.','Reparação de quadros elétricos.','Instalação de iluminação LED.','Eletricidade doméstica e industrial. 20 anos exp.','Manutenção de instalações elétricas.','Instalação de tomadas e interruptores.','Reparações elétricas urgentes. 7 dias/semana.','Projeto elétrico para novas construções.','Diagnóstico com equipamento moderno.','Instalação de painéis solares.','Certificação elétrica para seguros.','Reparação de avarias elétricas.'],
  pintor: ['Pintura de interiores e exteriores.','Pintura decorativa e efeitos especiais.','Pinturas de casas. Preço por m².','Restauro e pintura de fachadas.','Pintura de tetos e paredes. Materiais incluídos.','Pintura com tintas ecológicas.','Pintura residencial. Orçamento sem compromisso.','Restauro de móveis e verniz.','Pintura anti-humidade.','Trabalhos rápidos e limpos.','Pintura de garagens e armazéns.','Pintura para apartamentos de arrendamento.'],
  veterinario: ['Consultas ao domicílio. Vacinação incluída.','Clínica com cirurgia e internamento.','Especialista em animais exóticos.','Urgências veterinárias 24h.','Desparasitação, vacinação e microchip.','Consultas ao domicílio. Atendimento carinhoso.','Cirurgia e esterilização animal.','Medicina preventiva. Check-ups anuais.','Tratamento de doenças de pele.','Limpeza dentária para cães e gatos.','Fisioterapia e reabilitação animal.','Nutrição e aconselhamento alimentar.'],
  carpinteiro: ['Fabrico e reparação de móveis.','Portas e janelas em madeira por medida.','Montagem de cozinhas e roupeiros.','Restauro de móveis antigos.','Carpintaria geral e reparações.','Decks e pergolados em madeira.','Armários embutidos por medida.','Reparação de soalhos e rodapés.','Carpintaria artesanal.','Montagem de móveis IKEA.','Portas interiores e exteriores.','Trabalhos em madeira para exteriores.'],
  jardineiro: ['Manutenção de jardins. Corte de relva.','Poda de árvores e arbustos.','Projeto e construção de jardins.','Limpeza de terrenos e quintais.','Plantação de flores e sebes.','Manutenção mensal de jardins.','Corte de árvores perigosas.','Relva natural e artificial.','Tratamento fitossanitário.','Rega automática. Instalação e manutenção.','Jardinagem ecológica e hortas.','Limpeza sazonal de jardins.'],
  limpeza: ['Limpeza doméstica regular e pontual.','Limpeza de escritórios.','Limpeza pós-obra.','Engomadoria ao domicílio.','Limpeza profunda. Vidros e persianas.','Limpeza semanal ou quinzenal.','Limpeza para arrendamento turístico.','Limpeza e desinfeção ecológica.','Limpeza de garagens.','Limpeza para mudanças.','Limpeza de estofos e tapetes.','Apoio doméstico para idosos.'],
  serralheiro: ['Portões e gradeamentos em ferro.','Reparação de fechaduras.','Serralharia civil e artística.','Escadas metálicas e corrimãos.','Reparação de estores metálicos.','Estruturas metálicas. Soldadura MIG/TIG.','Portas de garagem automáticas.','Grades de segurança para janelas.','Mobiliário metálico por medida.','Reparação de portões automáticos.','Serralharia de alumínio.','Abertura de portas urgente.'],
};

// gerar telefone ficticio portugues
function gerarTel(i) {
  const pref = ['91','92','93','96'];
  return pref[i % 4] + String(1000000 + (i * 7919) % 9000000);
}

function gerarAvaliacao(i) {
  const vals = [4.0, 4.2, 4.5, 4.7, 4.8, 5.0, 3.8, 4.3, 4.6, 4.9, 3.5, 4.1];
  return vals[i % vals.length];
}

// gerar profissionais
const profissionais = [];
let id = 1;

for (let iLocal = 0; iLocal < locais.length; iLocal++) {
  for (let iCat = 0; iCat < categorias.length; iCat++) {
    const idx = iLocal * categorias.length + iCat;
    const cat = categorias[iCat];
    const tel = gerarTel(idx);

    profissionais.push({
      id: id++,
      nome: nomes[cat][iLocal],
      categoria: cat,
      telefone: tel,
      whatsapp: '351' + tel,
      latitude: locais[iLocal].lat,
      longitude: locais[iLocal].lng,
      avaliacao: gerarAvaliacao(idx),
      descricao: descricoes[cat][iLocal]
    });
  }
}

// guardar
const ficheiro = path.join(__dirname, 'dados.json');
fs.writeFileSync(ficheiro, JSON.stringify({ profissionais }, null, 2));
console.log(profissionais.length + ' profissionais criados em ' + ficheiro);
