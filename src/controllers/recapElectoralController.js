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
    
    const rowHeight = 30;
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
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 10, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 20, { width: blocWidth, align: 'left' });
    
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
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 10, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 20, { width: 120, align: 'right' });
    
    // Ligne horizontale après l'en-tête
    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();
    
    // Titre principal centré
    doc.fontSize(13).font('Helvetica-Bold');
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
      doc.fontSize(11).font('Helvetica-Bold').text('RUBRIQUES', x + 2, y1 + rowHeight + 4, { 
        width: rubriquesWidth - 4, align: 'center' 
      });
      x += rubriquesWidth;
      
      // Pour chaque circonscription
      circonscriptions.forEach((circ) => {
        const nbArr = circ.arrondissements.length;
        const circTotalWidth = (nbArr + 1) * colWidth; // arrondissements + total
        
        // Niveau 1: Nom circonscription
        doc.rect(x, y1, circTotalWidth, rowHeight).stroke();
        doc.fontSize(10).text(circ.nom, x + 1, y1 + 5, { 
          width: circTotalWidth - 2, align: 'center' 
        });
        
        // Niveau 2: Arrondissements + Total
        const arrWidth = nbArr * colWidth;
        doc.rect(x, y2, arrWidth, rowHeight).stroke();
        doc.fontSize(10).text('ARROND.', x + 1, y2 + 5, { 
          width: arrWidth - 2, align: 'center' 
        });
        
        doc.rect(x + arrWidth, y2, colWidth, rowHeight * 2).stroke();
        doc.fontSize(10).text('TOTAL', x + arrWidth + 1, y2 + rowHeight / 2 + 4, { 
          width: colWidth - 2, align: 'center' 
        });
        
        // Niveau 3: Numéros arrondissements
        let xArr = x;
        circ.arrondissements.forEach((arr, idx) => {
          doc.rect(xArr, y3, colWidth, rowHeight).stroke();
          const num = parseInt(arr.arrondissementCode) || (idx + 1);
          doc.fontSize(10).text(`${num}`, xArr + 1, y3 + 5, { 
            width: colWidth - 2, align: 'center' 
          });
          xArr += colWidth;
        });
        
        x += circTotalWidth;
      });
      
      // Total Général
      doc.rect(x, y1, colWidth, headerHeight).stroke();
      doc.fontSize(10).text('TOTAL', x + 1, y1 + rowHeight, { width: colWidth - 2, align: 'center' });
      doc.text('GÉN.', x + 1, y1 + rowHeight + 10, { width: colWidth - 2, align: 'center' });
      
      return startY + headerHeight;
    };
    
    y = drawTableHeader(pageMargin, y);
    
    // === DESSINER LES DONNÉES ===
    doc.fontSize(10).font('Helvetica');
    
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
      doc.font('Helvetica-Bold').fontSize(10).text(ligne, x + 2, y + 6, { 
        width: rubriquesWidth - 4, align: 'left' 
      });
      doc.font('Helvetica').fontSize(10);
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
          doc.fontSize(10).text(valeur.toString(), x + 1, y + 6, { 
            width: colWidth - 2, align: 'center' 
          });
          x += colWidth;
          totalCirc += Number(valeur) || 0;
        });
        
        // Total circonscription
        doc.rect(x, y, colWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(10);
        doc.text(totalCirc.toString(), x + 1, y + 6, { width: colWidth - 2, align: 'center' });
        doc.font('Helvetica').fontSize(10);
        x += colWidth;
        
        totalGeneral += totalCirc;
      });
      
      // Total général
      doc.rect(x, y, colWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(10);
      doc.text(totalGeneral.toString(), x + 1, y + 6, { width: colWidth - 2, align: 'center' });
      doc.font('Helvetica').fontSize(10);
      
      y += rowHeight;
    });

    // Footer
    doc.fontSize(9).fillColor('#666').text(
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

    // Récupérer le centre avec ses infos géographiques et la compilation (pour l'agent)
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
        compilations: {
          where: { electionId },
          select: {
            agentPrenom: true,
            agentNom: true,
            agentNumero: true,
            status: true,
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telephone: true
              }
            }
          }
        },
        postesDeVote: {
          include: {
            resultSaisies: {
              where: { 
                electionId,
                status: 'VALIDEE'
              },
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

    // Récupérer l'élection pour afficher le type
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      await prisma.$disconnect();
      return res.status(404).json(error('Élection non trouvée', 404));
    }

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
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 10, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 20, { width: blocWidth, align: 'left' });

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
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 10, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 20, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    // Titre
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('DÉTAIL DU CENTRE DE VOTE', pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    // Infos géographiques
    const departement = centre.quartier?.arrondissement?.circonscription?.commune?.departement?.nom || '';
    const commune = centre.quartier?.arrondissement?.circonscription?.commune?.nom || '';
    const arrondissement = centre.quartier?.arrondissement?.nom || '';
    const quartier = centre.quartier?.nom || '';
    
    doc.fontSize(10).font('Helvetica');
    const infoY = lineY1 + 24;
    doc.text(`Département: ${departement}`, pageMargin, infoY, { width: pageWidth / 2 });
    doc.text(`Commune: ${commune}`, pageMargin + pageWidth / 2, infoY, { width: pageWidth / 2 });
    doc.text(`Arrondissement: ${arrondissement}`, pageMargin, infoY + 12, { width: pageWidth / 2 });
    doc.text(`Quartier: ${quartier}`, pageMargin + pageWidth / 2, infoY + 12, { width: pageWidth / 2 });
    doc.text(`Centre: ${centre.nom}`, pageMargin, infoY + 24, { width: pageWidth / 2 });
    doc.text(`Élection: ${election.type} du 11/01/2026`, pageMargin + pageWidth / 2, infoY + 24, { width: pageWidth / 2 });

    const lineY2 = infoY + 40;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // Tableau
    let tableY = lineY2 + 10;
    const postes = centre.postesDeVote || [];
    const nbPostes = postes.length;
    const postWidth = Math.max(40, (pageWidth - 80) / (nbPostes + 1));
    const rubriquesWidth = 80;
    const rowHeight = 28;

    // En-tête du tableau
    doc.fontSize(11).font('Helvetica-Bold');
    let x = pageMargin;
    
    // Colonne rubriques
    doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
    doc.text('RUBRIQUES', x + 2, tableY + 5, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    // Colonnes postes
    postes.forEach((poste, index) => {
      doc.rect(x, tableY, postWidth, rowHeight).stroke();
      doc.fontSize(10).text(`Poste ${index + 1}`, x + 1, tableY + 5, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      x += postWidth;
    });

    // Colonne TOTAL
    doc.fontSize(11).font('Helvetica-Bold');
    doc.rect(x, tableY, postWidth, rowHeight).stroke();
    doc.text('TOTAL', x + 2, tableY + 5, { width: postWidth - 4, align: 'center' });

    tableY += rowHeight;

    // Fonction pour formater une date en heure HH:MM
    const formatTime = (dateValue) => {
      if (!dateValue) return '--:--';
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '--:--';
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    // Rubriques horaires (format spécial)
    const rubriquesHoraires = [
      { key: 'dateOuverture', label: 'Heure Ouverture', format: 'time' },
      { key: 'dateFermeture', label: 'Heure Fermeture', format: 'time' }
    ];

    // Rubriques et données numériques
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

    doc.fontSize(10).font('Helvetica');

    // Afficher les rubriques horaires en premier
    rubriquesHoraires.forEach(rubrique => {
      x = pageMargin;
      
      // Label rubrique
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label, x + 2, tableY + 6, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      // Données par poste (heures)
      postes.forEach(poste => {
        const resultSaisi = poste.resultSaisies[0];
        const valeur = resultSaisi ? formatTime(resultSaisi[rubrique.key]) : '--:--';
        
        doc.rect(x, tableY, postWidth, rowHeight).stroke();
        doc.text(valeur, x + 1, tableY + 6, { 
          width: postWidth - 2, 
          align: 'center' 
        });
        x += postWidth;
      });

      // Total (non applicable pour les heures)
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text('--', x + 1, tableY + 6, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica');

      tableY += rowHeight;
    });

    // Rubriques principales numériques
    rubriques.forEach(rubrique => {
      x = pageMargin;
      
      // Label rubrique
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label, x + 2, tableY + 6, { 
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
        doc.text(valeur.toString(), x + 1, tableY + 6, { 
          width: postWidth - 2, 
          align: 'center' 
        });
        x += postWidth;
        total += Number(valeur) || 0;
      });

      // Total
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(total.toString(), x + 1, tableY + 6, { 
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
      doc.font('Helvetica-Bold').fontSize(10).text(`${parti.sigle || parti.nom}`, x + 2, tableY + 6, { 
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
        doc.fontSize(10).text(voix.toString(), x + 1, tableY + 6, { 
          width: postWidth - 2, 
          align: 'center' 
        });
        x += postWidth;
        totalVoix += Number(voix) || 0;
      });

      // Total parti
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text(totalVoix.toString(), x + 1, tableY + 6, { 
        width: postWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica');

      tableY += rowHeight;
    });

    // Ligne TOTAL finale
    x = pageMargin;
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(11).text('TOTAL', x + 2, tableY + 6, { 
      width: rubriquesWidth - 4, 
      align: 'center' 
    });
    x += rubriquesWidth;

    // Totaux par poste
    postes.forEach(poste => {
      const resultSaisi = poste.resultSaisies[0];
      const total = resultSaisi ? (resultSaisi.suffragesExprimes || 0) : 0;
      
      doc.rect(x, tableY, postWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text(total.toString(), x + 1, tableY + 6, { 
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
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(11).text(totalGeneral.toString(), x + 1, tableY + 6, { 
      width: postWidth - 2, 
      align: 'center' 
    });

    // === FOOTER AVEC SIGNATURE ===
    const footerY = tableY + 40;
    const footerLineSpacing = 10;

    // Infos collecteur/agent depuis la compilation
    const compilation = centre.compilations && centre.compilations.length > 0 ? centre.compilations[0] : null;
    
    // Priorité: champs agentPrenom/agentNom/agentNumero de la compilation, sinon relation agent
    let collecteurNom = '';
    let collecteurTel = '';
    
    if (compilation) {
      if (compilation.agentPrenom || compilation.agentNom) {
        // Utiliser les champs directs de la compilation
        collecteurNom = `${compilation.agentPrenom || ''} ${compilation.agentNom || ''}`.trim();
        collecteurTel = compilation.agentNumero || '';
      } else if (compilation.agent) {
        // Fallback: utiliser la relation agent
        collecteurNom = `${compilation.agent.firstName || ''} ${compilation.agent.lastName || ''}`.trim();
        collecteurTel = compilation.agent.telephone || '';
      }
    }

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
    doc.text('Agent Collecteur:', pageMargin, footerY);
    
    doc.fontSize(7).font('Helvetica');
    if (collecteurNom) {
      doc.text(`Nom: ${collecteurNom}`, pageMargin, footerY + 12);
    } else {
      doc.text(`Nom: (Non renseigné)`, pageMargin, footerY + 12);
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
    doc.fontSize(9).fillColor('#666').font('Helvetica');
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
                          where: { 
                            electionId,
                            status: 'VALIDEE'
                          },
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

    // Récupérer l'élection pour afficher le type
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      await prisma.$disconnect();
      return res.status(404).json(error('Élection non trouvée', 404));
    }

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
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 10, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 20, { width: blocWidth, align: 'left' });

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
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 10, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 20, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`RÉCAPITULATIF DE LA CIRCONSCRIPTION ELECTORALE ${circonscription.nom}`, pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    const departement = circonscription.commune?.departement?.nom || '';
    const commune = circonscription.commune?.nom || '';
    doc.fontSize(10).font('Helvetica');
    doc.text(`Département: ${departement}  |  Commune: ${commune}`, pageMargin, lineY1 + 24, { 
      width: pageWidth, 
      align: 'center' 
    });
    doc.text(`Élection: ${election.type} du 11/01/2026`, pageMargin, lineY1 + 38, { 
      width: pageWidth, 
      align: 'center' 
    });

    const lineY2 = lineY1 + 52;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // === TABLEAU ===
    let tableY = lineY2 + 10;
    const nbArrond = arrondissements.length;
    const arrondWidth = Math.max(40, (pageWidth - 80) / (nbArrond + 1));
    const rubriquesWidth = 80;
    const rowHeight = 26;

    // En-tête
    doc.fontSize(11).font('Helvetica-Bold');
    let x = pageMargin;
    
    doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
    doc.text('RUBRIQUES', x + 2, tableY + 5, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    arrondissements.forEach((arr, index) => {
      doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
      doc.fontSize(10).text(`Arrond. ${arr.code || arr.nom}`, x + 1, tableY + 5, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      x += arrondWidth;
    });

    doc.fontSize(11).font('Helvetica-Bold');
    doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
    doc.text('TOTAL', x + 2, tableY + 5, { width: arrondWidth - 4, align: 'center' });

    tableY += rowHeight;
    doc.fontSize(10).font('Helvetica');

    // Rubriques
    rubriques.forEach(rubrique => {
      x = pageMargin;
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(rubrique.label, x + 2, tableY + 5, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const rubricData = donnees.rubriques[rubrique.key];
      rubricData.arrondonissements.forEach(val => {
        doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 5, { width: arrondWidth - 2, align: 'center' });
        x += arrondWidth;
      });

      doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(rubricData.total.toString(), x + 1, tableY + 5, { 
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
      doc.font('Helvetica-Bold').text((parti.sigle || parti.nom), x + 2, tableY + 5, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += rubriquesWidth;

      const partiData = donnees.partis[parti.id];
      partiData.arrondonissements.forEach(val => {
        doc.rect(x, tableY, arrondWidth, rowHeight).stroke();
        doc.text(val.toString(), x + 1, tableY + 5, { width: arrondWidth - 2, align: 'center' });
        x += arrondWidth;
      });

      doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#e8e8e8', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').text(partiData.total.toString(), x + 1, tableY + 5, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica').fillColor('#000');

      tableY += rowHeight;
    });

    // Ligne TOTAL
    x = pageMargin;
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text('TOTAL VOIX', x + 2, tableY + 5, { 
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
      doc.fillColor('#000').font('Helvetica-Bold').text(total.toString(), x + 1, tableY + 5, { 
        width: arrondWidth - 2, 
        align: 'center' 
      });
      x += arrondWidth;
    });

    const totalGeneral = partis.reduce((sum, parti) => sum + donnees.partis[parti.id].total, 0);
    doc.rect(x, tableY, arrondWidth, rowHeight).fillAndStroke('#c0c0c0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(totalGeneral.toString(), x + 1, tableY + 5, { 
      width: arrondWidth - 2, 
      align: 'center' 
    });

    // === FOOTER ===
    const footerY = tableY + 30;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
    doc.text('SIGNATURE', pageMargin, footerY);

    doc.fontSize(10).font('Helvetica');
    const col1X = pageMargin;
    const col2X = pageMargin + pageWidth / 2;

    doc.text('Nom et Prénom: .............................', col1X, footerY + 12);
    doc.text('Signature: ............................', col2X, footerY + 12);

    doc.text('Date: ________________', col1X, footerY + 28);
    doc.fontSize(9).fillColor('#666');
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, col2X, footerY + 28);

    doc.end();

  } catch (err) {
    console.error('Erreur export circonscription:', err);
    next(err);
  }
};

// ============ EXPORT COMMUNE PDF ============
const exportCommunePDF = async (req, res, next) => {
  try {
    const { electionId, communeId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer la commune avec toutes ses circonscriptions
    const commune = await prisma.commune.findUnique({
      where: { id: communeId },
      include: {
        departement: true,
        circonscriptions: {
          orderBy: { nom: 'asc' },
          include: {
            arrondissements: {
              include: {
                quartiers: {
                  include: {
                    centresDeVote: {
                      include: {
                        postesDeVote: {
                          include: {
                            resultSaisies: {
                              where: { 
                                electionId,
                                status: 'VALIDEE'
                              },
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
        }
      }
    });

    if (!commune) {
      await prisma.$disconnect();
      return res.status(404).json(error('Commune non trouvée', 404));
    }

    // Récupérer tous les partis de l'élection
    const partis = await prisma.parti.findMany({
      where: { electionId },
      orderBy: { nom: 'asc' }
    });

    // Récupérer l'élection pour afficher le type
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      await prisma.$disconnect();
      return res.status(404).json(error('Élection non trouvée', 404));
    }

    await prisma.$disconnect();

    // Fonction de formatage des nombres avec espace comme séparateur de milliers
    const formatNumber = (num) => {
      if (num === null || num === undefined) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // Calcul des données par circonscription
    const circonscriptions = commune.circonscriptions;
    const rubriques = [
      { key: 'nombreInscrits', label: 'Nombre Inscrits' },
      { key: 'nombreVotants', label: 'Nombre Votants' },
      { key: 'suffragesExprimes', label: 'Suffrages Exprimés' },
      { key: 'abstentions', label: 'Abstentions' },
      { key: 'bulletinsNuls', label: 'Bulletins Nuls' },
      { key: 'procurations', label: 'Procurations' },
      { key: 'derogations', label: 'Dérogations' }
    ];

    // Fonction pour calculer les totaux par circonscription
    const calculerTotauxCirconscription = (circonscription, rubriqueKey) => {
      let total = 0;
      circonscription.arrondissements.forEach(arrondissement => {
        arrondissement.quartiers.forEach(quartier => {
          quartier.centresDeVote.forEach(centre => {
            centre.postesDeVote.forEach(poste => {
              poste.resultSaisies.forEach(resultSaisi => {
                total += resultSaisi[rubriqueKey] || 0;
              });
            });
          });
        });
      });
      return total;
    };

    // Fonction pour calculer les voix d'un parti par circonscription
    const calculerVoixPartiCirconscription = (circonscription, partiId) => {
      let total = 0;
      circonscription.arrondissements.forEach(arrondissement => {
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
        circonscriptions: circonscriptions.map(circ => calculerTotauxCirconscription(circ, rubrique.key)),
        total: 0
      };
      donnees.rubriques[rubrique.key].total = donnees.rubriques[rubrique.key].circonscriptions.reduce((a, b) => a + b, 0);
    });

    partis.forEach(parti => {
      donnees.partis[parti.id] = {
        nom: parti.sigle || parti.nom,
        circonscriptions: circonscriptions.map(circ => calculerVoixPartiCirconscription(circ, parti.id)),
        total: 0
      };
      donnees.partis[parti.id].total = donnees.partis[parti.id].circonscriptions.reduce((a, b) => a + b, 0);
    });

    // Créer le PDF
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="commune_${communeId}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2);
    const pageHeight = 595 - (pageMargin * 2);

    // === EN-TÊTE OFFICIEL ===
    const headerY = pageMargin;
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

    // Texte ministère
    const blocLeftX = pageMargin + coatOfArmsSize + 10;
    const blocWidth = 120;
    const leftTextY = headerY + 5;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
    doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 10, { width: blocWidth, align: 'left' });
    doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 20, { width: blocWidth, align: 'left' });

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
    const rightX = pageWidth - 120;
    doc.fontSize(7).font('Helvetica');
    doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
    doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 10, { width: 120, align: 'right' });
    doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 20, { width: 120, align: 'right' });

    const lineY1 = flagLineY + 28;
    doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`RÉCAPITULATIF GÉNÉRAL DE LA COMMUNE DE ${commune.nom.toUpperCase()}`, pageMargin, lineY1 + 8, { 
      width: pageWidth, 
      align: 'center' 
    });

    const departement = commune.departement?.nom || '';
    doc.fontSize(10).font('Helvetica');
    doc.text(`Département: ${departement}  |  Commune: ${commune.nom}`, pageMargin, lineY1 + 24, { 
      width: pageWidth, 
      align: 'center' 
    });
    doc.text(`Élection: ${election.type} du 11/01/2026`, pageMargin, lineY1 + 38, { 
      width: pageWidth, 
      align: 'center' 
    });

    const lineY2 = lineY1 + 52;
    doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

    // === TABLEAU ===
    let tableY = lineY2 + 10;
    const nbCircons = circonscriptions.length;
    const circonsWidth = Math.max(50, (pageWidth - 90) / (nbCircons + 1));
    const rubriquesWidth = 90;
    const rowHeight = 26;

    // En-tête
    doc.fontSize(11).font('Helvetica-Bold');
    let x = pageMargin;
    
    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').text('RUBRIQUES', x + 2, tableY + 5, { width: rubriquesWidth - 4, align: 'center' });
    x += rubriquesWidth;

    circonscriptions.forEach((circ, index) => {
      doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').fontSize(10).text(`${circ.nom || `Circ. ${index + 1}`}`, x + 1, tableY + 5, { 
        width: circonsWidth - 2, 
        align: 'center' 
      });
      x += circonsWidth;
    });

    doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold').text('TOTAL', x + 2, tableY + 5, { width: circonsWidth - 4, align: 'center' });

    tableY += rowHeight;
    doc.fillColor('#000');

    // Rubriques
    doc.fontSize(10).font('Helvetica');
    rubriques.forEach((rubrique, idx) => {
      x = pageMargin;
      const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').text(rubrique.label, x + 2, tableY + 5, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      x += rubriquesWidth;

      const data = donnees.rubriques[rubrique.key];
      data.circonscriptions.forEach(valeur => {
        doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica').text(formatNumber(valeur), x + 1, tableY + 4, { 
          width: circonsWidth - 2, 
          align: 'center' 
        });
        x += circonsWidth;
      });

      doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#d0d0d0', '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').text(formatNumber(data.total), x + 1, tableY + 4, { 
        width: circonsWidth - 2, 
        align: 'center' 
      });

      tableY += rowHeight;
    });

    // Ligne séparatrice pour les partis
    tableY += 5;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text('RÉSULTATS PAR PARTI POLITIQUE', pageMargin, tableY);
    tableY += 12;
    doc.fillColor('#000');

    // Partis
    Object.values(donnees.partis).forEach((parti, idx) => {
      x = pageMargin;
      const bgColor = idx % 2 === 0 ? '#e8f4f8' : '#ffffff';
      
      doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text(parti.nom, x + 2, tableY + 4, { 
        width: rubriquesWidth - 4, 
        align: 'left' 
      });
      x += rubriquesWidth;

      parti.circonscriptions.forEach(valeur => {
        doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica').text(formatNumber(valeur), x + 1, tableY + 4, { 
          width: circonsWidth - 2, 
          align: 'center' 
        });
        x += circonsWidth;
      });

      doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#d0d0d0', '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').text(formatNumber(parti.total), x + 1, tableY + 4, { 
        width: circonsWidth - 2, 
        align: 'center' 
      });

      tableY += rowHeight;
    });

    // Ligne TOTAL VOIX
    x = pageMargin;
    const totalVoix = Object.values(donnees.partis).reduce((sum, p) => sum + p.total, 0);
    const totalVoixParCirc = circonscriptions.map((_, idx) => 
      Object.values(donnees.partis).reduce((sum, p) => sum + p.circonscriptions[idx], 0)
    );

    doc.rect(x, tableY, rubriquesWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7).text('TOTAL VOIX', x + 2, tableY + 4, { 
      width: rubriquesWidth - 4, 
      align: 'left' 
    });
    x += rubriquesWidth;

    totalVoixParCirc.forEach(valeur => {
      doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').font('Helvetica-Bold').text(formatNumber(valeur), x + 1, tableY + 4, { 
        width: circonsWidth - 2, 
        align: 'center' 
      });
      x += circonsWidth;
    });

    doc.rect(x, tableY, circonsWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').font('Helvetica-Bold').text(formatNumber(totalVoix), x + 1, tableY + 4, { 
      width: circonsWidth - 2, 
      align: 'center' 
    });

    tableY += rowHeight + 15;

    // Taux de participation
    const totalInscrits = donnees.rubriques.nombreInscrits.total;
    const totalVotants = donnees.rubriques.nombreVotants.total;
    const tauxParticipation = totalInscrits > 0 ? ((totalVotants / totalInscrits) * 100).toFixed(2) : 0;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text(`TAUX DE PARTICIPATION: ${tauxParticipation}%`, pageMargin, tableY, { width: pageWidth, align: 'left' });
    doc.fillColor('#000');

    // === SIGNATURE ===
    const footerY = Math.min(tableY + 30, pageHeight + pageMargin - 50);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
    doc.text('SIGNATURE', pageMargin, footerY);

    doc.fontSize(8).font('Helvetica');
    const col1X = pageMargin;
    const col2X = pageMargin + pageWidth / 2;

    doc.text('Nom et Prénom: ............................', col1X, footerY + 12);
    doc.text('Signature: ............................', col2X, footerY + 12);

    doc.text('Date: ________________', col1X, footerY + 28);
    doc.fontSize(9).fillColor('#666');
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, col2X, footerY + 28);

    doc.end();

  } catch (err) {
    console.error('Erreur export commune:', err);
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
                      where: { 
                        electionId,
                        status: 'VALIDEE'
                      },
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
    const CENTRES_PAR_PAGE = 10; // Nombre de centres par page

    // Fonction pour dessiner l'en-tête officiel sur chaque page
    const drawPageHeader = (pageNum = 1, totalPages = 1) => {
      const headerY = pageMargin;
      // Logo central
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
      doc.text(`Élection: ${electionsData.type} du 11/01/2026`, pageMargin, lineY1 + 36, { 
        width: pageWidth, 
        align: 'center' 
      });

      // Numéro de page
      doc.fontSize(7).fillColor('#666');
      doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 50, lineY1 + 36, { width: 70, align: 'right' });
      doc.fillColor('#000');

      const lineY2 = lineY1 + 50;
      doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

      return lineY2;
    };

    // Dimensions du tableau
    const nbRubriques = rubriques.length;
    const nbPartis = partisData.length;
    const centreColWidth = 90;
    const totalVoixColWidth = 40;
    const dataColWidth = Math.max(30, Math.floor((pageWidth - centreColWidth - totalVoixColWidth) / (nbRubriques + nbPartis)));
    const rowHeight = 26;

    // Fonction pour dessiner l'en-tête du tableau
    const drawTableHeader = (startY) => {
      let tableY = startY + 10;
      doc.fontSize(10).font('Helvetica-Bold');
      let x = pageMargin;
      
      // Cellule CENTRES (2 lignes de hauteur)
      doc.rect(x, tableY, centreColWidth, rowHeight * 2).stroke();
      doc.text('CENTRES DE VOTE', x + 2, tableY + rowHeight - 2, { width: centreColWidth - 4, align: 'center' });
      x += centreColWidth;

      // Colonnes pour chaque rubrique
      rubriques.forEach((rubrique) => {
        doc.rect(x, tableY, dataColWidth, rowHeight * 2).stroke();
        doc.fontSize(9).text(rubrique.label, x + 1, tableY + 4, { 
          width: dataColWidth - 2, 
          align: 'center',
          lineBreak: true
        });
        x += dataColWidth;
      });

      // Colonnes pour chaque parti
      partisData.forEach((parti) => {
        doc.rect(x, tableY, dataColWidth, rowHeight * 2).fillAndStroke('#f8f8f8', '#000');
        const sigle = (parti.sigle || parti.nom);
        doc.fillColor('#000').fontSize(9).text(sigle, x + 1, tableY + 4, { 
          width: dataColWidth - 2, 
          align: 'center',
          lineBreak: true
        });
        x += dataColWidth;
      });

      // Colonne TOTAL VOIX
      doc.rect(x, tableY, totalVoixColWidth, rowHeight * 2).fillAndStroke('#e0e0e0', '#000');
      doc.fillColor('#000').fontSize(9).text('TOTAL VOIX', x + 1, tableY + rowHeight - 2, { 
        width: totalVoixColWidth - 2, 
        align: 'center' 
      });

      return tableY + rowHeight * 2;
    };

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(centres.length / CENTRES_PAR_PAGE);

    // === PREMIÈRE PAGE ===
    let lineY2 = drawPageHeader(1, totalPages);
    let tableY = drawTableHeader(lineY2);
    doc.fontSize(7).font('Helvetica');

    // Lignes de données - Une ligne par centre (10 par page)
    let currentPage = 1;
    let centresOnCurrentPage = 0;

    centres.forEach((centre, centreIndex) => {
      // Si on a atteint 10 centres sur cette page, passer à une nouvelle page
      if (centresOnCurrentPage >= CENTRES_PAR_PAGE) {
        currentPage++;
        doc.addPage({ margin: 20, size: 'A4', layout: 'landscape' });
        lineY2 = drawPageHeader(currentPage, totalPages);
        tableY = drawTableHeader(lineY2);
        doc.fontSize(7).font('Helvetica');
        centresOnCurrentPage = 0;
      }

      let x = pageMargin;
      
      // Nom du centre seulement
      doc.rect(x, tableY, centreColWidth, rowHeight).stroke();
      const nomCourt = centre.nom;
      doc.font('Helvetica-Bold').fontSize(9).text(nomCourt, x + 2, tableY + 4, { 
        width: centreColWidth - 4, 
        align: 'left' 
      });
      doc.font('Helvetica');
      x += centreColWidth;

      // Valeurs des rubriques pour ce centre
      rubriques.forEach(rubrique => {
        const val = donnees.rubriques[rubrique.key].centres[centreIndex];
        doc.rect(x, tableY, dataColWidth, rowHeight).stroke();
        doc.fontSize(7).text(val.toString(), x + 1, tableY + 4, { width: dataColWidth - 2, align: 'center' });
        x += dataColWidth;
      });

      // Valeurs des partis pour ce centre + calcul total voix
      let totalVoixCentre = 0;
      partisData.forEach(parti => {
        const val = donnees.partis[parti.id].centres[centreIndex];
        totalVoixCentre += val;
        doc.rect(x, tableY, dataColWidth, rowHeight).fillAndStroke('#fafafa', '#000');
        doc.fillColor('#000').fontSize(7).text(val.toString(), x + 1, tableY + 4, { width: dataColWidth - 2, align: 'center' });
        x += dataColWidth;
      });

      // Colonne TOTAL VOIX pour ce centre
      doc.rect(x, tableY, totalVoixColWidth, rowHeight).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text(totalVoixCentre.toString(), x + 1, tableY + 4, { 
        width: totalVoixColWidth - 2, 
        align: 'center' 
      });
      doc.font('Helvetica');

      tableY += rowHeight;
      centresOnCurrentPage++;
    });

    // Ligne TOTAL (sur la dernière page)
    let x = pageMargin;
    doc.rect(x, tableY, centreColWidth, rowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text('TOTAL', x + 2, tableY + 4, { 
      width: centreColWidth - 4, 
      align: 'center' 
    });
    x += centreColWidth;

    // Totaux des rubriques
    rubriques.forEach(rubrique => {
      const total = donnees.rubriques[rubrique.key].total;
      doc.rect(x, tableY, dataColWidth, rowHeight).fillAndStroke('#e0e0e0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text(total.toString(), x + 1, tableY + 4, { 
        width: dataColWidth - 2, 
        align: 'center' 
      });
      x += dataColWidth;
    });

    // Totaux des partis
    let totalGeneralVoix = 0;
    partisData.forEach(parti => {
      const total = donnees.partis[parti.id].total;
      totalGeneralVoix += total;
      doc.rect(x, tableY, dataColWidth, rowHeight).fillAndStroke('#c0c0c0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text(total.toString(), x + 1, tableY + 4, { 
        width: dataColWidth - 2, 
        align: 'center' 
      });
      x += dataColWidth;
    });

    // Total général des voix
    doc.rect(x, tableY, totalVoixColWidth, rowHeight).fillAndStroke('#b0b0b0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7).text(totalGeneralVoix.toString(), x + 1, tableY + 4, { 
      width: totalVoixColWidth - 2, 
      align: 'center' 
    });
    doc.font('Helvetica').fillColor('#000');

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

// ============ EXPORT RÉCAPITULATIF GÉNÉRAL DES RÉSULTATS PAR ARRONDISSEMENT ============
/**
 * Export PDF complet avec:
 * - Page 1: Résumé général (statistiques globales + résultats par parti)
 * - Pages 2-N: Détail par centre avec tous les postes
 * - Dernière page: Tableau récapitulatif par centre + signature
 */
const exportRecapGeneralResultatsPDF = async (req, res, next) => {
  try {
    const { electionId, arrondissementId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer l'arrondissement avec TOUTES ses données imbriquées
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
          orderBy: { nom: 'asc' },
          include: {
            centresDeVote: {
              orderBy: { nom: 'asc' },
              include: {
                compilations: {
                  where: { electionId },
                  select: {
                    agentPrenom: true,
                    agentNom: true,
                    agentNumero: true,
                    status: true,
                    dateValidation: true,
                    agent: {
                      select: {
                        firstName: true,
                        lastName: true,
                        telephone: true
                      }
                    }
                  }
                },
                postesDeVote: {
                  orderBy: { numero: 'asc' },
                  include: {
                    resultSaisies: {
                      where: { 
                        electionId,
                        status: 'VALIDEE'
                      },
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

    // Récupérer tous les partis de l'élection (triés par nom)
    const partis = await prisma.parti.findMany({
      where: { electionId },
      orderBy: { nom: 'asc' }
    });

    // Convertir en objets simples
    const arrondissementData = JSON.parse(JSON.stringify(arrondissement));
    const electionData = JSON.parse(JSON.stringify(election));
    const partisData = JSON.parse(JSON.stringify(partis));

    await prisma.$disconnect();

    // DEBUG: Afficher les données récupérées
    console.log('[PDF DEBUG] Élection ID:', electionId);
    console.log('[PDF DEBUG] Arrondissement:', arrondissementData.nom);
    console.log('[PDF DEBUG] Nombre de quartiers:', arrondissementData.quartiers?.length || 0);
    
    let debugTotalResultats = 0;
    arrondissementData.quartiers?.forEach(q => {
      console.log(`[PDF DEBUG] Quartier ${q.nom}: ${q.centresDeVote?.length || 0} centres`);
      q.centresDeVote?.forEach(c => {
        const nbPostes = c.postesDeVote?.length || 0;
        let nbResultats = 0;
        c.postesDeVote?.forEach(p => {
          if (p.resultSaisies && p.resultSaisies.length > 0) {
            nbResultats++;
          }
        });
        debugTotalResultats += nbResultats;
        console.log(`[PDF DEBUG]   Centre ${c.nom}: ${nbPostes} postes, ${nbResultats} résultats saisis`);
      });
    });
    console.log('[PDF DEBUG] TOTAL résultats saisis trouvés:', debugTotalResultats);

    // Collecter tous les centres avec leurs données
    const centres = [];
    arrondissementData.quartiers.forEach(quartier => {
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

    // ============ CALCUL DES STATISTIQUES GLOBALES ============
    let globalStats = {
      totalCentres: centres.length,
      totalPostes: 0,
      postesCompiles: 0,
      totalInscrits: 0,
      totalVotants: 0,
      totalAbstentions: 0,
      totalSuffragesExprimes: 0,
      totalBulletinsNuls: 0,
      totalDerogations: 0,
      totalProcurations: 0,
      tauxParticipation: 0
    };

    let partisTotaux = {};
    partisData.forEach(p => {
      partisTotaux[p.id] = { nom: p.nom, sigle: p.sigle, voix: 0 };
    });

    // Parcourir tous les centres et postes pour calculer les totaux
    centres.forEach(centre => {
      globalStats.totalPostes += centre.postesDeVote.length;
      
      centre.postesDeVote.forEach(poste => {
        if (poste.resultSaisies && poste.resultSaisies.length > 0) {
          globalStats.postesCompiles++;
          const result = poste.resultSaisies[0];
          
          globalStats.totalInscrits += result.nombreInscrits || 0;
          globalStats.totalVotants += result.nombreVotants || 0;
          globalStats.totalAbstentions += result.abstentions || 0;
          globalStats.totalSuffragesExprimes += result.suffragesExprimes || 0;
          globalStats.totalBulletinsNuls += result.bulletinsNuls || 0;
          globalStats.totalDerogations += result.derogations || 0;
          globalStats.totalProcurations += result.procurations || 0;

          // Voix par parti
          if (result.resultPartis) {
            result.resultPartis.forEach(rp => {
              if (partisTotaux[rp.partiId]) {
                partisTotaux[rp.partiId].voix += rp.voix || 0;
              }
            });
          }
        }
      });
    });

    // Calculer le taux de participation global
    if (globalStats.totalInscrits > 0) {
      globalStats.tauxParticipation = ((globalStats.totalVotants / globalStats.totalInscrits) * 100).toFixed(2);
    }

    // ============ CRÉATION DU PDF ============
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'landscape',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recap_general_${arrondissementId}_${Date.now()}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 842 - (pageMargin * 2);
    const pageHeight = 595 - (pageMargin * 2);

    // ============ FONCTION DESSINER EN-TÊTE OFFICIEL ============
    const drawOfficialHeader = (pageNum, totalPages, subtitle = '') => {
      const headerY = pageMargin;
      
      // Logo central
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

      // Texte ministère
      const blocLeftX = pageMargin + coatOfArmsSize + 10;
      const blocWidth = 120;
      const leftTextY = headerY + 5;
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
      doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 8, { width: blocWidth, align: 'left' });
      doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 16, { width: blocWidth, align: 'left' });

      // Ligne drapeau
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
      const rightX = pageWidth - 120;
      doc.fontSize(7).font('Helvetica');
      doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
      doc.text('TÉL: 229 21.31.37.70 / 21.31.34.79', rightX, leftTextY + 8, { width: 120, align: 'right' });
      doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 16, { width: 120, align: 'right' });

      const lineY1 = flagLineY + 28;
      doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

      // Titre principal
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('RÉCAPITULATIF GÉNÉRAL DES RÉSULTATS ÉLECTORAUX', pageMargin, lineY1 + 8, { 
        width: pageWidth, 
        align: 'center' 
      });

      // Sous-titre si fourni
      if (subtitle) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
        doc.text(subtitle, pageMargin, lineY1 + 22, { 
          width: pageWidth, 
          align: 'center' 
        });
        doc.fillColor('#000');
      }

      // Infos géographiques
      const departement = arrondissementData.circonscription?.commune?.departement?.nom || '';
      const commune = arrondissementData.circonscription?.commune?.nom || '';
      const circonscription = arrondissementData.circonscription?.nom || '';
      doc.fontSize(8).font('Helvetica');
      const geoY = subtitle ? lineY1 + 36 : lineY1 + 24;
      doc.text(`Département: ${departement}  |  Commune: ${commune}  |  Arrondissement: ${arrondissementData.nom}`, pageMargin, geoY, { 
        width: pageWidth, 
        align: 'center' 
      });
      doc.text(`Élection: ${electionData.type} du 11/01/2026`, pageMargin, geoY + 12, { 
        width: pageWidth, 
        align: 'center' 
      });

      // Numéro de page
      doc.fontSize(7).fillColor('#666');
      doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 50, geoY + 12, { width: 70, align: 'right' });
      doc.fillColor('#000');

      const lineY2 = geoY + 26;
      doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

      return lineY2;
    };

    // Estimer le nombre total de pages (1 résumé + 1 par centre + 1 récap)
    const totalPages = 2 + centres.length;
    let currentPage = 1;

    // ============ PAGE 1: RÉSUMÉ GÉNÉRAL ============
    let contentY = drawOfficialHeader(currentPage, totalPages);
    contentY += 15;

    // Section Statistiques Globales
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text('STATISTIQUES GLOBALES', pageMargin, contentY);
    doc.fillColor('#000');
    contentY += 15;

    // Tableau statistiques
    const statsBoxWidth = 380;
    const statsBoxHeight = 140;
    doc.rect(pageMargin, contentY, statsBoxWidth, statsBoxHeight).stroke();
    
    doc.fontSize(8).font('Helvetica');
    let statsY = contentY + 10;
    const statsCol1 = pageMargin + 10;
    const statsCol2 = pageMargin + 200;
    const statsLineHeight = 16;

    const statsLines = [
      [`Nombre de Centres de Vote`, `${globalStats.totalCentres}`],
      [`Nombre de Postes de Vote`, `${globalStats.totalPostes}`],
      [`Postes Compilés`, `${globalStats.postesCompiles} (${globalStats.totalPostes > 0 ? ((globalStats.postesCompiles / globalStats.totalPostes) * 100).toFixed(1) : 0}%)`],
      [``, ``],
      [`Total Inscrits`, `${globalStats.totalInscrits.toLocaleString('fr-FR')}`],
      [`Total Votants`, `${globalStats.totalVotants.toLocaleString('fr-FR')}`],
      [`Taux de Participation`, `${globalStats.tauxParticipation}%`],
      [`Total Suffrages Exprimés`, `${globalStats.totalSuffragesExprimes.toLocaleString('fr-FR')}`]
    ];

    statsLines.forEach(([label, value]) => {
      if (label) {
        doc.font('Helvetica').text(label, statsCol1, statsY, { width: 180 });
        doc.font('Helvetica-Bold').text(value, statsCol2, statsY, { width: 150, align: 'right' });
      }
      statsY += statsLineHeight;
    });

    // Deuxième boîte statistiques
    const stats2X = pageMargin + statsBoxWidth + 20;
    doc.rect(stats2X, contentY, statsBoxWidth, statsBoxHeight).stroke();
    
    statsY = contentY + 10;
    const stats2Col1 = stats2X + 10;
    const stats2Col2 = stats2X + 200;

    const stats2Lines = [
      [`Total Bulletins Nuls`, `${globalStats.totalBulletinsNuls.toLocaleString('fr-FR')}`],
      [`Total Abstentions`, `${globalStats.totalAbstentions.toLocaleString('fr-FR')}`],
      [`Total Dérogations`, `${globalStats.totalDerogations.toLocaleString('fr-FR')}`],
      [`Total Procurations`, `${globalStats.totalProcurations.toLocaleString('fr-FR')}`]
    ];

    stats2Lines.forEach(([label, value]) => {
      doc.font('Helvetica').text(label, stats2Col1, statsY, { width: 180 });
      doc.font('Helvetica-Bold').text(value, stats2Col2, statsY, { width: 150, align: 'right' });
      statsY += statsLineHeight;
    });

    contentY += statsBoxHeight + 20;

    // Section Résultats par Parti
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text('RÉSULTATS PAR PARTI POLITIQUE (TOTAL)', pageMargin, contentY);
    doc.fillColor('#000');
    contentY += 15;

    // Tableau des partis
    const partiColWidth = [250, 120, 120];
    const partiRowHeight = 18;
    let partiX = pageMargin;
    
    // En-tête
    doc.rect(partiX, contentY, partiColWidth[0], partiRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
    doc.text('PARTI POLITIQUE', partiX + 5, contentY + 5, { width: partiColWidth[0] - 10 });
    partiX += partiColWidth[0];
    
    doc.rect(partiX, contentY, partiColWidth[1], partiRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.text('VOIX', partiX + 5, contentY + 5, { width: partiColWidth[1] - 10, align: 'center' });
    partiX += partiColWidth[1];
    
    doc.rect(partiX, contentY, partiColWidth[2], partiRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.text('% SUFFRAGES', partiX + 5, contentY + 5, { width: partiColWidth[2] - 10, align: 'center' });
    
    doc.fillColor('#000');
    contentY += partiRowHeight;

    // Données partis
    const partisArray = Object.values(partisTotaux).sort((a, b) => b.voix - a.voix);
    let totalVoixPartis = partisArray.reduce((sum, p) => sum + p.voix, 0);

    partisArray.forEach((parti, idx) => {
      const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
      partiX = pageMargin;
      
      doc.rect(partiX, contentY, partiColWidth[0], partiRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').fontSize(7).font('Helvetica');
      const partiLabel = parti.sigle ? `${parti.sigle} (${parti.nom})` : parti.nom;
      doc.text(partiLabel, partiX + 5, contentY + 5, { width: partiColWidth[0] - 10 });
      partiX += partiColWidth[0];
      
      doc.rect(partiX, contentY, partiColWidth[1], partiRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold');
      doc.text(parti.voix.toLocaleString('fr-FR'), partiX + 5, contentY + 5, { width: partiColWidth[1] - 10, align: 'center' });
      partiX += partiColWidth[1];
      
      const pourcentage = totalVoixPartis > 0 ? ((parti.voix / totalVoixPartis) * 100).toFixed(2) : '0.00';
      doc.rect(partiX, contentY, partiColWidth[2], partiRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica');
      doc.text(`${pourcentage}%`, partiX + 5, contentY + 5, { width: partiColWidth[2] - 10, align: 'center' });
      
      contentY += partiRowHeight;
    });

    // Ligne TOTAL
    partiX = pageMargin;
    doc.rect(partiX, contentY, partiColWidth[0], partiRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').fontSize(8).font('Helvetica-Bold');
    doc.text('TOTAL', partiX + 5, contentY + 5, { width: partiColWidth[0] - 10 });
    partiX += partiColWidth[0];
    
    doc.rect(partiX, contentY, partiColWidth[1], partiRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.text(totalVoixPartis.toLocaleString('fr-FR'), partiX + 5, contentY + 5, { width: partiColWidth[1] - 10, align: 'center' });
    partiX += partiColWidth[1];
    
    doc.rect(partiX, contentY, partiColWidth[2], partiRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.text('100.00%', partiX + 5, contentY + 5, { width: partiColWidth[2] - 10, align: 'center' });

    // ============ PAGES DÉTAIL PAR CENTRE ============
    centres.forEach((centre, centreIndex) => {
      doc.addPage({ margin: 20, size: 'A4', layout: 'landscape' });
      currentPage++;
      
      const centreSubtitle = `DÉTAIL DU CENTRE: ${centre.nom.toUpperCase()}`;
      contentY = drawOfficialHeader(currentPage, totalPages, centreSubtitle);
      contentY += 10;

      // Infos du centre
      doc.fontSize(8).font('Helvetica');
      doc.text(`Quartier: ${centre.quartierNom}`, pageMargin, contentY);
      
      // Infos agent collecteur
      const compilation = centre.compilations && centre.compilations.length > 0 ? centre.compilations[0] : null;
      let agentNom = 'Non renseigné';
      let agentTel = '';
      let compilationStatus = 'NON COMPILÉ';
      
      if (compilation) {
        if (compilation.agentPrenom || compilation.agentNom) {
          agentNom = `${compilation.agentPrenom || ''} ${compilation.agentNom || ''}`.trim();
          agentTel = compilation.agentNumero || '';
        } else if (compilation.agent) {
          agentNom = `${compilation.agent.firstName || ''} ${compilation.agent.lastName || ''}`.trim();
          agentTel = compilation.agent.telephone || '';
        }
        compilationStatus = compilation.status === 'VALIDEE' ? '✓ VALIDÉE' : 
                           compilation.status === 'REJETEE' ? '✗ REJETÉE' : 'EN COURS';
      }

      doc.text(`Agent Collecteur: ${agentNom}${agentTel ? ` | Tél: ${agentTel}` : ''}`, pageMargin + 250, contentY);
      doc.text(`Statut: ${compilationStatus}`, pageMargin + 600, contentY);
      contentY += 20;

      // Tableau des postes
      const postes = centre.postesDeVote || [];
      const nbPostes = postes.length;
      
      if (nbPostes === 0) {
        doc.text('Aucun poste de vote dans ce centre', pageMargin, contentY);
        return;
      }

      // Calculer les largeurs
      const rubriqueWidth = 100;
      const posteWidth = Math.min(60, (pageWidth - rubriqueWidth - 70) / Math.min(nbPostes, 10));
      const totalColWidth = 60;
      const rowHeight = 14;

      // Limiter à 10 postes par page (paginer si nécessaire)
      const maxPostesPerPage = 10;
      const posteChunks = [];
      for (let i = 0; i < postes.length; i += maxPostesPerPage) {
        posteChunks.push(postes.slice(i, i + maxPostesPerPage));
      }

      posteChunks.forEach((posteChunk, chunkIndex) => {
        if (chunkIndex > 0) {
          doc.addPage({ margin: 20, size: 'A4', layout: 'landscape' });
          currentPage++;
          contentY = drawOfficialHeader(currentPage, totalPages, `DÉTAIL DU CENTRE: ${centre.nom.toUpperCase()} (suite)`);
          contentY += 20;
        }

        let tableY = contentY;
        let x = pageMargin;

        // En-tête tableau
        doc.fontSize(6).font('Helvetica-Bold');
        
        // Colonne rubriques
        doc.rect(x, tableY, rubriqueWidth, rowHeight * 2).fillAndStroke('#1E3A8A', '#000');
        doc.fillColor('#fff').text('RUBRIQUES', x + 3, tableY + rowHeight - 2, { width: rubriqueWidth - 6, align: 'center' });
        x += rubriqueWidth;

        // Colonnes postes
        posteChunk.forEach((poste, idx) => {
          doc.rect(x, tableY, posteWidth, rowHeight * 2).fillAndStroke('#f0f0f0', '#000');
          doc.fillColor('#000').fontSize(5);
          const posteLabel = poste.numero ? `Poste ${poste.numero}` : `P${idx + 1}`;
          doc.text(posteLabel, x + 2, tableY + rowHeight - 2, { width: posteWidth - 4, align: 'center' });
          x += posteWidth;
        });

        // Colonne TOTAL
        doc.rect(x, tableY, totalColWidth, rowHeight * 2).fillAndStroke('#1E3A8A', '#000');
        doc.fillColor('#fff').fontSize(6).font('Helvetica-Bold');
        doc.text('TOTAL', x + 3, tableY + rowHeight - 2, { width: totalColWidth - 6, align: 'center' });

        tableY += rowHeight * 2;
        doc.fillColor('#000');

        // Rubriques de données
        const dataRubriques = [
          { key: 'dateOuverture', label: 'Heure Ouverture', format: 'time' },
          { key: 'dateFermeture', label: 'Heure Fermeture', format: 'time' },
          { key: 'nombreInscrits', label: 'Inscrits' },
          { key: 'nombreVotants', label: 'Votants' },
          { key: 'abstentions', label: 'Abstentions' },
          { key: 'tauxParticipation', label: 'Taux Particip. (%)', format: 'percent' },
          { key: 'suffragesExprimes', label: 'Suff. Exprimés' },
          { key: 'bulletinsNuls', label: 'Bulletins Nuls' },
          { key: 'derogations', label: 'Dérogations' },
          { key: 'procurations', label: 'Procurations' }
        ];

        // Afficher les rubriques
        doc.fontSize(5).font('Helvetica');
        dataRubriques.forEach((rubrique, rubIdx) => {
          x = pageMargin;
          const bgColor = rubIdx % 2 === 0 ? '#fafafa' : '#ffffff';
          
          doc.rect(x, tableY, rubriqueWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
          doc.fillColor('#000').font('Helvetica-Bold').text(rubrique.label, x + 3, tableY + 4, { width: rubriqueWidth - 6 });
          x += rubriqueWidth;

          let total = 0;
          let count = 0;

          posteChunk.forEach(poste => {
            const result = poste.resultSaisies && poste.resultSaisies.length > 0 ? poste.resultSaisies[0] : null;
            let value = '0'; // Par défaut 0 au lieu de '-'
            
            if (rubrique.format === 'time') {
              // Pour les heures, afficher --:-- si pas de données
              value = '--:--';
              if (result && result[rubrique.key]) {
                const d = new Date(result[rubrique.key]);
                if (!isNaN(d.getTime())) {
                  value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
              }
            } else if (rubrique.format === 'percent') {
              // Pour les pourcentages
              value = '0';
              if (result && result[rubrique.key] !== null && result[rubrique.key] !== undefined) {
                value = `${result[rubrique.key]}`;
                total += parseFloat(result[rubrique.key]) || 0;
                count++;
              }
            } else {
              // Pour les valeurs numériques
              value = '0';
              if (result && result[rubrique.key] !== null && result[rubrique.key] !== undefined) {
                value = result[rubrique.key].toString();
                total += parseInt(result[rubrique.key]) || 0;
              }
            }

            doc.rect(x, tableY, posteWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
            doc.fillColor('#000').font('Helvetica').text(value, x + 2, tableY + 4, { width: posteWidth - 4, align: 'center' });
            x += posteWidth;
          });

          // Total
          let totalValue = '0';
          if (rubrique.format === 'time') {
            totalValue = '--:--'; // Pas de total pour les heures
          } else if (rubrique.format === 'percent') {
            if (count > 0) {
              totalValue = `${(total / count).toFixed(1)}`;
            } else {
              totalValue = '0';
            }
          } else {
            totalValue = total.toString();
          }
          doc.rect(x, tableY, totalColWidth, rowHeight).fillAndStroke('#e8e8e8', '#ccc');
          doc.fillColor('#000').font('Helvetica-Bold').text(totalValue, x + 2, tableY + 4, { width: totalColWidth - 4, align: 'center' });

          tableY += rowHeight;
        });

        // Ligne séparatrice avant les partis
        tableY += 2;
        doc.moveTo(pageMargin, tableY).lineTo(pageMargin + rubriqueWidth + (posteChunk.length * posteWidth) + totalColWidth, tableY).stroke();
        tableY += 4;

        // Résultats par parti
        doc.fontSize(5).font('Helvetica');
        partisData.forEach((parti, partiIdx) => {
          x = pageMargin;
          const bgColor = partiIdx % 2 === 0 ? '#fff8e6' : '#ffffff';
          
          doc.rect(x, tableY, rubriqueWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
          doc.fillColor('#000').font('Helvetica-Bold');
          const partiLabel = parti.sigle || parti.nom;
          doc.text(partiLabel, x + 3, tableY + 4, { width: rubriqueWidth - 6 });
          x += rubriqueWidth;

          let totalVoix = 0;

          posteChunk.forEach(poste => {
            const result = poste.resultSaisies && poste.resultSaisies.length > 0 ? poste.resultSaisies[0] : null;
            let voix = 0; // Par défaut 0 au lieu de '-'
            
            if (result && result.resultPartis) {
              const rp = result.resultPartis.find(r => r.partiId === parti.id);
              if (rp) {
                voix = rp.voix || 0;
                totalVoix += voix;
              }
            }

            doc.rect(x, tableY, posteWidth, rowHeight).fillAndStroke(bgColor, '#ccc');
            doc.fillColor('#000').font('Helvetica').text(voix.toString(), x + 2, tableY + 4, { width: posteWidth - 4, align: 'center' });
            x += posteWidth;
          });

          // Total voix parti
          doc.rect(x, tableY, totalColWidth, rowHeight).fillAndStroke('#ffe0b3', '#ccc');
          doc.fillColor('#000').font('Helvetica-Bold').text(totalVoix.toString(), x + 2, tableY + 4, { width: totalColWidth - 4, align: 'center' });

          tableY += rowHeight;
        });

        // Ligne TOTAL VOIX
        x = pageMargin;
        doc.rect(x, tableY, rubriqueWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
        doc.fillColor('#fff').font('Helvetica-Bold').text('TOTAL VOIX', x + 3, tableY + 4, { width: rubriqueWidth - 6 });
        x += rubriqueWidth;

        let grandTotal = 0;
        posteChunk.forEach(poste => {
          const result = poste.resultSaisies && poste.resultSaisies.length > 0 ? poste.resultSaisies[0] : null;
          let posteTotal = 0;
          
          if (result && result.resultPartis) {
            posteTotal = result.resultPartis.reduce((sum, rp) => sum + (rp.voix || 0), 0);
          }
          grandTotal += posteTotal;

          doc.rect(x, tableY, posteWidth, rowHeight).fillAndStroke('#1E3A8A', '#000');
          doc.fillColor('#fff').font('Helvetica-Bold').text(posteTotal.toString(), x + 2, tableY + 4, { width: posteWidth - 4, align: 'center' });
          x += posteWidth;
        });

        doc.rect(x, tableY, totalColWidth, rowHeight).fillAndStroke('#0f2557', '#000');
        doc.fillColor('#fff').font('Helvetica-Bold').text(grandTotal.toString(), x + 2, tableY + 4, { width: totalColWidth - 4, align: 'center' });

        contentY = tableY + rowHeight + 10;
      });
    });

    // ============ DERNIÈRE PAGE: TABLEAU RÉCAPITULATIF PAR CENTRE ============
    doc.addPage({ margin: 20, size: 'A4', layout: 'landscape' });
    currentPage++;
    contentY = drawOfficialHeader(currentPage, totalPages, 'TABLEAU RÉCAPITULATIF PAR CENTRE DE VOTE');
    contentY += 15;

    // Tableau récap
    const recapRubriques = ['Centre', 'Postes', 'Inscrits', 'Votants', 'Suff.Exp', ...partisData.map(p => p.sigle || p.nom), 'Total'];
    const nbCols = recapRubriques.length;
    const recapColWidth = Math.floor((pageWidth) / nbCols);
    const recapRowHeight = 16;

    // En-tête
    let rx = pageMargin;
    doc.fontSize(5).font('Helvetica-Bold');
    recapRubriques.forEach((rub, idx) => {
      const colW = idx === 0 ? recapColWidth * 1.5 : recapColWidth * 0.9;
      doc.rect(rx, contentY, colW, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').text(rub, rx + 2, contentY + 5, { width: colW - 4, align: 'center' });
      rx += colW;
    });
    contentY += recapRowHeight;

    // Données par centre
    let totaux = {
      postes: 0,
      inscrits: 0,
      votants: 0,
      suffrages: 0,
      partis: {}
    };
    partisData.forEach(p => totaux.partis[p.id] = 0);

    doc.fontSize(5).font('Helvetica');
    centres.forEach((centre, cIdx) => {
      const bgColor = cIdx % 2 === 0 ? '#f8f9fa' : '#ffffff';
      rx = pageMargin;

      // Calculer les stats du centre
      let centreStats = { postes: centre.postesDeVote.length, inscrits: 0, votants: 0, suffrages: 0, partis: {} };
      partisData.forEach(p => centreStats.partis[p.id] = 0);

      centre.postesDeVote.forEach(poste => {
        if (poste.resultSaisies && poste.resultSaisies.length > 0) {
          const r = poste.resultSaisies[0];
          centreStats.inscrits += r.nombreInscrits || 0;
          centreStats.votants += r.nombreVotants || 0;
          centreStats.suffrages += r.suffragesExprimes || 0;
          if (r.resultPartis) {
            r.resultPartis.forEach(rp => {
              if (centreStats.partis[rp.partiId] !== undefined) {
                centreStats.partis[rp.partiId] += rp.voix || 0;
              }
            });
          }
        }
      });

      // Ajouter aux totaux
      totaux.postes += centreStats.postes;
      totaux.inscrits += centreStats.inscrits;
      totaux.votants += centreStats.votants;
      totaux.suffrages += centreStats.suffrages;
      partisData.forEach(p => totaux.partis[p.id] += centreStats.partis[p.id]);

      // Nom centre
      const col1W = recapColWidth * 1.5;
      doc.rect(rx, contentY, col1W, recapRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').text(centre.nom, rx + 2, contentY + 5, { width: col1W - 4 });
      rx += col1W;

      // Données
      const vals = [centreStats.postes, centreStats.inscrits, centreStats.votants, centreStats.suffrages];
      partisData.forEach(p => vals.push(centreStats.partis[p.id]));
      vals.push(Object.values(centreStats.partis).reduce((a, b) => a + b, 0));

      vals.forEach(val => {
        const colW = recapColWidth * 0.9;
        doc.rect(rx, contentY, colW, recapRowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica').text(val.toLocaleString('fr-FR'), rx + 2, contentY + 5, { width: colW - 4, align: 'center' });
        rx += colW;
      });

      contentY += recapRowHeight;
    });

    // Ligne TOTAL
    rx = pageMargin;
    const col1W = recapColWidth * 1.5;
    doc.rect(rx, contentY, col1W, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').font('Helvetica-Bold').text('TOTAL', rx + 2, contentY + 5, { width: col1W - 4 });
    rx += col1W;

    const totalVals = [totaux.postes, totaux.inscrits, totaux.votants, totaux.suffrages];
    partisData.forEach(p => totalVals.push(totaux.partis[p.id]));
    totalVals.push(Object.values(totaux.partis).reduce((a, b) => a + b, 0));

    totalVals.forEach(val => {
      const colW = recapColWidth * 0.9;
      doc.rect(rx, contentY, colW, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').font('Helvetica-Bold').text(val.toLocaleString('fr-FR'), rx + 2, contentY + 5, { width: colW - 4, align: 'center' });
      rx += colW;
    });

    // Zone signature
    contentY += recapRowHeight + 30;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
    doc.text('VISA ET SIGNATURE', pageMargin, contentY);

    contentY += 15;
    doc.fontSize(8).font('Helvetica');
    doc.text('Superviseur d\'Arrondissement: ............................................', pageMargin, contentY);
    doc.text('Signature: ............................................', pageMargin + 400, contentY);
    
    contentY += 20;
    doc.text('Date: ___/___/______', pageMargin, contentY);

    // Footer
    contentY += 30;
    doc.fontSize(7).fillColor('#666');
    doc.text(`Document généré le: ${new Date().toLocaleString('fr-FR')}`, pageMargin, contentY);

    doc.end();

  } catch (err) {
    console.error('Erreur export récap général:', err);
    if (!res.headersSent) {
      return res.status(500).json(error(`Erreur lors de la génération du PDF: ${err.message}`, 500));
    }
    next(err);
  }
};

// ============ EXPORT RÉCAPITULATIF DES HORAIRES PAR ARRONDISSEMENT PDF ============
const exportRecapHorairesPDF = async (req, res, next) => {
  try {
    const { electionId, arrondissementId } = req.params;
    const PDFDocument = require('pdfkit');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Récupérer l'arrondissement avec ses données
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
          orderBy: { nom: 'asc' },
          include: {
            centresDeVote: {
              orderBy: { nom: 'asc' },
              include: {
                postesDeVote: {
                  orderBy: { numero: 'asc' },
                  include: {
                    resultSaisies: {
                      where: { 
                        electionId,
                        status: 'VALIDEE'
                      },
                      select: {
                        dateOuverture: true,
                        dateFermeture: true
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

    await prisma.$disconnect();

    // Convertir en objets simples
    const arrondissementData = JSON.parse(JSON.stringify(arrondissement));
    const electionData = JSON.parse(JSON.stringify(election));

    // Collecter tous les centres avec leurs données
    const centres = [];
    arrondissementData.quartiers.forEach(quartier => {
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

    // Fonction pour formater une heure
    const formatTime = (dateValue) => {
      if (!dateValue) return '--:--';
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '--:--';
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    // Calculer les statistiques globales
    let totalCentres = centres.length;
    let totalPostes = 0;
    let postesAvecHoraires = 0;

    centres.forEach(centre => {
      totalPostes += centre.postesDeVote.length;
      centre.postesDeVote.forEach(poste => {
        if (poste.resultSaisies && poste.resultSaisies.length > 0 && poste.resultSaisies[0].dateOuverture) {
          postesAvecHoraires++;
        }
      });
    });

    // ============ CRÉATION DU PDF ============
    const doc = new PDFDocument({ 
      margin: 20, 
      size: 'A4', 
      layout: 'portrait',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recap_horaires_${arrondissementId}_${Date.now()}.pdf"`);
    doc.pipe(res);

    const pageMargin = 20;
    const pageWidth = 595 - (pageMargin * 2);
    const pageHeight = 842 - (pageMargin * 2);

    // ============ FONCTION DESSINER EN-TÊTE OFFICIEL ============
    const drawOfficialHeader = (pageNum, totalPages) => {
      const headerY = pageMargin;
      
      // Logo central
      const logoPath = path.join(__dirname, '../assets/images/logo_benin.jpeg');
      const logoSize = 35;
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
      const coatOfArmsSize = 30;
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

      // Texte ministère
      const blocLeftX = pageMargin + coatOfArmsSize + 8;
      const blocWidth = 100;
      const leftTextY = headerY + 3;
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('MINISTÈRE DE LA', blocLeftX, leftTextY, { width: blocWidth, align: 'left' });
      doc.text('DÉCENTRALISATION ET DE LA', blocLeftX, leftTextY + 7, { width: blocWidth, align: 'left' });
      doc.text('GOUVERNANCE LOCALE', blocLeftX, leftTextY + 14, { width: blocWidth, align: 'left' });

      // Ligne drapeau
      const flagLineY = leftTextY + 24;
      const flagLineHeight = 4;
      const flagLineWidth = 90;
      const colorWidth = flagLineWidth / 3;
      doc.rect(blocLeftX, flagLineY, colorWidth, flagLineHeight).fill('#007A5E');
      doc.rect(blocLeftX + colorWidth, flagLineY, colorWidth, flagLineHeight).fill('#FCD116');
      doc.rect(blocLeftX + colorWidth * 2, flagLineY, colorWidth, flagLineHeight).fill('#CE1126');
      
      doc.fontSize(7).font('Helvetica').fillColor('#000');
      doc.text('MAIRIE DE COTONOU', blocLeftX, flagLineY + 6, { width: blocWidth, align: 'left' });
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
      doc.text('RÉPUBLIQUE DU BÉNIN', blocLeftX, flagLineY + 14, { width: blocWidth, align: 'left' });
      
      // Coordonnées droite
      const rightX = pageWidth - 100;
      doc.fontSize(7).font('Helvetica');
      doc.text('01 BP: 358 COTONOU', rightX, leftTextY, { width: 120, align: 'right' });
      doc.text('TÉL: 229 21.31.37.70', rightX, leftTextY + 7, { width: 120, align: 'right' });
      doc.text('Email: pref.cotonou@gouv.bj', rightX, leftTextY + 14, { width: 120, align: 'right' });

      const lineY1 = flagLineY + 26;
      doc.moveTo(pageMargin, lineY1).lineTo(pageMargin + pageWidth, lineY1).stroke();

      // Titre principal
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('RÉCAPITULATIF DES HORAIRES', pageMargin, lineY1 + 6, { 
        width: pageWidth, 
        align: 'center' 
      });
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('D\'OUVERTURE ET DE FERMETURE', pageMargin, lineY1 + 20, { 
        width: pageWidth, 
        align: 'center' 
      });

      // Infos géographiques
      const departement = arrondissementData.circonscription?.commune?.departement?.nom || '';
      const commune = arrondissementData.circonscription?.commune?.nom || '';
      doc.fontSize(10).font('Helvetica');
      const geoY = lineY1 + 36;
      doc.text(`Département: ${departement}  |  Commune: ${commune}  |  Arrondissement: ${arrondissementData.nom}`, pageMargin, geoY, { 
        width: pageWidth, 
        align: 'center' 
      });
      doc.text(`Élection: ${electionData.type} du 11/01/2026`, pageMargin, geoY + 12, { 
        width: pageWidth, 
        align: 'center' 
      });

      // Numéro de page
      doc.fontSize(7).fillColor('#666');
      doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 30, geoY + 12, { width: 50, align: 'right' });
      doc.fillColor('#000');

      const lineY2 = geoY + 26;
      doc.moveTo(pageMargin, lineY2).lineTo(pageMargin + pageWidth, lineY2).stroke();

      return lineY2;
    };

    // Calculer le nombre de pages nécessaires
    const centresPerPage = 4; // Nombre de centres par page après la première
    const totalPages = Math.ceil((centres.length) / centresPerPage) + 1; // +1 pour la page récap
    let currentPage = 1;

    // ============ PAGE 1: STATISTIQUES ET PREMIERS CENTRES ============
    let contentY = drawOfficialHeader(currentPage, totalPages);
    contentY += 15;

    // Section Statistiques Globales
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text('STATISTIQUES GLOBALES', pageMargin, contentY);
    doc.fillColor('#000');
    contentY += 12;

    // Box statistiques
    const statsBoxWidth = pageWidth;
    const statsBoxHeight = 50;
    doc.rect(pageMargin, contentY, statsBoxWidth, statsBoxHeight).stroke();
    
    doc.fontSize(10).font('Helvetica');
    const statsY = contentY + 12;
    const col1X = pageMargin + 20;
    const col2X = pageMargin + 200;
    const col3X = pageMargin + 380;

    doc.font('Helvetica').text('Nombre total de Centres:', col1X, statsY);
    doc.font('Helvetica-Bold').text(totalCentres.toString(), col1X + 130, statsY);

    doc.font('Helvetica').text('Nombre total de Postes:', col2X, statsY);
    doc.font('Helvetica-Bold').text(totalPostes.toString(), col2X + 130, statsY);

    doc.font('Helvetica').text('Postes avec horaires:', col3X, statsY);
    doc.font('Helvetica-Bold').text(postesAvecHoraires.toString(), col3X + 110, statsY);

    contentY += statsBoxHeight + 15;

    // ============ AFFICHAGE DES CENTRES ============
    const rowHeight = 26;
    const colPoste = 80;
    const colOuverture = 100;
    const colFermeture = 100;
    const tableWidth = colPoste + colOuverture + colFermeture;

    centres.forEach((centre, centreIndex) => {
      // Vérifier si on a besoin d'une nouvelle page
      const estimatedHeight = 50 + (centre.postesDeVote.length + 1) * rowHeight;
      if (contentY + estimatedHeight > pageHeight - 50) {
        doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
        currentPage++;
        contentY = drawOfficialHeader(currentPage, totalPages);
        contentY += 15;
      }

      // Titre du centre
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E3A8A');
      doc.text(`CENTRE: ${centre.nom.toUpperCase()}`, pageMargin, contentY);
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text(`Quartier: ${centre.quartierNom}`, pageMargin + 350, contentY);
      doc.fillColor('#000');
      contentY += 15;

      // En-tête tableau
      let x = pageMargin;
      doc.fontSize(10).font('Helvetica-Bold');
      
      doc.rect(x, contentY, colPoste, rowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').text('POSTE', x + 5, contentY + 5, { width: colPoste - 10, align: 'center' });
      x += colPoste;

      doc.rect(x, contentY, colOuverture, rowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').text('HEURE OUVERTURE', x + 5, contentY + 5, { width: colOuverture - 10, align: 'center' });
      x += colOuverture;

      doc.rect(x, contentY, colFermeture, rowHeight).fillAndStroke('#1E3A8A', '#000');
      doc.fillColor('#fff').text('HEURE FERMETURE', x + 5, contentY + 5, { width: colFermeture - 10, align: 'center' });

      contentY += rowHeight;
      doc.fillColor('#000');

      // Données des postes
      doc.fontSize(10).font('Helvetica');
      centre.postesDeVote.forEach((poste, idx) => {
        const result = poste.resultSaisies && poste.resultSaisies.length > 0 ? poste.resultSaisies[0] : null;
        const heureOuverture = result ? formatTime(result.dateOuverture) : '--:--';
        const heureFermeture = result ? formatTime(result.dateFermeture) : '--:--';
        const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';

        x = pageMargin;
        
        doc.rect(x, contentY, colPoste, rowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica-Bold').text(`Poste ${poste.numero || (idx + 1)}`, x + 5, contentY + 5, { width: colPoste - 10, align: 'center' });
        x += colPoste;

        doc.rect(x, contentY, colOuverture, rowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica').text(heureOuverture, x + 5, contentY + 5, { width: colOuverture - 10, align: 'center' });
        x += colOuverture;

        doc.rect(x, contentY, colFermeture, rowHeight).fillAndStroke(bgColor, '#ccc');
        doc.fillColor('#000').font('Helvetica').text(heureFermeture, x + 5, contentY + 5, { width: colFermeture - 10, align: 'center' });

        contentY += rowHeight;
      });

      contentY += 15; // Espace entre les centres
    });

    // ============ DERNIÈRE PAGE: TABLEAU RÉCAPITULATIF ============
    doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
    currentPage++;
    contentY = drawOfficialHeader(currentPage, totalPages);
    contentY += 15;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E3A8A');
    doc.text('TABLEAU RÉCAPITULATIF PAR CENTRE', pageMargin, contentY);
    doc.fillColor('#000');
    contentY += 15;

    // En-tête tableau récap
    const recapColCentre = 180;
    const recapColPostes = 60;
    const recapColOuv = 80;
    const recapColFerm = 80;
    const recapRowHeight = 24;

    let rx = pageMargin;
    doc.fontSize(9).font('Helvetica-Bold');
    
    doc.rect(rx, contentY, recapColCentre, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').text('CENTRE DE VOTE', rx + 5, contentY + 4, { width: recapColCentre - 10 });
    rx += recapColCentre;

    doc.rect(rx, contentY, recapColPostes, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').text('NB POSTES', rx + 2, contentY + 4, { width: recapColPostes - 4, align: 'center' });
    rx += recapColPostes;

    doc.rect(rx, contentY, recapColOuv, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').text('OUVERT. MOY.', rx + 2, contentY + 4, { width: recapColOuv - 4, align: 'center' });
    rx += recapColOuv;

    doc.rect(rx, contentY, recapColFerm, recapRowHeight).fillAndStroke('#1E3A8A', '#000');
    doc.fillColor('#fff').text('FERMET. MOY.', rx + 2, contentY + 4, { width: recapColFerm - 4, align: 'center' });

    contentY += recapRowHeight;
    doc.fillColor('#000');

    // Données récap par centre
    doc.fontSize(9).font('Helvetica');
    let totalPostesGlobal = 0;
    let totalMinutesOuv = 0;
    let totalMinutesFerm = 0;
    let countHoraires = 0;

    centres.forEach((centre, idx) => {
      const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
      const nbPostes = centre.postesDeVote.length;
      totalPostesGlobal += nbPostes;

      // Calculer moyenne horaires du centre
      let sumMinutesOuv = 0;
      let sumMinutesFerm = 0;
      let countCentre = 0;

      centre.postesDeVote.forEach(poste => {
        const result = poste.resultSaisies && poste.resultSaisies.length > 0 ? poste.resultSaisies[0] : null;
        if (result && result.dateOuverture) {
          const d = new Date(result.dateOuverture);
          if (!isNaN(d.getTime())) {
            sumMinutesOuv += d.getHours() * 60 + d.getMinutes();
            sumMinutesFerm += (d.getHours() + 10) * 60 + d.getMinutes();
            countCentre++;
          }
        }
      });

      totalMinutesOuv += sumMinutesOuv;
      totalMinutesFerm += sumMinutesFerm;
      countHoraires += countCentre;

      const moyOuv = countCentre > 0 ? Math.floor(sumMinutesOuv / countCentre) : null;
      const moyFerm = countCentre > 0 ? Math.floor(sumMinutesFerm / countCentre) : null;
      const moyOuvStr = moyOuv !== null ? `${String(Math.floor(moyOuv / 60)).padStart(2, '0')}:${String(moyOuv % 60).padStart(2, '0')}` : '--:--';
      const moyFermStr = moyFerm !== null ? `${String(Math.floor(moyFerm / 60) % 24).padStart(2, '0')}:${String(moyFerm % 60).padStart(2, '0')}` : '--:--';

      rx = pageMargin;
      
      doc.rect(rx, contentY, recapColCentre, recapRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica-Bold').text(centre.nom, rx + 3, contentY + 4, { width: recapColCentre - 6 });
      rx += recapColCentre;

      doc.rect(rx, contentY, recapColPostes, recapRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica').text(nbPostes.toString(), rx + 2, contentY + 4, { width: recapColPostes - 4, align: 'center' });
      rx += recapColPostes;

      doc.rect(rx, contentY, recapColOuv, recapRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica').text(moyOuvStr, rx + 2, contentY + 4, { width: recapColOuv - 4, align: 'center' });
      rx += recapColOuv;

      doc.rect(rx, contentY, recapColFerm, recapRowHeight).fillAndStroke(bgColor, '#ccc');
      doc.fillColor('#000').font('Helvetica').text(moyFermStr, rx + 2, contentY + 4, { width: recapColFerm - 4, align: 'center' });

      contentY += recapRowHeight;
    });

    // Ligne TOTAL
    const globalMoyOuv = countHoraires > 0 ? Math.floor(totalMinutesOuv / countHoraires) : null;
    const globalMoyFerm = countHoraires > 0 ? Math.floor(totalMinutesFerm / countHoraires) : null;
    const globalMoyOuvStr = globalMoyOuv !== null ? `${String(Math.floor(globalMoyOuv / 60)).padStart(2, '0')}:${String(globalMoyOuv % 60).padStart(2, '0')}` : '--:--';
    const globalMoyFermStr = globalMoyFerm !== null ? `${String(Math.floor(globalMoyFerm / 60) % 24).padStart(2, '0')}:${String(globalMoyFerm % 60).padStart(2, '0')}` : '--:--';

    rx = pageMargin;
    doc.rect(rx, contentY, recapColCentre, recapRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text('TOTAL ARRONDISSEMENT', rx + 3, contentY + 4, { width: recapColCentre - 6 });
    rx += recapColCentre;

    doc.rect(rx, contentY, recapColPostes, recapRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(totalPostesGlobal.toString(), rx + 2, contentY + 4, { width: recapColPostes - 4, align: 'center' });
    rx += recapColPostes;

    doc.rect(rx, contentY, recapColOuv, recapRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(globalMoyOuvStr, rx + 2, contentY + 4, { width: recapColOuv - 4, align: 'center' });
    rx += recapColOuv;

    doc.rect(rx, contentY, recapColFerm, recapRowHeight).fillAndStroke('#d0d0d0', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').text(globalMoyFermStr, rx + 2, contentY + 4, { width: recapColFerm - 4, align: 'center' });

    // Zone signature
    contentY += recapRowHeight + 40;
    doc.fontSize(8).font('Helvetica');
    doc.text('Superviseur d\'Arrondissement: ............................................', pageMargin, contentY);
    doc.text('Signature: ............................................', pageMargin + 300, contentY);
    
    contentY += 25;
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageMargin, contentY);

    // Footer
    contentY += 30;
    doc.fontSize(7).fillColor('#666');
    doc.text(`Document généré le: ${new Date().toLocaleString('fr-FR')}`, pageMargin, contentY);

    doc.end();

  } catch (err) {
    console.error('Erreur export récap horaires:', err);
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
  exportCommunePDF,
  exportCentresParArrondissementPDF,
  exportCentresParArrondissementPDFForSA,
  exportRecapGeneralResultatsPDF,
  exportRecapHorairesPDF
};