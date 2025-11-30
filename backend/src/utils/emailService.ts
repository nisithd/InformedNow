import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Use Gmail as the "from" address
const getFromEmail = () => {
  return `"InformedNow" <${process.env.EMAIL_USER}>`;
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject,
      html,
      text: text || '', // Plain text fallback
    });

    console.log('✅ Email sent (Gmail):', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Verify email configuration on startup
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready (Gmail)');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    console.error('Check EMAIL_USER and EMAIL_PASSWORD in .env file');
    return false;
  }
}