const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const geographieRoutes = require('./routes/geographieRoutes');
const centreDeVoteRoutes = require('./routes/centreDeVoteRoutes');
const posteDeVoteRoutes = require('./routes/posteDeVoteRoutes');
const electionRoutes = require('./routes/electionRoutes');
const partiRoutes = require('./routes/partiRoutes');
const resultSaisiRoutes = require('./routes/resultSaisiRoutes');
const resultatPartiRoutes = require('./routes/resultatPartiRoutes');
const compilationRoutes = require('./routes/compilationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const recapElectoralRoutes = require('./routes/recapElectoralRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminStatsRoutes = require('./routes/adminStatsRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { globalAuditMiddleware } = require('./middlewares/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../uploads')));

// Servir les fichiers uploadés de façon statique
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware d'audit global - trace toutes les requêtes authentifiées
// Exclure les chemins non pertinents pour l'audit
app.use(globalAuditMiddleware([
  '/uploads',      // Fichiers statiques
  '/api/health',   // Health checks
  '/favicon.ico',  // Favicon
]));

//Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', geographieRoutes);
app.use('/api/centres-de-vote', centreDeVoteRoutes);
app.use('/api/postes', posteDeVoteRoutes);
app.use('/api', electionRoutes);
app.use('/api', partiRoutes);
app.use('/api', resultSaisiRoutes);
app.use('/api/resultats-saisis', resultatPartiRoutes);
app.use('/api/compilations', compilationRoutes);
app.use('/api', auditLogRoutes);
app.use('/api', recapElectoralRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminStatsRoutes);

// Error handler (doit être après les routes)
app.use(errorHandler);



// Route de test
app.get('/api', (req, res) => {
  res.json({ message: 'API REST fonctionnelle!' });
});


// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});