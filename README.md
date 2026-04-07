# 🔍 Simple System

**Motor de pesquisa de serviços locais para idosos**
Projeto INTEP — Condeixa-a-Nova

---

## 📋 O que é?

O Simple System ajuda pessoas (especialmente idosos) a encontrar serviços profissionais perto de si: encanadores, eletricistas, pintores, veterinários, e mais.

O utilizador escolhe uma categoria, partilha a sua localização, e o sistema mostra os profissionais mais próximos com botões para ligar ou enviar WhatsApp.

---

## 🛠️ Tecnologias

| Componente    | Tecnologia                        |
|---------------|----------------------------------|
| Frontend      | HTML + CSS + JavaScript puro      |
| Backend       | Node.js nativo (zero dependências)|
| Base de Dados | Ficheiro JSON                     |

**Não é preciso instalar nada além do Node.js!**

---

## 🚀 Como executar (3 passos)

### 1. Instalar Node.js

Descarrega em: https://nodejs.org (versão 18 ou superior)

### 2. Criar a base de dados

```bash
node init-db.js
```

Cria o ficheiro `dados.json` com 96 profissionais fictícios em Condeixa-a-Nova.

### 3. Iniciar o servidor

```bash
node server.js
```

Abre no browser: **http://localhost:3000**

---

## 📡 Endpoints da API

### GET `/profissionais`

Pesquisa profissionais por categoria e proximidade.

```
GET /profissionais?categoria=encanador&lat=40.1138&lng=-8.4981
```

Parâmetros: `categoria` (obrigatório), `lat`, `lng`, `limite`

### POST `/profissionais`

Regista um novo profissional (corpo JSON).

### GET `/categorias`

Lista todas as categorias com totais.

### GET `/saude`

Verifica se o servidor está ativo.

---

## 📁 Estrutura do projeto

```
simple-system/
├── package.json       ← Configuração (sem dependências)
├── init-db.js         ← Cria a base de dados com dados de demo
├── server.js          ← Servidor backend (Node.js puro)
├── dados.json         ← Base de dados (criada pelo init-db)
└── public/            ← Frontend
    ├── index.html     ← Página principal
    ├── style.css      ← Estilos (design acessível)
    └── script.js      ← Lógica com fetch() à API
```

---

## 🎯 Categorias disponíveis

🔧 Encanador · ⚡ Eletricista · 🎨 Pintor · 🐾 Veterinário
🪚 Carpinteiro · 🌿 Jardineiro · 🧹 Limpeza · 🔩 Serralheiro

---

## 📍 Dados de demonstração

96 profissionais fictícios (12 locais × 8 categorias) em pontos reais de Condeixa-a-Nova: Centro, Tenesse Original, Escola Básica, Café Central, Junta de Freguesia, Museu PO.RO.S, Pingo Doce, Correios, Parque Municipal, Zona Industrial, e Conimbriga.

---

## 💡 Dicas para a apresentação INTEP

1. Abre no telemóvel para mostrar o design responsivo
2. Permite localização — profissionais ordenados por distância
3. Mostra os botões de ligar e WhatsApp com um toque
4. Testa várias categorias para mostrar a variedade

---

Projeto educativo — INTEP Condeixa-a-Nova 2026
