const recapElectoralService = require('../services/recapElectoralService');
const { success, error } = require('../utils/response');
const fs = require('fs');
const path = require('path');

// ============ CHECK STATUS ============
const checkRecapStatus = async (req, res, next) => {
  try {
    const saId = req.user.userId;
    const { electionId } = req.query; 

    const status = await recapElectoralService.checkRecapStatus(saId, electionId);
    res.json(success(status, 'Statut récupéré avec succès'));
  } catch (err) {
    next(err);
  }
};

// ============ GET MY RECAPITULATIF ============
const getMyRecapitulatif = async (req, res, next) => {
  try {
    const saId = req.user.userId;
    const { electionId } = req.query;

    const recap = await recapElectoralService.getRecapBySAAndElection(saId, electionId);
    
    if (!recap) {
      return res.status(404).json(error('Aucun récapitulatif trouvé', 404));
    }

    res.json(success(recap, 'Récapitulatif récupéré avec succès'));
  } catch (err) {
    next(err);
  }
};

// ============ CREATE ============
const createRecapitulatifElectoral = async (req, res, next) => {
  try {
    const { typeElection, electionId, nombreElecteurs, nombreCentresDeVote, nombrePostesDeVote, raisonModification } = req.body;
    const saId = req.user.userId;

    // Si typeElection est fourni, récupérer l'élection correspondante
    let finalElectionId = electionId;
    if (typeElection && !electionId) {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Récupérer l'élection la plus récente du type spécifié
      const election = await prisma.election.findFirst({
        where: { type: typeElection },
        orderBy: { dateVote: 'desc' }
      });
      
      await prisma.$disconnect();
      
      if (!election) {
        return res.status(404).json(error(`Aucune élection de type ${typeElection} trouvée`, 404));
      }
      
      finalElectionId = election.id;
    }

    const recap = await recapElectoralService.createRecapitulatifElectoral({
      electionId: finalElectionId,
      saId,
      nombreElecteurs,
      nombreCentresDeVote,
      nombrePostesDeVote,
      raisonModification
    });

    res.status(201).json(success(recap, 'Récapitulatif électoral créé avec succès', 201));
  } catch (err) {
    if (err.message === 'ELECTION_ID_REQUIRED') {
      return res.status(400).json(error('ID d\'élection requis', 400));
    }
    if (err.message === 'NOMBRE_ELECTEURS_REQUIRED') {
      return res.status(400).json(error('Nombre d\'électeurs requis', 400));
    }
    if (err.message === 'NOMBRE_CENTRES_DE_VOTE_REQUIRED') {
      return res.status(400).json(error('Nombre de centres de vote requis', 400));
    }
    if (err.message === 'NOMBRE_POSTES_DE_VOTE_REQUIRED') {
      return res.status(400).json(error('Nombre de postes de vote requis', 400));
    }
    if (err.message === 'ELECTION_NOT_FOUND') {
      return res.status(404).json(error('Élection non trouvée', 404));
    }
    if (err.message === 'SA_NOT_FOUND') {
      return res.status(404).json(error('Utilisateur SA non trouvé', 404));
    }
    if (err.message === 'USER_NOT_SA') {
      return res.status(403).json(error('L\'utilisateur doit avoir le rôle SA', 403));
    }
    if (err.message === 'RECAP_ALREADY_EXISTS') {
      return res.status(409).json(error('Un récapitulatif existe déjà pour cette élection et ce SA', 409));
    }
    if (err.message === 'RECAP_ALREADY_EXISTS_SAME_YEAR') {
      const year = err.year || new Date().getFullYear();
      return res.status(409).json({
        success: false,
        message: `Un récapitulatif existe déjà pour l'année ${year}. Vous ne pouvez avoir qu'un seul récapitulatif par année.`,
        statusCode: 409,
        existingRecap: err.existingRecap || null,
        year: year
      });
    }
    next(err);
  }
};

// ============ GET ALL ============
const getAllRecapitulatifsElectoraux = async (req, res, next) => {
  try {
    const { electionId, saId, limit = 100, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await recapElectoralService.getAllRecapitulatifsElectoraux({
      electionId,
      saId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    res.json(success(result, 'Récapitulatifs électoraux récupérés avec succès'));
  } catch (err) {
    next(err);
  }
};

// ============ GET BY ID ============
const getRecapitulatifElectoralById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recap = await recapElectoralService.getRecapitulatifElectoralById(id);
    res.json(success(recap, 'Récapitulatif électoral récupéré avec succès'));
  } catch (err) {
    if (err.message === 'RECAP_ID_REQUIRED') {
      return res.status(400).json(error('ID de récapitulatif requis', 400));
    }
    if (err.message === 'RECAP_NOT_FOUND') {
      return res.status(404).json(error('Récapitulatif électoral non trouvé', 404));
    }
    next(err);
  }
};

// ============ UPDATE ============
const updateRecapitulatifElectoral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const recap = await recapElectoralService.updateRecapitulatifElectoral(id, data);
    res.json(success(recap, 'Récapitulatif électoral mis à jour avec succès'));
  } catch (err) {
    if (err.message === 'RECAP_ID_REQUIRED') {
      return res.status(400).json(error('ID de récapitulatif requis', 400));
    }
    if (err.message === 'RECAP_NOT_FOUND') {
      return res.status(404).json(error('Récapitulatif électoral non trouvé', 404));
    }
    next(err);
  }
};

// ============ DELETE ============
const deleteRecapitulatifElectoral = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await recapElectoralService.deleteRecapitulatifElectoral(id);
    res.json(success(result, 'Récapitulatif électoral supprimé avec succès'));
  } catch (err) {
    if (err.message === 'RECAP_ID_REQUIRED') {
      return res.status(400).json(error('ID de récapitulatif requis', 400));
    }
    if (err.message === 'RECAP_NOT_FOUND') {
      return res.status(404).json(error('Récapitulatif électoral non trouvé', 404));
    }
    next(err);
  }
};

// ============ GET BY ELECTION ============
const getRecapitulatifsElectorauxByElection = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await recapElectoralService.getRecapitulatifsElectorauxByElection(
      electionId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(success(result, 'Récapitulatifs électoraux par élection récupérés avec succès'));
  } catch (err) {
    if (err.message === 'ELECTION_ID_REQUIRED') {
      return res.status(400).json(error('ID d\'élection requis', 400));
    }
    if (err.message === 'ELECTION_NOT_FOUND') {
      return res.status(404).json(error('Élection non trouvée', 404));
    }
    next(err);
  }
};

// ============ GET BY SA ============
const getRecapitulatifsElectorauxBySA = async (req, res, next) => {
  try {
    const { saId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await recapElectoralService.getRecapitulatifsElectorauxBySA(
      saId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(success(result, 'Récapitulatifs électoraux du SA récupérés avec succès'));
  } catch (err) {
    if (err.message === 'SA_ID_REQUIRED') {
      return res.status(400).json(error('ID du SA requis', 400));
    }
    if (err.message === 'SA_NOT_FOUND') {
      return res.status(404).json(error('Utilisateur SA non trouvé', 404));
    }
    next(err);
  }
};

// ============ RAPPORT HIERARCHIQUE ============
const getRapportHierarchiqueByElection = async (req, res, next) => {
  try {
    const { electionId } = req.params;

    const rapport = await recapElectoralService.getRapportHierarchiqueByElection(electionId);
    res.json(success(rapport, 'Rapport hiérarchique récupéré avec succès'));
  } catch (err) {
    if (err.message === 'ELECTION_ID_REQUIRED') {
      return res.status(400).json(error('ID d\'élection requis', 400));
    }
    if (err.message === 'ELECTION_NOT_FOUND') {
      return res.status(404).json(error('Élection non trouvée', 404));
    }
    next(err);
  }
};

// ============ TABLEAU MATRICIEL ============
const getTableauMatriciel = async (req, res, next) => {
  try {
    const { electionId } = req.params;

    const tableau = await recapElectoralService.getTableauMatriciel(electionId);
    res.json(success(tableau, 'Tableau matriciel récupéré avec succès'));
  } catch (err) {
    if (err.message === 'ELECTION_ID_REQUIRED') {
      return res.status(400).json(error('ID d\'élection requis', 400));
    }
    if (err.message === 'ELECTION_NOT_FOUND') {
      return res.status(404).json(error('Élection non trouvée', 404));
    }
    next(err);
  }
};

// ============ EXPORT TABLEAU MATRICIEL EN PDF ============
const exportTableauMatricielPDF = async (req, res, next) => {
  try {
    const { electionId, communeId } = req.params;
    const PDFDocument = require('pdfkit');

    const tableau = await recapElectoralService.getTableauMatriciel(electionId, communeId);
    
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport_election_${electionId}.pdf"`);
    
    doc.pipe(res);

    const colonnes = tableau.colonnes;
    const lignes = tableau.lignes;
    const matrice = tableau.matrice;
    const circonscriptions = Array.from(new Set(colonnes.map(c => c.circonscriptionId))).map(id => {
      const arrsForCirc = colonnes.filter(c => c.circonscriptionId === id);
      return {
        id,
        nom: arrsForCirc[0].circonscriptionNom,
        commune: arrsForCirc[0].communeNom || '',
        departement: arrsForCirc[0].departementNom || '',
        arrondissements: arrsForCirc
      };
    });

    // Dimensions A4 Landscape
    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2); // 802px utilisable
    const pageHeight = 595 - (pageMargin * 2); // 555px utilisable
    
    // Calculer le nombre total de colonnes
    let totalDataCols = 0;
    circonscriptions.forEach(c => {
      totalDataCols += c.arrondissements.length + 1; // arrondissements + total circ
    });
    totalDataCols += 1; // Total général
    
    // Calculer les largeurs adaptatives
    const rubriquesWidth = 80; // Colonne des rubriques (fixe)
    const availableWidth = pageWidth - rubriquesWidth;
    const colWidth = Math.max(25, Math.floor(availableWidth / totalDataCols)); // Min 25px par colonne
    
    const rowHeight = 18;
    const headerHeight = rowHeight * 3;
    
    // Vérifier si tout rentre sur une page, sinon paginer
    const totalTableWidth = rubriquesWidth + (totalDataCols * colWidth);
    const needsPagination = totalTableWidth > pageWidth;
    
    // === EN-TÊTE OFFICIEL DU DOCUMENT ===
    const headerY = pageMargin;
    // Utiliser le dossier assets pour les images statiques (persisté lors du déploiement)
    const logoPath = path.join(__dirname, '../assets/images/logo_benin.jpeg');
    const logoSize = 50;
    
    // Logo centré en haut
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth / 2) - (logoSize / 2) + pageMargin, headerY, { 
          width: logoSize, 
          height: logoSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement logo:', err);
    }
    
    // Image du blason du Bénin - À gauche du bloc
    const coatOfArmsPath = path.join(__dirname, '../assets/images/Coat_of_arms_of_Benin.png');
    const coatOfArmsSize = 55;
    const coatOfArmsX = pageMargin;
    
    try {
      if (fs.existsSync(coatOfArmsPath)) {
        doc.image(coatOfArmsPath, coatOfArmsX, headerY, { 
          width: coatOfArmsSize, 
          height: coatOfArmsSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement blason:', err);
    }
    
    // Bloc central - Ministère + Ligne colorée + Devise + République
    const blocLeftX = pageMargin + coatOfArmsSize + 10;
    const blocWidth = 120;
    const leftTextY = headerY + 5;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 8, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 16, { width: blocWidth, align: 'left' });
    
    // Ligne décorative avec les couleurs du drapeau béninois (vert, jaune, rouge)
    const flagLineY = leftTextY + 28;
    const flagLineHeight = 5;
    const flagLineWidth = 110;
    const colorWidth = flagLineWidth / 3;
    
    // Vert
    doc.rect(blocLeftX, flagLineY, colorWidth, flagLineHeight).fill('#007A5E');
    // Jaune
    doc.rect(blocLeftX + colorWidth, flagLineY, colorWidth, flagLineHeight).fill('#FCD116');
    // Rouge
    doc.rect(blocLeftX + colorWidth * 2, flagLineY, colorWidth, flagLineHeight).fill('#CE1126');
    
    // Devise et République dans le bloc
    doc.fontSize(7).font('Helvetica').fillColor('#000');
    doc.text('MAIRIE DE COTONOU', blocLeftX, flagLineY + 8, { width: blocWidth, align: 'left' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
    doc.text('RÉPUBLIQUE DU BÉNIN', blocLeftX, flagLineY + 18, { width: blocWidth, align: 'left' });
    
    // Colonne droite - Coordonnées
    doc.fontSize(7).font('Helvetica');
    const rightX = pageWidth - 120;
    doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 8, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 16, { width: 120, align: 'right' });
    
    // Ligne horizontale après l'en-tête
    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();
    
    // Titre principal centré
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('RÉCAPITULATIF ÉLECTORAL PAR CIRCONSCRIPTION', pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });
    
    // Infos Département et Commune
    if (circonscriptions.length > 0) {
      const commune = circonscriptions[0].commune;
      const departement = circonscriptions[0].departement || '';
      doc.fontSize(9).font('Helvetica');
      doc.text(`Département: ${departement}  |  Commune: ${commune}`, pageMargin, lineY1 + 24, { 
        width: pageWidth, 
        align: 'center' 
      });
    }
    
    // Ligne horizontale après les infos
    const lineY2 = lineY1 + 40;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();
    
    // Position de départ du tableau
    doc.y = lineY2 + 10;

    let startY = doc.y;
    let x = pageMargin;
    let y = startY;
    
    // === DESSINER L'EN-TÊTE DU TABLEAU ===
    const drawTableHeader = (startX, startY) => {
      let x = startX;
      const y1 = startY;
      const y2 = startY + rowHeight;
      const y3 = startY + rowHeight * 2;
      
      // Cellule RUBRIQUES
      doc.rect(x, y1, rubriquesWidth, headerHeight).stroke();
      doc.fontSize(7).font('Helvetica-Bold').text('RUBRIQUES', x + 2, y1 + rowHeight + 2, { 
        width: rubriquesWidth - 4, align: 'center' 
      });
      x += rubriquesWidth;
      
      // Pour chaque circonscription
      circonscriptions.forEach((circ) => {
        const nbArr = circ.arrondissements.length;
        const circTotalWidth = (nbArr + 1) * colWidth; // arrondissements + total
        
        // Niveau 1: Nom circonscription
        doc.rect(x, y1, circTotalWidth, rowHeight).stroke();
        doc.fontSize(6).text(circ.nom.substring(0, 15), x + 1, y1 + 4, { 
          width: circTotalWidth - 2, align: 'center' 
        });
        
        // Niveau 2: Arrondissements + Total
        const arrWidth = nbArr * colWidth;
        doc.rect(x, y2, arrWidth, rowHeight).stroke();
        doc.fontSize(5).text('ARROND.', x + 1, y2 + 4, { 
          width: arrWidth - 2, align: 'center' 
        });
        
        doc.rect(x + arrWidth, y2, colWidth, rowHeight * 2).stroke();
        doc.fontSize(5).text('TOTAL', x + arrWidth + 1, y2 + rowHeight / 2 + 2, { 
          width: colWidth - 2, align: 'center' 
        });
        
        // Niveau 3: Numéros arrondissements
        let xArr = x;
        circ.arrondissements.forEach((arr, idx) => {
          doc.rect(xArr, y3, colWidth, rowHeight).stroke();
          const num = parseInt(arr.arrondissementCode) || (idx + 1);
          doc.fontSize(5).text(`${num}`, xArr + 1, y3 + 4, { 
            width: colWidth - 2, align: 'center' 
          });
          xArr += colWidth;
        });
        
        x += circTotalWidth;
      });
      
      // Total Général
      doc.rect(x, y1, colWidth, headerHeight).stroke();
      doc.fontSize(5).text('TOTAL', x + 1, y1 + rowHeight - 2, { width: colWidth - 2, align: 'center' });
      doc.text('GÉN.', x + 1, y1 + rowHeight + 6, { width: colWidth - 2, align: 'center' });
      
      return startY + headerHeight;
    };
    
    y = drawTableHeader(pageMargin, y);
    
    // === DESSINER LES DONNÉES ===
    doc.fontSize(6).font('Helvetica');
    
    lignes.forEach((ligne, ligneIndex) => {
      // Vérifier si on doit passer à une nouvelle page
      if (y + rowHeight > pageHeight + pageMargin) {
        doc.addPage({ margin: 20, layout: 'landscape' });
        y = pageMargin;
        y = drawTableHeader(pageMargin, y);
        doc.fontSize(6).font('Helvetica');
      }
      
      x = pageMargin;
      
      // Colonne RUBRIQUES
      doc.rect(x, y, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(5).text(ligne.substring(0, 20), x + 2, y + 5, { 
        width: rubriquesWidth - 4, align: 'left' 
      });
      doc.font('Helvetica').fontSize(6);
      x += rubriquesWidth;
      
      let totalGeneral = 0;
      
      // Pour chaque circonscription
      circonscriptions.forEach((circ) => {
        let totalCirc = 0;
        
        // Valeurs des arrondissements
        circ.arrondissements.forEach((arr) => {
          const colIndex = colonnes.findIndex(c => c.arrondissementId === arr.arrondissementId);
          const valeur = colIndex >= 0 && matrice[ligne] ? (matrice[ligne][colIndex] || 0) : 0;
          
          doc.rect(x, y, colWidth, rowHeight).stroke();
          doc.fontSize(5).text(valeur.toString(), x + 1, y + 5, { 
            width: colWidth - 2, align: 'center' 
          });
          x += colWidth;
          totalCirc += Number(valeur) || 0;
        });
        
        // Total circonscription
        doc.rect(x, y, colWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(5);
        doc.text(totalCirc.toString(), x + 1, y + 5, { width: colWidth - 2, align: 'center' });
        doc.font('Helvetica').fontSize(6);
        x += colWidth;
        
        totalGeneral += totalCirc;
      });
      
      // Total général
      doc.rect(x, y, colWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(5);
      doc.text(totalGeneral.toString(), x + 1, y + 5, { width: colWidth - 2, align: 'center' });
      doc.font('Helvetica').fontSize(6);
      
      y += rowHeight;
    });

    // Footer
    doc.fontSize(7).fillColor('#666').text(
      `Généré le: ${new Date().toLocaleString('fr-FR')}`, 
      pageMargin, 
      Math.min(y + 15, pageHeight + pageMargin - 20), 
      { align: 'right', width: pageWidth }
    );
    
    doc.end();

  } catch (err) {
    if (err.message === 'ELECTION_ID_REQUIRED') {
      return res.status(400).json(error('ID d\'élection requis', 400));
    }
    if (err.message === 'COMMUNE_ID_REQUIRED') {
      return res.status(400).json(error('ID de commune requis', 400));
    }
    if (err.message === 'ELECTION_NOT_FOUND') {
      return res.status(404).json(error('Élection non trouvée', 404));
    }
    if (err.message === 'COMMUNE_NOT_FOUND') {
      return res.status(404).json(error('Commune non trouvée', 404));
    }
    next(err);
  }
};

// ============ EXPORT CENTRE DÉTAIL EN PDF ============
const exportCentreDetailPDF = async (req, res, next) => {
  try {
    const { electionId, centreId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer le centre avec ses infos géographiques et les agents
    const centre = await prisma.centreDeVote.findUnique({
      where: { id: centreId },
      include: {
        quartier: {
          include: {
            arrondissement: {
              include: {
                circonscription: {
                  include: {
                    commune: {
                      include: {
                        departement: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telephone: true,
            role: true
          }
        },
        postesDeVote: {
          include: {
            resultSaisies: {
              where: { electionId },
              include: {
                resultPartis: {
                  include: {
                    parti: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!centre) {
      await prisma.$disconnect();
      return res.status(404).json(error('Centre de vote non trouvé', 404));
    }

    // Récupérer tous les partis de l'élection
    const partis = await prisma.parti.findMany({
      where: { electionId }
    });

    await prisma.$disconnect();

    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="centre_detail_${centreId}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2);
    const pageHeight = 595 - (pageMargin * 2);

    // === EN-TÊTE OFFICIEL ===
    const headerY = pageMargin;
    // Utiliser le dossier assets pour les images statiques (persisté lors du déploiement)
    const logoPath = path.join(__dirname, '../assets/images/logo_benin.jpeg');
    const logoSize = 40;
    
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth / 2) - (logoSize / 2) + pageMargin, headerY, { 
          width: logoSize, 
          height: logoSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement logo:', err);
    }

    // Blason
    const coatOfArmsPath = path.join(__dirname, '../assets/images/Coat_of_arms_of_Benin.png');
    const coatOfArmsSize = 35;
    const coatOfArmsX = pageMargin;
    
    try {
      if (fs.existsSync(coatOfArmsPath)) {
        doc.image(coatOfArmsPath, coatOfArmsX, headerY, { 
          width: coatOfArmsSize, 
          height: coatOfArmsSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement blason:', err);
    }

    // Texte ministère et infos
    const blocLeftX = pageMargin + coatOfArmsSize + 10;
    const blocWidth = 120;
    const leftTextY = headerY + 5;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 8, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 16, { width: blocWidth, align: 'left' });

    const flagLineY = leftTextY + 28;
    const flagLineHeight = 5;
    const flagLineWidth = 110;
    const colorWidth = flagLineWidth / 3;
    
    doc.rect(blocLeftX, flagLineY, colorWidth, flagLineHeight).fill('#007A5E');
    doc.rect(blocLeftX + colorWidth, flagLineY, colorWidth, flagLineHeight).fill('#FCD116');
    doc.rect(blocLeftX + colorWidth * 2, flagLineY, colorWidth, flagLineHeight).fill('#CE1126');
    
    doc.fontSize(7).font('Helvetica').fillColor('#000');
    doc.text('MAIRIE DE COTONOU', blocLeftX, flagLineY + 8, { width: blocWidth, align: 'left' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
    doc.text('RÉPUBLIQUE DU BÉNIN', blocLeftX, flagLineY + 18, { width: blocWidth, align: 'left' });
    
    // Coordonnées droite
    doc.fontSize(7).font('Helvetica');
    const rightX = pageWidth - 120;
    doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 8, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 16, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    // Titre
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('DÉTAIL DU CENTRE DE VOTE', pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    // Infos géographiques
    const departement = centre.quartier?.arrondissement?.circonscription?.commune?.departement?.nom || '';
    const commune = centre.quartier?.arrondissement?.circonscription?.commune?.nom || '';
    const arrondissement = centre.quartier?.arrondissement?.nom || '';
    const quartier = centre.quartier?.nom || '';
    
    doc.fontSize(8).font('Helvetica');
    const infoY = lineY1 + 24;
    doc.text(`Département: ${departement}`, pageMargin, infoY, { width: pageWidth / 2 });
    doc.text(`Commune: ${commune}`, pageMargin + pageWidth / 2, infoY, { width: pageWidth / 2 });
    doc.text(`Arrondissement: ${arrondissement}`, pageMargin, infoY + 8, { width: pageWidth / 2 });
    doc.text(`Quartier: ${quartier}`, pageMargin + pageWidth / 2, infoY + 8, { width: pageWidth / 2 });
    doc.text(`Centre: ${centre.nom}`, pageMargin, infoY + 16, { width: pageWidth });

    const lineY2 = infoY + 30;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // Tableau
    let tableY = lineY2 + 10;
    const postes = centre.postesDeVote || [];
    const nbPostes = postes.length;
    const postWidth = Math.max(40, (pageWidth - 80) / (nbPostes + 1));
    const rubriquesWidth = 80;
    const rowHeight = 16;

    // En-tête du tableau
    doc.fontSize(6).font('Helvetica-Bold');
    let x = pageMargin;
    
    // Colonne rubriques
    doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
    doc.text('RUBRIQUES', x + 2, tableY + 4, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    // Colonnes postes
    postes.forEach((poste, index) => {
      doc.rect(x, tableY, postWidth, rowHeight).stroke();
      doc.fontSize(5).text(`Poste ${index + 1}`, x + 1, tableY + 4, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      x += postWidth;
    });

    // Colonne TOTAL
    doc.fontSize(6).font('Helvetica-Bold');
    doc.rect(x, tableY, postWidth, rowHeight).stroke();
    doc.text('TOTAL', x + 2, tableY + 4, { width: postWidth - 4, align: 'center' });

    tableY += rowHeight;

    // Rubriques et données
    const rubriques = [
      { key: 'nombreInscrits', label: 'Nombre Inscrits' },
      { key: 'nombreVotants', label: 'Nombre Votants' },
      { key: 'suffragesExprimes', label: 'Suffrages Exprimés' },
      { key: 'abstentions', label: 'Abstentions' },
      { key: 'bulletinsNuls', label: 'Bulletins Nuls' },
      { key: 'derogations', label: 'Dérrogations' },
      { key: 'procurations', label: 'Procurations' },
      { key: 'tauxParticipation', label: 'Taux Participation (%)' }
    ];

    doc.fontSize(5).font('Helvetica');

    // Rubriques principales
    rubriques.forEach(rubrique => {
      x = pageMargin;
      
      // Label rubrique
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label.substring(0, 20), x + 2, tableY + 4, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      let total = 0;

      // Données par poste
      postes.forEach(poste => {
        const resultSaisi = poste.resultSaisies[0];
        const valeur = resultSaisi ? (resultSaisi[rubrique.key] || 0) : 0;
        
        doc.rect(x, tableY, postWidth, rowHeight).stroke();
        doc.text(valeur.toString(), x + 1, tableY + 4, { 
          width: postWidth - 2, 
          align: 'center' 
        });
        x += postWidth;
        total += Number(valeur) || 0;
      });

      // Total
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(total.toString(), x + 1, tableY + 4, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica');

      tableY += rowHeight;
    });

    // Partis et leurs voix
    partis.forEach(parti => {
      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(5).text(`${parti.sigle || parti.nom}`, x + 2, tableY + 4, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      let totalVoix = 0;

      postes.forEach(poste => {
        const resultSaisi = poste.resultSaisies[0];
        let voix = 0;
        
        if (resultSaisi) {
          const resultatParti = resultSaisi.resultPartis.find(rp => rp.partiId === parti.id);
          voix = resultatParti ? (resultatParti.voix || 0) : 0;
        }
        
        doc.rect(x, tableY, postWidth, rowHeight).stroke();
        doc.fontSize(5).text(voix.toString(), x + 1, tableY + 4, { 
          width: postWidth - 2, 
          align: 'center' 
        });
        x += postWidth;
        totalVoix += Number(voix) || 0;
      });

      // Total parti
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(5).text(totalVoix.toString(), x + 1, tableY + 4, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica');

      tableY += rowHeight;
    });

    // Ligne TOTAL finale
    x = pageMargin;
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(6).text('TOTAL', x + 2, tableY + 4, { 
      width: rubriquesWidth - 4, 
      align: 'center' 
    });
    x += rubriquesWidth;

    // Totaux par poste
    postes.forEach(poste => {
      const resultSaisi = poste.resultSaisies[0];
      const total = resultSaisi ? (resultSaisi.suffragesExprimes || 0) : 0;
      
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(5).text(total.toString(), x + 1, tableY + 4, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      x += postWidth;
    });

    // Total général
    const totalGeneral = postes.reduce((sum, poste) => {
      const resultSaisi = poste.resultSaisies[0];
      return sum + (resultSaisi ? (resultSaisi.suffragesExprimes || 0) : 0);
    }, 0);

    doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#c0c0c0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(6).text(totalGeneral.toString(), x + 1, tableY + 4, { 
      width: postWidth - 2, 
      align: 'center' 
    });

    // === FOOTER AVEC SIGNATURE ===
    const footerY = tableY + 40;
    const footerLineSpacing = 10;

    // Infos collecteur/agent
    const agents = centre.users || [];
    const collecteur = agents.length > 0 ? agents[0] : null;
    const collecteurNom = collecteur ? `${collecteur.firstName || ''} ${collecteur.lastName || ''}`.trim() : '';
    const collecteurTel = collecteur?.telephone || '';

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
    doc.text('Agent Collecteur:', pageMargin, footerY);
    
    doc.fontSize(7).font('Helvetica');
    if (collecteurNom) {
      doc.text(`Nom: ${collecteurNom}`, pageMargin, footerY + 12);
    }
    if (collecteurTel) {
      doc.text(`Tél: ${collecteurTel}`, pageMargin, footerY + 22);
    }

    // Espace pour signature
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Signature:', pageMargin + pageWidth - 150, footerY);
    doc.moveTo(pageMargin + pageWidth - 150, footerY + 35).lineTo(pageMargin + pageWidth - 20, footerY + 35).stroke();
    doc.fontSize(6).font('Helvetica').fillColor('#999').text('(Signature de l\'agent)', pageMargin + pageWidth - 150, footerY + 38);

    // Date génération en bas
    doc.fontSize(7).fillColor('#666').font('Helvetica');
    doc.text(
      `Généré le: ${new Date().toLocaleString('fr-FR')}`, 
      pageMargin, 
      footerY + 50, 
      { align: 'left', width: pageWidth }
    );

    doc.end();

  } catch (err) {
    console.error('Erreur export centre:', err);
    next(err);
  }
};

// ============ EXPORT CIRCONSCRIPTION PDF ============
const exportCirconscriptionPDF = async (req, res, next) => {
  try {
    const { electionId, circonscriptionId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer la circonscription avec ses arrondissements
    const circonscription = await prisma.circonscription.findUnique({
      where: { id: circonscriptionId },
      include: {
        commune: {
          include: {
            departement: true
          }
        },
        arrondissements: {
          include: {
            quartiers: {
              include: {
                centresDeVote: {
                  include: {
                    postesDeVote: {
                      include: {
                        resultSaisies: {
                          where: { electionId },
                          include: {
                            resultPartis: {
                              include: {
                                parti: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!circonscription) {
      await prisma.$disconnect();
      return res.status(404).json(error('Circonscription non trouvée', 404));
    }

    // Récupérer tous les partis de l'élection
    const partis = await prisma.parti.findMany({
      where: { electionId }
    });

    await prisma.$disconnect();

    // Calcul des données par arrondissement
    const arrondissements = circonscription.arrondissements;
    const rubriques = [
      { key: 'nombreInscrits', label: 'Nombre Inscrits' },
      { key: 'nombreVotants', label: 'Nombre Votants' },
      { key: 'suffragesExprimes', label: 'Suffrages Exprimés' },
      { key: 'abstentions', label: 'Abstentions' },
      { key: 'bulletinsNuls', label: 'Bulletins Nuls' },
      { key: 'procurations', label: 'Procurations' },
      { key: 'derogations', label: 'Dérrogations' }
    ];

    // Fonction pour calculer les totaux par arrondissement
    const calculerTotauxArrondissement = (arrondissement, rubriqueKey) => {
      let total = 0;
      arrondissement.quartiers.forEach(quartier => {
        quartier.centresDeVote.forEach(centre => {
          centre.postesDeVote.forEach(poste => {
            poste.resultSaisies.forEach(resultSaisi => {
              total += resultSaisi[rubriqueKey] || 0;
            });
          });
        });
      });
      return total;
    };

    // Fonction pour calculer les voix d'un parti par arrondissement
    const calculerVoixPartiArrondissement = (arrondissement, partiId) => {
      let total = 0;
      arrondissement.quartiers.forEach(quartier => {
        quartier.centresDeVote.forEach(centre => {
          centre.postesDeVote.forEach(poste => {
            poste.resultSaisies.forEach(resultSaisi => {
              const resultatParti = resultSaisi.resultPartis.find(rp => rp.partiId === partiId);
              total += resultatParti ? (resultatParti.voix || 0) : 0;
            });
          });
        });
      });
      return total;
    };

    // Préparer les données
    const donnees = {
      rubriques: {},
      partis: {}
    };

    rubriques.forEach(rubrique => {
      donnees.rubriques[rubrique.key] = {
        label: rubrique.label,
        arrondonissements: arrondissements.map(arr => calculerTotauxArrondissement(arr, rubrique.key)),
        total: 0
      };
      donnees.rubriques[rubrique.key].total = donnees.rubriques[rubrique.key].arrondonissements.reduce((a, b) => a + b, 0);
    });

    partis.forEach(parti => {
      donnees.partis[parti.id] = {
        nom: parti.sigle || parti.nom,
        arrondonissements: arrondissements.map(arr => calculerVoixPartiArrondissement(arr, parti.id)),
        total: 0
      };
      donnees.partis[parti.id].total = donnees.partis[parti.id].arrondonissements.reduce((a, b) => a + b, 0);
    });

    // Créer le PDF
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="circonscription_${circonscriptionId}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2);
    const pageHeight = 595 - (pageMargin * 2);

    // === EN-TÊTE OFFICIEL ===
    const headerY = pageMargin;
    // Utiliser le dossier assets pour les images statiques (persisté lors du déploiement)
    const logoPath = path.join(__dirname, '../assets/images/logo_benin.jpeg');
    const logoSize = 40;
    
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth / 2) - (logoSize / 2) + pageMargin, headerY, { 
          width: logoSize, 
          height: logoSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement logo:', err);
    }

    const coatOfArmsPath = path.join(__dirname, '../assets/images/Coat_of_arms_of_Benin.png');
    const coatOfArmsSize = 35;
    
    try {
      if (fs.existsSync(coatOfArmsPath)) {
        doc.image(coatOfArmsPath, pageMargin, headerY, { 
          width: coatOfArmsSize, 
          height: coatOfArmsSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement blason:', err);
    }

    const blocLeftX = pageMargin + coatOfArmsSize + 10;
    const blocWidth = 120;
    const leftTextY = headerY + 5;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 8, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 16, { width: blocWidth, align: 'left' });

    const flagLineY = leftTextY + 28;
    const flagLineHeight = 5;
    const flagLineWidth = 110;
    const colorWidth = flagLineWidth / 3;
    
    doc.rect(blocLeftX, flagLineY, colorWidth, flagLineHeight).fill('#007A5E');
    doc.rect(blocLeftX + colorWidth, flagLineY, colorWidth, flagLineHeight).fill('#FCD116');
    doc.rect(blocLeftX + colorWidth * 2, flagLineY, colorWidth, flagLineHeight).fill('#CE1126');
    
    doc.fontSize(7).font('Helvetica').fillColor('#000');
    doc.text('MAIRIE DE COTONOU', blocLeftX, flagLineY + 8, { width: blocWidth, align: 'left' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
    doc.text('RÉPUBLIQUE DU BÉNIN', blocLeftX, flagLineY + 18, { width: blocWidth, align: 'left' });
    
    const rightX = pageWidth - 120;
    doc.fontSize(7).font('Helvetica');
    doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 8, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 16, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`RÉCAPITULATIF DE LA CIRCONSCRIPTION ELECTORALE ${circonscription.nom}`, pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    const departement = circonscription.commune?.departement?.nom || '';
    const commune = circonscription.commune?.nom || '';
    doc.fontSize(8).font('Helvetica');
    doc.text(`Département: ${departement}  |  Commune: ${commune}`, pageMargin, lineY1 + 24, { 
      width: pageWidth, 
      align: 'center' 
    });

    const lineY2 = lineY1 + 40;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // === TABLEAU ===
    let tableY = lineY2 + 10;
    const nbArrond = arrondissements.length;
    const arrondWidth = Math.max(40, (pageWidth - 80) / (nbArrond + 1));
    const rubriquesWidth = 80;
    const rowHeight = 14;

    // En-tête
    doc.fontSize(6).font('Helvetica-Bold');
    let x = pageMargin;
    
    doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
    doc.text('RUBRIQUES', x + 2, tableY + 4, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    arrondissements.forEach((arr, index) => {
      doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
      doc.fontSize(5).text(`Arrond. ${arr.code || arr.nom}`, x + 1, tableY + 4, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      x += arrondWidth;
    });

    doc.fontSize(6).font('Helvetica-Bold');
    doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
    doc.text('TOTAL', x + 2, tableY + 4, { width: arrondWidth - 4, align: 'center' });

    tableY += rowHeight;
    doc.fontSize(5).font('Helvetica');

    // Rubriques
    rubriques.forEach(rubrique => {
      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label.substring(0, 18), x + 2, tableY + 2, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const rubricData = donnees.rubriques[rubrique.key];
      rubricData.arrondonissements.forEach(val => {
        doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 2, { width: arrondWidth - 2, align: 'center' });
        x += arrondWidth;
      });

      doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(rubricData.total.toString(), x + 1, tableY + 2, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica').fillColor('#000');

      tableY += rowHeight;
    });

    // Partis
    partis.forEach(parti => {
      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text((parti.sigle || parti.nom).substring(0, 18), x + 2, tableY + 2, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const partiData = donnees.partis[parti.id];
      partiData.arrondonissements.forEach(val => {
        doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 2, { width: arrondWidth - 2, align: 'center' });
        x += arrondWidth;
      });

      doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(partiData.total.toString(), x + 1, tableY + 2, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica').fillColor('#000');

      tableY += rowHeight;
    });

    // Ligne TOTAL
    x = pageMargin;
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text('TOTAL VOIX', x + 2, tableY + 2, { 
      width: rubriquesWidth - 4, 
      align: 'center' 
    });
    x += rubriquesWidth;

    arrondissements.forEach((arr, index) => {
      let total = 0;
      partis.forEach(parti => {
        total += donnees.partis[parti.id].arrondonissements[index];
      });

      doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(total.toString(), x + 1, tableY + 2, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      x += arrondWidth;
    });

    const totalGeneral = partis.reduce((sum, parti) => sum + donnees.partis[parti.id].total, 0);
    doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#c0c0c0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(totalGeneral.toString(), x + 1, tableY + 2, { 
      width: arrondWidth - 2, 
      align: 'center' 
    });

    // === FOOTER ===
    const footerY = tableY + 30;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
    doc.text('SIGNATURE', pageMargin, footerY);

    doc.fontSize(8).font('Helvetica');
    const col1X = pageMargin;
    const col2X = pageMargin + pageWidth / 2;

    doc.text('Nom et Prénom: ............................', col1X, footerY + 12);
    doc.text('Signature: ............................', col2X, footerY + 12);

    doc.text('Date: ________________', col1X, footerY + 28);
    doc.fontSize(7).fillColor('#666');
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, col2X, footerY + 28);

    doc.end();

  } catch (err) {
    console.error('Erreur export circonscription:', err);
    next(err);
  }
};

// ============ EXPORT CENTRES PAR ARRONDISSEMENT PDF ============
const exportCentresParArrondissementPDF = async (req, res, next) => {
  try {
    const { electionId, arrondissementId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer l'arrondissement avec ses quartiers et centres
    const arrondissement = await prisma.arrondissement.findUnique({
      where: { id: arrondissementId },
      include: {
        circonscription: {
          include: {
            commune: {
              include: {
                departement: true
              }
            }
          }
        },
        quartiers: {
          include: {
            centresDeVote: {
              include: {
                postesDeVote: {
                  include: {
                    resultSaisies: {
                      where: { electionId },
                      include: {
                        resultPartis: {
                          include: {
                            parti: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!arrondissement) {
      await prisma.$disconnect();
      return res.status(404).json(error('Arrondissement non trouvé', 404));
    }

    // Récupérer l'élection
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      await prisma.$disconnect();
      return res.status(404).json(error('Élection non trouvée', 404));
    }

    // Récupérer tous les partis de l'élection
    const partis = await prisma.parti.findMany({
      where: { electionId }
    });

    // Convertir les données Prisma en objets simples avant déconnexion
    const centresData = JSON.parse(JSON.stringify(arrondissement.quartiers));
    const partisData = JSON.parse(JSON.stringify(partis));
    
    await prisma.$disconnect();

    // Reconstruire les données après déconnexion
    const arrondissementData = JSON.parse(JSON.stringify(arrondissement));
    const electionsData = JSON.parse(JSON.stringify(election));

    // Collecter tous les centres de l'arrondissement
    const centres = [];
    centresData.forEach(quartier => {
      quartier.centresDeVote.forEach(centre => {
        centres.push({
          ...centre,
          quartierNom: quartier.nom
        });
      });
    });

    if (centres.length === 0) {
      return res.status(404).json(error('Aucun centre de vote trouvé dans cet arrondissement', 404));
    }

    // Rubriques
    const rubriques = [
      { key: 'nombreInscrits', label: 'Nombre Inscrits' },
      { key: 'nombreVotants', label: 'Nombre Votants' },
      { key: 'suffragesExprimes', label: 'Suffrages Exprimés' },
      { key: 'abstentions', label: 'Abstentions' },
      { key: 'bulletinsNuls', label: 'Bulletins Nuls' },
      { key: 'procurations', label: 'Procurations' },
      { key: 'derogations', label: 'Dérogations' }
    ];

    // Fonction pour calculer les totaux par centre
    const calculerTotauxCentre = (centre, rubriqueKey) => {
      let total = 0;
      centre.postesDeVote.forEach(poste => {
        poste.resultSaisies.forEach(resultSaisi => {
          total += resultSaisi[rubriqueKey] || 0;
        });
      });
      return total;
    };

    // Fonction pour calculer les voix d'un parti par centre
    const calculerVoixPartiCentre = (centre, partiId) => {
      let total = 0;
      centre.postesDeVote.forEach(poste => {
        poste.resultSaisies.forEach(resultSaisi => {
          const resultatParti = resultSaisi.resultPartis.find(rp => rp.partiId === partiId);
          total += resultatParti ? (resultatParti.voix || 0) : 0;
        });
      });
      return total;
    };

    // Préparer les données
    const donnees = {
      rubriques: {},
      partis: {}
    };

    rubriques.forEach(rubrique => {
      donnees.rubriques[rubrique.key] = {
        label: rubrique.label,
        centres: centres.map(centre => calculerTotauxCentre(centre, rubrique.key)),
        total: 0
      };
      donnees.rubriques[rubrique.key].total = donnees.rubriques[rubrique.key].centres.reduce((a, b) => a + b, 0);
    });

    partisData.forEach(parti => {
      donnees.partis[parti.id] = {
        nom: parti.sigle || parti.nom,
        centres: centres.map(centre => calculerVoixPartiCentre(centre, parti.id)),
        total: 0
      };
      donnees.partis[parti.id].total = donnees.partis[parti.id].centres.reduce((a, b) => a + b, 0);
    });

    // Créer le PDF
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="centres_arrondissement_${arrondissementId}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2);
    const pageHeight = 595 - (pageMargin * 2);

    // === EN-TÊTE OFFICIEL ===
    const headerY = pageMargin;
    // Utiliser le dossier assets pour les images statiques (persisté lors du déploiement)
    const logoPath = path.join(__dirname, '../assets/images/logo_benin.jpeg');
    const logoSize = 40;
    
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth / 2) - (logoSize / 2) + pageMargin, headerY, { 
          width: logoSize, 
          height: logoSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement logo:', err);
    }

    const coatOfArmsPath = path.join(__dirname, '../assets/images/Coat_of_arms_of_Benin.png');
    const coatOfArmsSize = 35;
    
    try {
      if (fs.existsSync(coatOfArmsPath)) {
        doc.image(coatOfArmsPath, pageMargin, headerY, { 
          width: coatOfArmsSize, 
          height: coatOfArmsSize 
        });
      }
    } catch (err) {
      console.error('Erreur chargement blason:', err);
    }

    const blocLeftX = pageMargin + coatOfArmsSize + 10;
    const blocWidth = 120;
    const leftTextY = headerY + 5;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 8, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 16, { width: blocWidth, align: 'left' });

    const flagLineY = leftTextY + 28;
    const flagLineHeight = 5;
    const flagLineWidth = 110;
    const colorWidth = flagLineWidth / 3;
    
    doc.rect(blocLeftX, flagLineY, colorWidth, flagLineHeight).fill('#007A5E');
    doc.rect(blocLeftX + colorWidth, flagLineY, colorWidth, flagLineHeight).fill('#FCD116');
    doc.rect(blocLeftX + colorWidth * 2, flagLineY, colorWidth, flagLineHeight).fill('#CE1126');
    
    doc.fontSize(7).font('Helvetica').fillColor('#000');
    doc.text('MAIRIE DE COTONOU', blocLeftX, flagLineY + 8, { width: blocWidth, align: 'left' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
    doc.text('RÉPUBLIQUE DU BÉNIN', blocLeftX, flagLineY + 18, { width: blocWidth, align: 'left' });
    
    const rightX = pageWidth - 120;
    doc.fontSize(7).font('Helvetica');
    doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 8, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 16, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    // Titre
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`RÉCAPITULATIF DES CENTRES DE VOTE - ${arrondissementData.nom.toUpperCase()}`, pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    const departement = arrondissementData.circonscription?.commune?.departement?.nom || '';
    const commune = arrondissementData.circonscription?.commune?.nom || '';
    const circonscription = arrondissementData.circonscription?.nom || '';
    doc.fontSize(8).font('Helvetica');
    doc.text(`Département: ${departement}  |  Commune: ${commune}  |  Circonscription: ${circonscription}`, pageMargin, lineY1 + 24, { 
      width: pageWidth, 
      align: 'center' 
    });
    doc.text(`Élection: ${electionsData.type} du ${new Date(electionsData.dateVote).toLocaleDateString('fr-FR')}`, pageMargin, lineY1 + 36, { 
      width: pageWidth, 
      align: 'center' 
    });

    const lineY2 = lineY1 + 50;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // === TABLEAU ===
    let tableY = lineY2 + 10;
    const nbCentres = centres.length;
    const rubriquesWidth = 80;
    const centreWidth = Math.max(35, Math.floor((pageWidth - rubriquesWidth - 50) / nbCentres));
    const totalWidth = 50;
    const rowHeight = 14;

    // En-tête - Ligne 1: RUBRIQUES + Noms des centres + TOTAL
    doc.fontSize(6).font('Helvetica-Bold');
    let x = pageMargin;
    
    // Cellule RUBRIQUES (2 lignes de hauteur)
    doc.rect(x, tableY, rubriquesWidth, rowHeight * 2).stroke();
    doc.text('RUBRIQUES', x + 2, tableY + rowHeight - 2, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    // Colonnes pour chaque centre (2 lignes: nom centre + quartier)
    centres.forEach((centre, index) => {
      doc.rect(x, tableY, centreWidth, rowHeight * 2).stroke();
      // Nom du centre (tronqué si trop long)
      const nomCourt = centre.nom.length > 12 ? centre.nom.substring(0, 10) + '..' : centre.nom;
      doc.fontSize(5).text(nomCourt, x + 1, tableY + 3, { 
        width: centreWidth - 2, 
        align: 'center' 
      });
      // Quartier
      const quartierCourt = centre.quartierNom.length > 10 ? centre.quartierNom.substring(0, 8) + '..' : centre.quartierNom;
      doc.fontSize(4).fillColor('#666').text(quartierCourt, x + 1, tableY + rowHeight + 2, { 
        width: centreWidth - 2, 
        align: 'center' 
      });
      doc.fillColor('#000');
      x += centreWidth;
    });

    // Colonne TOTAL
    doc.fontSize(6).font('Helvetica-Bold');
    doc.rect(x, tableY, totalWidth, rowHeight * 2).stroke();
    doc.text('TOTAL', x + 2, tableY + rowHeight - 2, { width: totalWidth - 4, align: 'center' });

    tableY += rowHeight * 2;
    doc.fontSize(5).font('Helvetica');

    // Rubriques
    rubriques.forEach(rubrique => {
      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label.substring(0, 18), x + 2, tableY + 3, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const rubricData = donnees.rubriques[rubrique.key];
      rubricData.centres.forEach(val => {
        doc.rect(x, tableY, centreWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 3, { width: centreWidth - 2, align: 'center' });
        x += centreWidth;
      });

      doc.rect(x, tableY, totalWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(rubricData.total.toString(), x + 1, tableY + 3, { 
        width: totalWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica').fillColor('#000');

      tableY += rowHeight;
    });

    // Partis
    partisData.forEach(parti => {
      // Vérifier si on doit passer à une nouvelle page
      if (tableY + rowHeight > pageHeight + pageMargin - 60) {
        doc.addPage({ margin: 20, layout: 'landscape' });
        tableY = pageMargin + 20;
      }

      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text((parti.sigle || parti.nom).substring(0, 18), x + 2, tableY + 3, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const partiData = donnees.partis[parti.id];
      partiData.centres.forEach(val => {
        doc.rect(x, tableY, centreWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 3, { width: centreWidth - 2, align: 'center' });
        x += centreWidth;
      });

      doc.rect(x, tableY, totalWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(partiData.total.toString(), x + 1, tableY + 3, { 
        width: totalWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica').fillColor('#000');

      tableY += rowHeight;
    });

    // Ligne TOTAL VOIX
    x = pageMargin;
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text('TOTAL VOIX', x + 2, tableY + 3, { 
      width: rubriquesWidth - 4, 
      align: 'center' 
    });
    x += rubriquesWidth;

    centres.forEach((centre, index) => {
      let total = 0;
      partisData.forEach(parti => {
        total += donnees.partis[parti.id].centres[index];
      });

      doc.rect(x, tableY, centreWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(total.toString(), x + 1, tableY + 3, { 
        width: centreWidth - 2, 
        align: 'center' 
      });
      x += centreWidth;
    });

    const totalGeneral = partisData.reduce((sum, parti) => sum + donnees.partis[parti.id].total, 0);
    doc.rect(x, tableY, totalWidth, rowHeight).fillAndStroke('#c0c0c0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(totalGeneral.toString(), x + 1, tableY + 3, { 
      width: totalWidth - 2, 
      align: 'center' 
    });

    // === FOOTER ===
    const footerY = Math.min(tableY + 30, pageHeight + pageMargin - 50);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
    doc.text('SIGNATURE', pageMargin, footerY);

    doc.fontSize(8).font('Helvetica');
    const col1X = pageMargin;
    const col2X = pageMargin + pageWidth / 2;

    doc.text('Nom et Prénom: ............................', col1X, footerY + 12);
    doc.text('Signature: ............................', col2X, footerY + 12);

    doc.text('Date: ________________', col1X, footerY + 28);
    doc.fontSize(7).fillColor('#666');
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, col2X, footerY + 28);

    doc.end();

  } catch (err) {
    console.error('Erreur export centres par arrondissement:', err);
    if (!res.headersSent) {
      return res.status(500).json(error(`Erreur lors de la génération du PDF: ${err.message}`, 500));
    }
    next(err);
  }
};

// ============ EXPORT CENTRES PAR ARRONDISSEMENT PDF - POUR SA ============
const exportCentresParArrondissementPDFForSA = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const userId = req.user.userId;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer l'utilisateur SA avec son arrondissement
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        arrondissement: true
      }
    });

    if (!user) {
      await prisma.$disconnect();
      return res.status(404).json(error('Utilisateur non trouvé', 404));
    }

    if (!user.arrondissementId) {
      await prisma.$disconnect();
      return res.status(400).json(error('Vous n\'êtes pas assigné à un arrondissement', 400));
    }

    await prisma.$disconnect();

    // Appeler la fonction principale avec l'arrondissement de l'utilisateur
    req.params.arrondissementId = user.arrondissementId;
    return exportCentresParArrondissementPDF(req, res, next);

  } catch (err) {
    console.error('Erreur export centres SA:', err);
    next(err);
  }
};

module.exports = {
  checkRecapStatus,
  getMyRecapitulatif,
  createRecapitulatifElectoral,
  getAllRecapitulatifsElectoraux,
  getRecapitulatifElectoralById,
  updateRecapitulatifElectoral,
  deleteRecapitulatifElectoral,
  getRecapitulatifsElectorauxByElection,
  getRecapitulatifsElectorauxBySA,
  getRapportHierarchiqueByElection,
  exportTableauMatricielPDF,
  exportCentreDetailPDF,
  exportCirconscriptionPDF,
  exportCentresParArrondissementPDF,
  exportCentresParArrondissementPDFForSA
};