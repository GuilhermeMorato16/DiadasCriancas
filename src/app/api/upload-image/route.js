// Local: src/app/api/upload-image/route.js

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Writable } from 'stream';

// Configura o Cloudinary com as variáveis de ambiente
// (A Vercel vai pegar essas variáveis das configurações do seu projeto)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Função auxiliar para fazer upload do buffer para o Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
    const writable = new Writable({
      write: (chunk, encoding, callback) => {
        stream.write(chunk, encoding);
        callback();
      }
    });
    writable.end(buffer);
  });
};

export async function POST(request) {
  try {
    // 1. Parse o FormData da requisição
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 2. Converta o arquivo para um buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 3. Faça o upload do buffer para o Cloudinary
    const uploadResult = await uploadToCloudinary(fileBuffer, {
      folder: 'cadastros',
      public_id: new Date().getTime() + '-' + file.name,
    });
    
    // 4. Retorne a URL segura
    return NextResponse.json({
      message: 'Upload realizado com sucesso!',
      imageUrl: uploadResult.secure_url,
    });

  } catch (error) {
    console.error('Erro no upload para o Cloudinary:', error);
    return NextResponse.json({ message: 'Falha no upload da imagem.' }, { status: 500 });
  }
}