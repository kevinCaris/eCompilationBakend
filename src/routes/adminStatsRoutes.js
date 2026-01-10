const express = require('express');
const router = express.Router();
const adminStatsController = require('../controllers/adminStatsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const electionStatsService = require('../services/election-stats.service');

// Toutes les routes requièrent l'authentification ADMIN
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Routes principales
router.get('/elections/:electionId/stats', adminStatsController.getElectionStats);
router.get('/elections/:electionId/stats/commune', adminStatsController.getStatsByCommune);
router.get('/elections/:electionId/stats/arrondissement', adminStatsController.getStatsByArrondissement);
router.get('/elections/:electionId/stats/centre', adminStatsController.getStatsByCentreDeVote);
router.get('/elections/:electionId/stats/resume-national', adminStatsController.getResumeNational);

// Route SSE pour les stats en temps réel
router.get('/elections/:electionId/stats/stream/live', (req, res) => {
  const { electionId } = req.params;
  const { interval = 2000 } = req.query; // Intervalle en ms, défaut 2s

  // Headers pour SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Envoie les stats immédiatement au client
  const sendStats = async () => {
    try {
      const stats = await electionStatsService.getAllStats(parseInt(electionId));
      const timestamp = new Date().toISOString();
      res.write(`data: ${JSON.stringify({ ...stats, timestamp })}\n\n`);
    } catch (error) {
      console.error('Erreur SSE stats:', error);
      res.write(`data: ${JSON.stringify({ error: error.message, timestamp: new Date().toISOString() })}\n\n`);
    }
  };

  // Première envoi immédiat
  sendStats();

  // Puis envoi périodique
  const intervalId = setInterval(sendStats, parseInt(interval));

  // Nettoyage à la déconnexion
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });

  // Gestion des erreurs
  req.on('error', () => {
    clearInterval(intervalId);
    res.end();
  });
});

module.exports = router;
