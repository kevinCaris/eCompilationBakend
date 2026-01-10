const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendVerificationEmail = async (email, code, firstName = '') => {
    const mailOptions = {
        from: `"eCompilation Mairie" <${process.env.SMTP_USER || 'noreply@mairie.bj'}>`,
        to: email,
        subject: 'Votre code de connexion - eCompilation',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">eCompilation</h1>
                    <p style="margin: 5px 0 0;">Système de compilation des résultats</p>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 16px;">
                        Bonjour${firstName ? ' ' + firstName : ''},
                    </p>
                    
                    <p style="color: #334155; font-size: 16px;">
                        Voici votre code de connexion :
                    </p>
                    
                    <div style="background: #1e40af; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                        ${code}
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center;">
                        Ce code expire dans <strong>10 minutes</strong>.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        Si vous n'avez pas demandé ce code, ignorez cet email.<br>
                        Ne partagez jamais ce code avec personne.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 15px; color: #94a3b8; font-size: 12px;">
                    © 2026 Mairie - Système eCompilation
                </div>
            </div>
        `
    };

    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('========================================');
            console.log(`EMAIL DE VERIFICATION`);
            console.log(`To: ${email}`);
            console.log(`Code: ${code}`);
            console.log('========================================');
            return { success: true, mode: 'development' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erreur envoi email:', error);
        console.log(`[FALLBACK] Code pour ${email}: ${code}`);
        throw new Error('EMAIL_SEND_FAILED');
    }
};

module.exports = {
    sendVerificationEmail
};
