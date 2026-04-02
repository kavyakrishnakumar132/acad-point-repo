import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function main() {
    try {
        console.log('Sending email from:', process.env.EMAIL_USER);
        let info = await transporter.sendMail({
            from: `"AcadPoint" <${process.env.EMAIL_USER}>`,
            to: 'mhhridhik@gmail.com', // Test email
            subject: "Test Email from AcadPoint",
            text: "This is a test email.",
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
main();
