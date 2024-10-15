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

app.post('/yachts', async (req, res) => {
  const { name, type, length, people, cabin, location, features } = req.body;

  const yeniYat = new Yacht({
    name,
    type,
    length,
    people,
    cabin,
    location,
    features,
  });

  try {
    const yatVerisi = new Yacht(req.body);
    await yatVerisi.save();
    res
      .status(201)
      .json({ message: 'Yat başarıyla kaydedildi!', yat: yatVerisi });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Yat kaydetme işlemi başarısız oldu.',
      details: error.message,
    });
  }
});

app.get('/yachts', async (req, res) => {
  try {
    const yatlar = await Yacht.find();
    res.status(200).json(yatlar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Yatları alma işlemi başarısız oldu.' });
  }
});

app.put('/yachts/:id', async (req, res) => {
  const { id } = req.params; // URL'den gelen ID
  const updatedData = req.body; // Güncellenmiş veri

  try {
    const updatedYat = await Yacht.findByIdAndUpdate(id, updatedData, {
      new: true,
    }); // Veriyi güncelle
    if (!updatedYat) {
      return res.status(404).json({ error: 'Yat bulunamadı.' }); // Yat bulunamazsa hata döndür
    }
    res.status(200).json(updatedYat); // Güncellenmiş yatı döndür
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

app.get('/api/yacht-images/:id', (req, res) => {
  const yachtId = req.params.id;
  const imageDirectory = path.join(
    __dirname,
    '..',
    'public',
    'assets',
    'yachtspics',
    yachtId
  );

  fs.readdir(imageDirectory, (err, files) => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Directory not found or an error occurred.' });
    }

    // Resim dosyalarının tam yolunu oluştur
    const images = files.map((file) => `/assets/yachtspics/${yachtId}/${file}`);
    res.json({ images });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
