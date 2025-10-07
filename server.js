require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

const app = express();

// Permite que seu frontend (ex: localhost:3000) se comunique com o backend (localhost:8080)
app.use(cors());

// Configura suas credenciais do Cloudinary a partir do arquivo .env
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configura o storage para o multer enviar os arquivos diretamente para o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cadastros', // Nome da pasta que será criada no Cloudinary
    format: async (req, file) => 'jpg', // Define um formato padrão
    public_id: (req, file) => new Date().getTime() + '-' + file.originalname, // Cria um nome de arquivo único
  },
});

// Inicializa o multer com a configuração do Cloudinary
const upload = multer({ storage: storage });

// Define a rota de upload
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  // 'image' deve ser o mesmo nome usado no formData.append('image', ...) do frontend
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  // Se o upload for bem-sucedido, o multer-storage-cloudinary adiciona
  // informações ao objeto 'req.file', incluindo o 'path', que é a URL da imagem.
  res.status(200).json({
    message: 'Upload realizado com sucesso!',
    imageUrl: req.file.path 
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});