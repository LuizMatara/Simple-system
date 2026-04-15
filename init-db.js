// init-db.js - gera a base de dados com profissionais ficticios
// usa locais reais de Condeixa-a-Nova com coordenadas verificadas
// correr uma vez com: node init-db.js

var fs = require('fs');
var path = require('path');

// localizacoes reais em Condeixa-a-Nova
// coordenadas verificadas no site codigo-postal.pt
var locais = [
  { lat: 40.1104, lng: -8.4950 }, // quinta nova (junto a INTEP)
  { lat: 40.1132, lng: -8.4975 }, // rua principal
  { lat: 40.1138, lng: -8.4981 }, // praca central
  { lat: 40.1145, lng: -8.4990 }, // junta de freguesia
  { lat: 40.1150, lng: -8.5002 }, // escola basica
  { lat: 40.1118, lng: -8.4950 }, // zona do museu
  { lat: 40.1125, lng: -8.4965 }, // zona comercial
  { lat: 40.1160, lng: -8.5010 }, // zona residencial norte
  { lat: 40.1100, lng: -8.4935 }, // zona comercial sul
  { lat: 40.1142, lng: -8.4988 }, // correios
  { lat: 40.1170, lng: -8.5020 }, // parque municipal
  { lat: 40.1080, lng: -8.4910 }, // zona industrial
];

// 15 categorias de servicos
var categorias = ['encanador','eletricista','pintor','veterinario','carpinteiro','jardineiro','limpeza','serralheiro','mecanico','pedreiro','explicador','cabeleireiro','costureira','mudancas','informatica'];

// nomes ficticios portugueses - 12 por categoria (1 por local)
var nomes = {
  encanador: ['Jose Felipe','Manuel Rodrigues','Antonio Ferreira','Paulo Soares','Fernando Dias','Carlos Pereira','Rui Almeida','Nuno Costa','Pedro Martins','Tiago Ribeiro','Hugo Silva','Andre Oliveira'],
  eletricista: ['Bruno Silva','Ricardo Santos','Joao Carvalho','Luis Goncalves','Sergio Lopes','Marco Pinto','David Mendes','Filipe Rocha','Vitor Moreira','Daniel Correia','Miguel Teixeira','Helder Nunes'],
  pintor: ['Francisco Marques','Alberto Monteiro','Joaquim Sousa','Jorge Figueiredo','Artur Gomes','Henrique Barbosa','Raul Cardoso','Alfredo Lima','Domingos Cunha','Tomas Vieira','Gaspar Ramos','Sebastiao Coelho'],
  veterinario: ['Dra. Ana Mendes','Dr. Carlos Mendes','Dra. Sofia Lopes','Dr. Diogo Fernandes','Dra. Marta Reis','Dr. Goncalo Pires','Dra. Ines Tavares','Dr. Bernardo Neves','Dra. Catarina Mota','Dr. Simao Brito','Dra. Leonor Duarte','Dr. Tome Araujo'],
  carpinteiro: ['Adelino Fonseca','Belmiro Machado','Custodio Antunes','Delfim Nogueira','Estevao Pinho','Fortunato Leite','Graciano Melo','Herminio Azevedo','Isidro Campos','Justino Freitas','Lazaro Simoes','Maximino Borges'],
  jardineiro: ['Abel Nascimento','Benedito Loureiro','Celestino Pacheco','Donato Faria','Elisio Baptista','Firmino Valente','Germano Branco','Hilario Magalhaes','Inocencio Vaz','Jesuino Amorim','Lino Pimentel','Mateus Esteves'],
  limpeza: ['Maria da Graca','Fernanda Leal','Rosa Domingues','Teresa Moura','Conceicao Neves','Lurdes Henriques','Adelaide Guerreiro','Emilia Fonseca','Gloria Sampaio','Helena Queiros','Irene Maia','Judite Roque'],
  serralheiro: ['Agostinho Couto','Baltazar Lemos','Clemente Serra','Demetrio Morato','Eugenio Resende','Feliciano Andrade','Guilherme Bento','Humberto Paiva','Isaias Cruz','Januario Teles','Leandro Sa','Narciso Viana'],
  mecanico: ['Roberto Faria','Sandro Leal','Valter Cunha','Xavier Pinto','Dinis Correia','Goncalo Braga','Ivo Teixeira','Lourenco Matos','Marcio Duarte','Nelson Araujo','Orlando Reis','Renato Lopes'],
  pedreiro: ['Amilcar Sousa','Bento Carvalho','Candido Ferreira','Ernesto Marques','Florencio Rocha','Gil Monteiro','Heitor Almeida','Jaime Costa','Luciano Santos','Mario Barbosa','Norberto Lima','Otavio Gomes'],
  explicador: ['Prof. Clara Neves','Prof. Duarte Melo','Prof. Eva Pires','Prof. Filomena Reis','Prof. Gabriel Moura','Prof. Helena Branco','Prof. Igor Fonseca','Prof. Joana Simoes','Prof. Kevin Azevedo','Prof. Lara Nogueira','Prof. Manuel Vaz','Prof. Natalia Freitas'],
  cabeleireiro: ['Sandra Pereira','Cristina Lopes','Patricia Mendes','Debora Carvalho','Elsa Fernandes','Fatima Gomes','Graca Monteiro','Isabel Rocha','Joana Pinto','Katia Ferreira','Liliana Sousa','Margarida Silva'],
  costureira: ['Amelia Rodrigues','Beatriz Santos','Carla Oliveira','Dulce Martins','Edite Almeida','Filipa Costa','Graciela Nunes','Herminia Ribeiro','Ines Machado','Judite Moreira','Leonor Correia','Manuela Teixeira'],
  mudancas: ['TransCondeixa','MudaFacil','PortaMudancas','Expresso Condeixa','Rapido e Seguro','MoveServicos','Condeixa Trans','AjudaMudancas','TransPorte Plus','Muda Ja','ServiMudancas','TransRapido'],
  informatica: ['TechCondeixa','InfoRepara','PCDoctor','Nuno Informatica','Digital Fix','ComputerHelp','TechSupport PT','InfoAjuda','PCMais','Repara Digital','WebFix','TecnoApoio'],
};

// descricoes curtas por categoria
var descricoes = {
  encanador: ['Reparacao de canos e torneiras.','Desentupimentos.','Fugas de agua.','Canalizacao ao domicilio.','Casas de banho.','Sistemas de agua.','Reparacoes urgentes.','Canalizacao residencial.','Aquecimento central.','Desentupimentos 24h.','Torneiras e autoclismos.','Canalizacoes antigas.'],
  eletricista: ['Instalacoes residenciais.','Quadros eletricos.','Iluminacao LED.','Eletricidade domestica.','Manutencao eletrica.','Tomadas e interruptores.','Reparacoes urgentes.','Projeto eletrico.','Diagnostico moderno.','Paineis solares.','Certificacao.','Avarias eletricas.'],
  pintor: ['Interiores e exteriores.','Pintura decorativa.','Preco por m2.','Fachadas.','Materiais incluidos.','Tintas ecologicas.','Orcamento gratis.','Restauro de moveis.','Anti-humidade.','Trabalhos rapidos.','Garagens.','Apartamentos.'],
  veterinario: ['Consultas ao domicilio.','Cirurgia e internamento.','Animais exoticos.','Urgencias 24h.','Vacinacao e microchip.','Atendimento carinhoso.','Esterilizacao.','Check-ups anuais.','Doencas de pele.','Limpeza dentaria.','Fisioterapia.','Nutricao animal.'],
  carpinteiro: ['Moveis em madeira.','Portas e janelas.','Cozinhas e roupeiros.','Restauro de moveis.','Reparacoes.','Decks e pergolados.','Armarios embutidos.','Soalhos.','Artesanal.','Montagem IKEA.','Portas interiores.','Madeira exterior.'],
  jardineiro: ['Corte de relva.','Poda de arvores.','Projeto de jardins.','Limpeza de terrenos.','Flores e sebes.','Manutencao mensal.','Arvores perigosas.','Relva artificial.','Fitossanitario.','Rega automatica.','Hortas urbanas.','Limpeza sazonal.'],
  limpeza: ['Limpeza domestica.','Escritorios.','Pos-obra.','Engomadoria.','Limpeza profunda.','Semanal.','Turistico.','Desinfecao.','Garagens.','Mudancas.','Estofos.','Apoio a idosos.'],
  serralheiro: ['Portoes e grades.','Fechaduras.','Artistica.','Escadas metalicas.','Estores.','Soldadura.','Portas garagem.','Grades seguranca.','Mobiliario.','Portoes automaticos.','Aluminio.','Abertura urgente.'],
  mecanico: ['Revisao geral.','Travoes.','Diagnostico.','Oleo e filtros.','Pneus.','Ar condicionado.','Embraiagem.','Escape.','Pre-inspecao.','Mecanica rapida.','Motores.','Eletricidade auto.'],
  pedreiro: ['Construcao.','Paredes.','Impermeabilizacao.','Telhados.','Pavimentos.','Obras pequenas.','Casas de banho.','Muros.','Pedra.','Reboco.','Demolicoes.','Ampliacoes.'],
  explicador: ['Matematica.','Portugues.','Ingles.','Fisica e Quimica.','Exames.','Primario.','Ciencias.','Historia.','Programacao.','Ao domicilio.','Grupos.','Necessidades especiais.'],
  cabeleireiro: ['Corte fem/masc.','Coloracao.','Tratamentos.','Penteados.','Infantil.','Alisamento.','Extensoes.','Barbeiro.','Manicure.','Depilacao.','Maquilhagem.','Ao domicilio.'],
  costureira: ['Arranjos.','Vestidos.','Cortinados.','Reparacao.','Crianca.','Fatos.','Bordados.','Cerimonia.','Almofadas.','Toalhas.','Disfarces.','Ao domicilio.'],
  mudancas: ['Residenciais.','Comerciais.','Montagem.','Embalagem.','Locais.','Nacionais.','Armazenamento.','Eletrodomesticos.','Urgentes.','Pesados.','Escritorios.','Orcamento gratis.'],
  informatica: ['Reparacao PCs.','Formatacao.','Virus.','Wi-Fi.','Dados.','Aulas idosos.','Montagem.','Portateis.','Impressoras.','Backup.','Websites.','Suporte remoto.'],
};

// gerar telefone ficticio portugues (começa com 91/92/93/96)
function gerarTel(i) {
  var p = ['91','92','93','96'];
  return p[i % 4] + String(1000000 + (i * 7919) % 9000000);
}

// gerar avaliacao entre 3.5 e 5.0
function gerarNota(i) {
  var v = [4.0, 4.2, 4.5, 4.7, 4.8, 5.0, 3.8, 4.3, 4.6, 4.9, 3.5, 4.1];
  return v[i % v.length];
}

// criar todos os profissionais: 12 locais x 15 categorias = 180
var profissionais = [];
var id = 1;
for (var iL = 0; iL < locais.length; iL++) {
  for (var iC = 0; iC < categorias.length; iC++) {
    var idx = iL * categorias.length + iC;
    var cat = categorias[iC];
    var tel = gerarTel(idx);
    profissionais.push({
      id: id++,
      nome: nomes[cat][iL],
      categoria: cat,
      telefone: tel,
      whatsapp: '351' + tel,
      latitude: locais[iL].lat,
      longitude: locais[iL].lng,
      avaliacao: gerarNota(idx),
      descricao: descricoes[cat][iL]
    });
  }
}

// guardar no ficheiro dados.json
fs.writeFileSync(
  path.join(__dirname, 'dados.json'),
  JSON.stringify({ profissionais: profissionais }, null, 2)
);
console.log(profissionais.length + ' profissionais criados');
