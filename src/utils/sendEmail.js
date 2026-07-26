const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const verifyMailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Mail Server Connected");
  } catch (error) {
    console.error("Mail Connection Error:", error.message);
    throw error;
  }
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"TurfX" <${process.env.EMAIL_USER}>`,
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