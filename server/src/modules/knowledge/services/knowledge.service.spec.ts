import { chunkPlainText } from './knowledge.service';

describe('chunkPlainText', () => {
  it('creates bounded, ordered chunks without losing the tail', () => {
    const content = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');
    const chunks = chunkPlainText(content, 80, 12);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 80)).toBe(true);
    expect(chunks[0].chunk_index).toBe(0);
    expect(chunks.at(-1)?.content).toContain('word79');
  });
});
