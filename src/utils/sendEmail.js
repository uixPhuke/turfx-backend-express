const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const verifyMailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Mail Server Connected");
    return true;
  } catch (error) {
    console.warn(
      "Mail server unavailable. Continuing without email."
    );
    console.warn(error.message);

    // Don't crash the server
    return false;
  }
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"PLAYZA" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Unable to send email");
  }
};

module.exports = {
  sendEmail,
  verifyMailConnection,
};