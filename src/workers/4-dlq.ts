export async function startDLQWorker(requestId: string) {
  console.error(
    `[DLQ] ALERTA: Pedido ${requestId} precisa de verificação manual`
  );
}
