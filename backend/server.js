import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Yacht from './models/yacht.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.get('/yachts', (req, res) => {
  res.status(200).json({ message: 'Bu endpoint veri döndürmüyor.' });
});

// Türkçe yat verileri
app.get('/yachts/TR', async (req, res) => {
  try {
    const yatlar = await Yacht.find();
    const turkceYatlar = yatlar.map((yacht) => ({
      name: yacht.name.tr,
      type: yacht.type.tr,
      description: yacht.description?.tr,
      length: yacht.length,
      people: yacht.people,
      cabin: yacht.cabin,
      location: yacht.location?.tr,
      features: yacht.features?.tr,
      images: yacht.images,
    }));
    res.status(200).json(turkceYatlar);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Türkçe yat verilerini alma işlemi başarısız oldu.' });
  }
});

app.get('/yachts/EN', async (req, res) => {
  try {
    const yatlar = await Yacht.find();
    const ingilizceYatlar = yatlar.map((yacht) => ({
      name: yacht.name.en,
      type: yacht.type.en,
      description: yacht.description?.en,
      length: yacht.length,
      people: yacht.people,
      cabin: yacht.cabin,
      location: yacht.location?.en,
      features: yacht.features?.en,
      images: yacht.images,
    }));
    res.status(200).json(ingilizceYatlar);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'İngilizce yat verilerini alma işlemi başarısız oldu.' });
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

app.post('/send-email', (req, res) => {
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
