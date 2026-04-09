const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_SECURE) === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

const sendOTPEmail = async (email, otp) => {
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Smart Waste OTP Code",
    text: `Your OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in ${expiryMinutes} minutes.</p>`,
  });
};

module.exports = {
  sendOTPEmail,
};
