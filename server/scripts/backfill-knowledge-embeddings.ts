import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const batchSize = 32;

async function embed(texts: string[]) {
  const apiKey = process.env.KNOWLEDGE_EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  if (process.env.KNOWLEDGE_EMBEDDING_ENABLED?.toLowerCase() !== 'true' || !apiKey) {
    throw new Error('Set KNOWLEDGE_EMBEDDING_ENABLED=true and an embedding API key first');
  }
  const baseUrl = (
    process.env.KNOWLEDGE_EMBEDDING_BASE_URL
    || process.env.OPENAI_BASE_URL
    || 'https://api.openai.com/v1'
  ).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.KNOWLEDGE_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: texts,
    }),
  });
  if (!response.ok) throw new Error(`Embedding provider returned HTTP ${response.status}`);
  const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
  return (payload.data || []).map((item) => item.embedding || []);
}

async function main() {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { source: { status: 'PUBLISHED', visibility: 'PUBLIC' } },
    select: { id: true, content: true, embedding: true },
    orderBy: { created_at: 'asc' },
  });
  let updated = 0;
  for (let index = 0; index < chunks.length; index += batchSize) {
    const batch = chunks.slice(index, index + batchSize).filter((chunk) => !chunk.embedding.length);
    if (!batch.length) continue;
    const embeddings = await embed(batch.map((chunk) => chunk.content));
    for (let item = 0; item < batch.length; item += 1) {
      if (!embeddings[item]?.length) continue;
      await prisma.knowledgeChunk.update({
        where: { id: batch[item].id },
        data: { embedding: embeddings[item] },
      });
      updated += 1;
    }
    console.log(`knowledge embeddings: ${Math.min(index + batchSize, chunks.length)}/${chunks.length}`);
  }
  console.log(`knowledge embeddings backfill complete: ${updated} chunks updated`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
