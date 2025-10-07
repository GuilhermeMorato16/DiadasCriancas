// src/app/api/upload-image/route.js

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Converte o arquivo para base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64Data}`;

    // Faz upload direto para Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'cadastros',
      public_id: `${Date.now()}-${file.name}`,
    });

    return NextResponse.json({
      message: 'Upload realizado com sucesso!',
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Erro no upload para o Cloudinary:', error);
    return NextResponse.json(
      { message: 'Falha no upload da imagem.', error: error.message },
      { status: 500 }
    );
  }
}
