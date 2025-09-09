const express = require('express');
const router = express.Router();

const talentsData = require('../data/sid/talents');

// GET /api/talents/trees - retourne tous les arbres de talents
router.get('/trees', (req, res) => {
  try {
    const trees = talentsData.getAllTalentTrees();
    res.json({ success: true, trees });
  } catch (error) {
    console.error('❌ Erreur talents/trees:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des arbres de talents' });
  }
});

// GET /api/talents/trees/:className - retourne un arbre de talents par classe
router.get('/trees/:className', (req, res) => {
  try {
    const { className } = req.params;
    const tree = talentsData.getTalentTreeByClass(className);
    if (!tree) {
      return res.status(404).json({ error: 'Arbre de talents introuvable' });
    }
    res.json({ success: true, tree });
  } catch (error) {
    console.error('❌ Erreur talents/trees/:className:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'arbre de talents' });
  }
});

module.exports = router;

