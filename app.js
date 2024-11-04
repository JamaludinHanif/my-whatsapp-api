// Import library yang diperlukan
const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const bodyParser = require("body-parser")
const cors = require("cors");
const { MessageMedia } = require('whatsapp-web.js');


const app = express();
app.use(cors());
app.use(bodyParser.json());

let qrCodeUrl = "";

// Membuat instance dari WhatsApp Client dengan LocalAuth untuk menyimpan sesi
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error("Error generating QR code:", err);
    } else {
      qrCodeUrl = url;
      console.log("QR Code URL generated. Scan the code on your web app.");
    }
  });
});

client.on("ready", () => {
  console.log("WhatsApp client is ready!");
});

// Inisialisasi client WhatsApp
client.initialize();

// Rute utama untuk mengecek apakah server berjalan
app.get("/", (req, res) => {
  res.send("WhatsApp Gateway is running!");
});

// Endpoint untuk mendapatkan QR Code
app.get("/qr-code", (req, res) => {
  if (qrCodeUrl) {
    res.status(200).json({ status: "success", qrCodeUrl });
  } else {
    res.status(500).json({ status: "error", message: "QR Code belum tersedia" });
  }
});

// tess
client.on('message', async (msg) => {
    if (msg.body === '!send-media') {
        const media = await MessageMedia.fromUrl('https://usaha-bersama-admin.hanifdev.my.id/storage/invoices/tes-pdf.pdf');
        await client.sendMessage(msg.from, media);
    } else if (msg.body === 'lopyu') {
        client.sendMessage(msg.from, 'lopyutu');
    }
});


// Rute untuk mengirim pesan teks
app.post("/send-message", (req, res) => {
  const { number, message } = req.body;
  const formattedNumber = `${number}@c.us`; // Format nomor sesuai yang diharapkan oleh WhatsApp
  client
    .sendMessage(formattedNumber, message)
    .then((response) => {
      res.status(200).json({ status: "success", response });
    })
    .catch((error) => {
      console.error("Error:", error); // Log error ke konsol
      res.status(500).json({
        status: "error",
        error: error.message || error,
        number: number,
        formattedNumber: formattedNumber,
        message: message,
      });
    });
});

// app.post("/send-media", async (req, res) => {
//     const { number, message, fileUrl, caption } = req.body;
//     const formattedNumber = `${number}@c.us`;
  
//     console.log("Attempting to send...");
//     console.log("Number:", formattedNumber);
// })

// Rute untuk mengirim pesan teks atau media
app.post("/send", async (req, res) => {
    const { number, message, fileUrl, caption } = req.body;
    const formattedNumber = `${number}@c.us`;
  
    console.log("Attempting to send...");
    console.log("Number:", formattedNumber);

    try {
        if (fileUrl) {
            // Membuat objek MessageMedia dari URL
            const media = await MessageMedia.fromUrl(fileUrl);

            // Mengirim media
            const response = await client.sendMessage(formattedNumber, media, { caption });
            console.log('Media sent successfully:', response);
            res.status(200).json({ status: "success", body: req.body, response });
        } else {
            // Mengirim pesan teks
            const response = await client.sendMessage(formattedNumber, message);
            console.log('Message sent successfully:', response);
            res.status(200).json({ status: "success", body: req.body, response });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: "error", error: error.message || error });
    }
  });



// Menjalankan server pada port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
