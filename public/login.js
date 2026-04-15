// login.js - controla a autenticacao do utilizador
// verifica email e senha contra uma lista de contas
// guarda a sessao no sessionStorage do browser

// contas disponiveis no sistema
var contas = [
  { email: 'admin@simple.pt', senha: 'admin123', tipo: 'admin', nome: 'Administrador' },
  { email: 'user@simple.pt',  senha: 'user123',  tipo: 'user',  nome: 'Utilizador' }
];

// buscar elementos do formulario
var botao = document.getElementById('botao-entrar');
var inputEmail = document.getElementById('input-email');
var inputSenha = document.getElementById('input-senha');
var erroDiv = document.getElementById('erro-login');

// funcao chamada ao clicar nas contas de demonstracao
// preenche os campos automaticamente para facilitar o teste
function preencherConta(email, senha) {
  inputEmail.value = email;
  inputSenha.value = senha;
}

// quando clica no botao "Entrar"
botao.addEventListener('click', function() {
  var email = inputEmail.value.trim().toLowerCase();
  var senha = inputSenha.value.trim();

  // esconder erro anterior
  erroDiv.classList.add('d-none');

  // verificar se preencheu os campos
  if (email === '' || senha === '') {
    erroDiv.textContent = 'Preencha todos os campos.';
    erroDiv.classList.remove('d-none');
    return;
  }

  // procurar a conta na lista
  var conta = null;
  for (var i = 0; i < contas.length; i++) {
    if (contas[i].email === email && contas[i].senha === senha) {
      conta = contas[i];
      break;
    }
  }

  // se nao encontrou a conta
  if (!conta) {
    erroDiv.textContent = 'Credenciais incorretas.';
    erroDiv.classList.remove('d-none');
    return;
  }

  // guardar dados da sessao no browser
  // sessionStorage mantem os dados enquanto o separador estiver aberto
  sessionStorage.setItem('logado', 'true');
  sessionStorage.setItem('tipo', conta.tipo);
  sessionStorage.setItem('nome', conta.nome);

  // redirecionar para a pagina principal
  window.location.href = '/index.html';
});

// ao carregar Enter na senha, clica no botao
inputSenha.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') botao.click();
});

// ao carregar Enter no email, salta para a senha
inputEmail.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') inputSenha.focus();
});
