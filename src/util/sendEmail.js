import nodemailer from 'nodemailer';

// Function to send reset password email
export const mailSender = async (userEmail, token) => { 
    try {

        // console.log("Starting email server for:", token);

        if (!userEmail || !userEmail.trim()) {
            throw new Error("Recipient email is missing or invalid.");
        }

        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
                user: process.env.NODEMAILER_USER, // Your Gmail account
                pass: process.env.NODEMAILER_PASS  // App password or your Gmail password
            }
        });

        // Generate the reset link
        const resetLink = `http://localhost:8888/reset-password?token=${token}`;
        
        // Email content
        const mailOptions = {
            from: 'kunalrisaanva12@gmail.com', // Sender address // process.env.from 
            to: userEmail, 
            subject: 'Reset Password Email', 
            text: `Click the link to reset your password: ${resetLink}. This link will expire in 5 minutes.` 
        };

        // Sending email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);

    } catch (error) {
        console.error('Error occurred:', error.message);
        throw new Error("Something went wrong while sending the email.");
    }
};
