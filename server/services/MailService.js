const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.MAIL_FROM || process.env.SMTP_FROM;
    this.isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && this.from);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async sendVerificationCode(email, code) {
    if (!this.isConfigured) {
      const error = new Error('SMTP not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM');
      error.code = 'SMTP_NOT_CONFIGURED';
      throw error;
    }

    const text = `Votre code de connexion Eternal Ascent est: ${code}. Il expire dans 10 minutes.`;
    const html = `<p>Votre code de connexion Eternal Ascent est:</p><p style="font-size:22px;font-weight:bold;letter-spacing:2px;">${code}</p><p>Il expire dans 10 minutes.</p>`;

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Votre code de connexion - Eternal Ascent',
      text,
      html
    });
  }
}

module.exports = MailService;


