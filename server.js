const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

const brandsRoutes = require('./routes/brands');
const formatsRoutes = require('./routes/formats');
const notesRoutes = require('./routes/notes');

const coffeesRoutes = require('./routes/coffees');

const authRoutes = require('./routes/auth');

app.use(cors());
app.use(express.json());

app.use('/api', brandsRoutes);
app.use('/api', formatsRoutes);
app.use('/api', notesRoutes);
app.use('/api', coffeesRoutes);
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3007;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});