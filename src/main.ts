import { app } from './api';
import { connectRedis, subscriber } from './config/redis';
import { startFetcherWorker } from './workers/1-fetcher';
import { startPdfWorker } from './workers/2-pdf';
import { startEmailWorker } from './workers/3-email';

async function bootstrap() {
  await connectRedis();

  // --- REGISTRA OS WORKERS (SUBSCRIBERS) ---
  
  // Worker 1: Ouve 'fetching' (disparado pela API)
  await subscriber.subscribe('process:fetching', (requestId) => {
    startFetcherWorker(requestId);
  });

  // Worker 2: Ouve 'gen_pdf' (disparado pelo Worker 1)
  await subscriber.subscribe('process:gen_pdf', (requestId) => {
    startPdfWorker(requestId);
  });

  // Worker 3: Ouve 'sending' (disparado pelo Worker 2)
  await subscriber.subscribe('process:sending', (requestId) => {
    startEmailWorker(requestId);
  });

  console.log("Workers escutando no Redis...");

  // --- INICIA SERVIDOR HTTP ---
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

bootstrap();