const express = require('express');
const {
    createUser, getAllUsers, getUserById, updateUser, deleteUser,
    getUsersByRole, getSAByArrondissement, getAgentsByCentre
} = require('../controllers/userController');
const { validateCreateUser, validateUpdateUser } = require('../middlewares/validation');

const router = express.Router();

// CRUD de base
router.post('/users', validateCreateUser, createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', validateUpdateUser, updateUser);
router.delete('/users/:id', deleteUser);

router.get('/users/role/:role', getUsersByRole);
router.get('/users/arrondissement/:arrondissementId/sa', getSAByArrondissement);
router.get('/users/centre/:centreId/agents', getAgentsByCentre);

module.exports = router;