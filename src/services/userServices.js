const prisma = require('../config/database');

const createUser = async (userData) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
    });
    
    if (existingUser) {
        throw new Error('EMAIL_EXISTS');
    }

    console.log("ceeating ", userData);
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            arrondissementId: userData.arrondissementId || null,
            telephone: userData.telephone,
            centreDeVoteId: userData.centreDeVoteId || null
        },
        include: {
            arrondissement: true,
            centreDeVote: true
        }
    });
    console.log("creted ",user);
    return user;
};


const getAllUsers = async (options = {}) => {
    const { page = 1, limit = 10, role, search } = options;
    const skip = (page - 1) * limit;
    const where = {};
    
    if (role) where.role = role;
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                arrondissement: { select: { id: true, code: true, nom: true } },
                centreDeVote: { select: { id: true, nom: true, adresse: true } }
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            arrondissement: { include: { commune: { include: { departement: true } } } },
            centreDeVote: { include: { quartier: true } }
        }
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
};

const getUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
        include: { arrondissement: true, centreDeVote: true }
    });
};

const updateUser = async (userId, updateData) => {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new Error('USER_NOT_FOUND');

    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: updateData.email } });
        if (emailExists) throw new Error('EMAIL_EXISTS');
    }

    return await prisma.user.update({
        where: { id: userId },
        data: {
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
            ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
            ...(updateData.telephone !== undefined && { telephone: updateData.telephone }),
            ...(updateData.role && { role: updateData.role }),
            ...(updateData.arrondissementId !== undefined && { arrondissementId: updateData.arrondissementId }),
            ...(updateData.centreDeVoteId !== undefined && { centreDeVoteId: updateData.centreDeVoteId })
        },
        include: { arrondissement: true, centreDeVote: true }
    });
};

const deleteUser = async (userId) => {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new Error('USER_NOT_FOUND');
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Utilisateur supprimé avec succès' };
};

const getUsersByRole = async (role) => {
    return await prisma.user.findMany({
        where: { role },
        orderBy: { createdAt: 'desc' },
        include: { arrondissement: true, centreDeVote: true }
    });
};

const getSAByArrondissement = async (arrondissementId) => {
    return await prisma.user.findMany({
        where: { role: 'SA', arrondissementId },
        include: { arrondissement: true }
    });
};

const getAgentsByCentre = async (centreDeVoteId) => {
    return await prisma.user.findMany({
        where: { role: 'AGENT', centreDeVoteId },
        include: { centreDeVote: true }
    });
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
    getUsersByRole,
    getSAByArrondissement,
    getAgentsByCentre
};