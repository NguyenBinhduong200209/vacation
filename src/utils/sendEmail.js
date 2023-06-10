import nodemailer from "nodemailer";

export default async function sendMail(email) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      transactionLog: true,
      allowInternalNetworkInterfaces: false,
    });

    const message = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "RESET PASSWORD SUCCESSFULLY",
      html: `
        <p>
          <b>Hello</b> to myself 
          <img src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D&w=1000&q=80"/>
        </p>`,
    };

    await transporter.sendMail(message, (error, info) => {
      if (error) return error;
    });
  } catch (error) {
    return error;
  }
}
