const electionStatsService = require('../services/election-stats.service');

class AdminStatsController {
  async getElectionStats(req, res) {
    try {
      const { electionId } = req.params;
      const { level } = req.query;

      const stats = await electionStatsService.getAllStats(electionId);

      // Filtrer par niveau si demandé
      if (level) {
        const levelKey = `par${level.charAt(0).toUpperCase()}${level.slice(1)}`;
        return res.json({
          success: true,
          data: {
            electionId: stats.electionId,
            type: stats.type,
            dateVote: stats.dateVote,
            [levelKey]: stats.stats[levelKey] || [],
            resume: stats.resume
          }
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getStatsByCommune(req, res) {
    try {
      const { electionId } = req.params;
      const data = await electionStatsService.getStatsByCommune(electionId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getStatsByArrondissement(req, res) {
    try {
      const { electionId } = req.params;
      const data = await electionStatsService.getStatsByArrondissement(electionId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getStatsByCentreDeVote(req, res) {
    try {
      const { electionId } = req.params;
      const data = await electionStatsService.getStatsByCentreDeVote(electionId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getResumeNational(req, res) {
    try {
      const { electionId } = req.params;
      const data = await electionStatsService.getResumeNational(electionId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminStatsController();
