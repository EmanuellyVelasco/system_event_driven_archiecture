import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { publisher } from '../config/redis';

const prisma = new PrismaClient();

export async function startFetcherWorker(requestId: string) {
  console.log(`[Fetcher] Iniciando ID: ${requestId}`);
  
  // Atualiza Status
  await prisma.request.update({ where: { id: requestId }, data: { status: 'fetching' } });

  // Cria diretório
  const dir = path.join(__dirname, `../../storage/${requestId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Gera Texto
  const textContent = faker.lorem.paragraphs(3);
  fs.writeFileSync(path.join(dir, 'content.txt'), textContent);

  // 2. Baixa 10 Imagens
  for (let i = 0; i < 10; i++) {
    const response = await axios.get('https://picsum.photos/200', { responseType: 'arraybuffer' });
    fs.writeFileSync(path.join(dir, `image_${i}.jpg`), response.data);
  }

  console.log(`[Fetcher] Finalizado. Publicando para gen_pdf.`);
  
  // Muda status para próximo passo e avisa
  await prisma.request.update({ where: { id: requestId }, data: { status: 'gen_pdf' } });
  await publisher.publish('process:gen_pdf', requestId);
}