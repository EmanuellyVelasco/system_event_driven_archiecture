import { createClient } from 'redis';

const redisConfig = {
  url: 'redis://52.55.103.172:443' 
};

// Precisamos de clientes separados para publicar e subscrever
export const publisher = createClient(redisConfig);
export const subscriber = createClient(redisConfig);

export async function connectRedis() {
  await publisher.connect();
  await subscriber.connect();
  console.log("Redis connected (Pub/Sub)");
}