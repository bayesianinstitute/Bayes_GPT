import nodemailer from 'nodemailer'
import dotnet from 'dotenv'

dotnet.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_SECRET
    },
    host: process.env.SITE_URL,
    port: process.env.PORT
    
})

export default ({ to, subject, html }) => {
    var options = {
        from: `BayesChat <${process.env.MAIL_EMAIL}>`,
        to,
        subject:"BayesChat :- Verify your email",
        html
    }

    transporter.sendMail(options, function (err, done) {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ', done?.response);
        }
    });
}