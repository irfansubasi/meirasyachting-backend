import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Yacht from './models/yacht.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Brokerage from './models/brokerageYacht.js';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB bağlantısı başarılı!'))
  .catch((err) => console.log('MongoDB bağlantısı başarısız:', err));

app.get('/', (req, res) => {
  res.send('API çalışıyor!');
});

app.get('/yachts', async (req, res) => {
  try {
    const yatlar = await Yacht.find();
    const allYachts = yatlar.map((yacht) => ({
      _id: yacht._id,
      name: yacht.name,
      type: yacht.type,
      length: yacht.length,
      people: yacht.people,
      cabin: yacht.cabin,
      location: yacht.location,
      features: yacht.features,
      images: yacht.images,
    }));
    res.status(200).json(allYachts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Yat verilerini alma işlemi başarısız oldu.' });
  }
});

app.post('/yachts', async (req, res) => {
  const newYacht = new Yacht(req.body);

  try {
    const savedYacht = await newYacht.save();
    res.status(201).json(savedYacht);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Yat kaydetme işlemi başarısız oldu.' });
  }
});

app.get('/yachts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const yat = await Yacht.findById(id);
    if (!yat) {
      return res.status(404).json({ error: 'Yat bulunamadı.' });
    }
    res.status(200).json(yat);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Yat bilgilerini alma işlemi başarısız oldu.' });
  }
});

app.put('/yachts/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedYat = await Yacht.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedYat) {
      return res.status(404).json({ error: 'Yat bulunamadı.' });
    }
    res.status(200).json(updatedYat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Yat güncelleme işlemi başarısız oldu.' });
  }
});

app.post('/brokerage', async (req, res) => {
  const newYacht = new Brokerage(req.body);

  try {
    const savedYacht = await newYacht.save();
    res.status(201).json(savedYacht);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Yat kaydetme işlemi başarısız oldu.' });
  }
});

app.get('/brokerage', async (req, res) => {
  try {
    const yatlar = await Brokerage.find();
    const allYachts = yatlar.map((yacht) => ({
      _id: yacht._id,
      name: yacht.name,
      type: yacht.type,
      length: yacht.length,
      people: yacht.people,
      location: yacht.location,
      features: yacht.features,
      images: yacht.images,
    }));
    res.status(200).json(allYachts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Yat verilerini alma işlemi başarısız oldu.' });
  }
});

app.get('/brokerage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const yat = await Brokerage.findById(id);
    if (!yat) {
      return res.status(404).json({ error: 'Yat bulunamadı.' });
    }
    res.status(200).json(yat);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Yat bilgilerini alma işlemi başarısız oldu.' });
  }
});

app.put('/yachts/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedYat = await Brokerage.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedYat) {
      return res.status(404).json({ error: 'Yat bulunamadı.' });
    }
    res.status(200).json(updatedYat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Yat güncelleme işlemi başarısız oldu.' });
  }
});

app.get('/get-recaptcha-site-key', (req, res) => {
  res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
});

app.post('/verify-recaptcha', (req, res) => {
  const { recaptchaToken } = req.body;

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  axios
    .post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken,
      },
    })
    .then((response) => {
      if (response.data.success && response.data.score > 0.5) {
        res.status(200).json({ message: 'reCAPTCHA doğrulaması başarılı' });
      } else {
        res.status(400).json({ error: 'reCAPTCHA doğrulaması başarısız' });
      }
    })
    .catch((error) => {
      console.error('Error during reCAPTCHA verification:', error);
      res.status(500).json({ error: 'Sunucu hatası' });
    });
});

const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 2, // max 2 istek
  message: {
    errorKey: 'rateLimitExceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/send-email', emailLimiter, (req, res) => {
  const { user_name, user_email, user_phone, user_location, user_message } =
    req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `meirasyachting.com ${user_name} Kişisinden Yeni Mesaj!`,
    html: `
      <p><strong>İsim:</strong> ${user_name}</p>
        <p><strong>E-mail:</strong> ${user_email}</p>
        <p><strong>Telefon:</strong> ${user_phone}</p>
        <p><strong>Şehir:</strong> ${user_location}</p>
        <p><strong>Mesaj:</strong><br>${user_message}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send email' });
    } else {
      return res.status(200).json({ message: 'Email sent successfully!' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
