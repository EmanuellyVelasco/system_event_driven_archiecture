import nodemailer from 'nodemailer';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startEmailWorker(requestId: string) {
  console.log(`[Email] Enviando email para ID: ${requestId}`);

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) return;

  // Config do Ethereal
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const pdfPath = path.join(__dirname, `../../storage/${requestId}/report.pdf`);

  const info = await transporter.sendMail({
    from: '"Relatorio Bot" <bot@example.com>',
    to: request.email,
    subject: `Seu relatório está pronto: ${requestId}`,
    text: 'Segue em anexo o relatório solicitado.',
    attachments: [{ filename: 'relatorio_diario.pdf', path: pdfPath }]
  });

  console.log(`[Email] Enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  
  await prisma.request.update({ where: { id: requestId }, data: { status: 'done' } });
}