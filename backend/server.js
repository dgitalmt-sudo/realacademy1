/* ============================================================
   server.js — Servidor estático simples
   ============================================================ */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor: http://localhost:${PORT}`);
  console.log(`📋 Site: http://localhost:${PORT}/inscricao.html`);
});
