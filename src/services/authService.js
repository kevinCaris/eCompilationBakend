const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// Durée d'expiration du code OTP en minutes (configurable via .env OTP_EXPIRY_MINUTES)
const CODE_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 1;

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const requestLoginCode = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    // Vérifier si l'utilisateur a le droit d'accéder à la plateforme
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'SA'];
    if (!allowedRoles.includes(user.role)) {
        throw new Error('ACCESS_DENIED');
    }

    await prisma.emailVerificationCode.updateMany({
        where: {
            userId: user.id,
            used: false
        },
        data: { used: true }
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

    await prisma.emailVerificationCode.create({
        data: {
            userId: user.id,
            code,
            expiresAt
        }
    });

    await sendVerificationEmail(user.email, code, user.firstName);

    return {
        message: 'Code envoyé par email',
        email: user.email,
        expiresIn: CODE_EXPIRES_MINUTES * 60
    };
};

const verifyCodeAndLogin = async (email, code) => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
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
            },
            centreDeVote: true
        }
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const verificationCode = await prisma.emailVerificationCode.findFirst({
        where: {
            userId: user.id,
            code: code,
            used: false,
            expiresAt: { gt: new Date() }
        }
    });

    if (!verificationCode) {
        throw new Error('INVALID_OR_EXPIRED_CODE');
    }

    await prisma.emailVerificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true }
    });

    // Générer le JWT
    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            telephone: user.telephone,
            role: user.role,
            arrondissement: user.arrondissement,
            centreDeVote: user.centreDeVote
        }
    };
};

const resendCode = async (email) => {
    return await requestLoginCode(email);
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new Error('INVALID_TOKEN');
    }
};


const getAuthenticatedUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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
            },
            centreDeVote: true
        }
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telephone: user.telephone,
        role: user.role,
        arrondissement: user.arrondissement,
        centreDeVote: user.centreDeVote
    };
};

module.exports = {
    requestLoginCode,
    verifyCodeAndLogin,
    resendCode,
    verifyToken,
    getAuthenticatedUser
};
