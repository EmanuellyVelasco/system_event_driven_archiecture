import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { publisher } from '../config/redis';

const prisma = new PrismaClient();

export async function startPdfWorker(requestId: string) {
  console.log(`[PDF] Gerando PDF para ID: ${requestId}`);
  
  const dir = path.join(__dirname, `../../storage/${requestId}`);
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(path.join(dir, 'report.pdf'));

  doc.pipe(writeStream);

  // Lê texto
  const text = fs.readFileSync(path.join(dir, 'content.txt'), 'utf-8');
  doc.fontSize(14).text(`Relatório para Pedido: ${requestId}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(text);
  doc.moveDown();

  // Insere imagens
  for (let i = 0; i < 10; i++) {
    const imgPath = path.join(dir, `image_${i}.jpg`);
    if (fs.existsSync(imgPath)) {
      doc.image(imgPath, { width: 150 });
      doc.moveDown(0.5);
    }
  }

  doc.end();

  // Espera terminar de escrever o arquivo
  writeStream.on('finish', async () => {
    console.log(`[PDF] Criado. Publicando para sending.`);
    await prisma.request.update({ where: { id: requestId }, data: { status: 'sending' } });
    await publisher.publish('process:sending', requestId);
  });
}