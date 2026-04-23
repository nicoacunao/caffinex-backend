const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// db.connect((err) => {
//   if (err) {
//     console.error('Error conectando a MySQL:', err);
//     return;
//   }
//   // console.log('Conectado a MySQL');
// });

module.exports = db;