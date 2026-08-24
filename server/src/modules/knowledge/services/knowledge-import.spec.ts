import { extractTextFromHtml } from './knowledge.service';

describe('extractTextFromHtml', () => {
  it('keeps visible text and removes active content', () => {
    expect(extractTextFromHtml(
      '<h1>Python</h1><script>alert(1)</script><p>Variables &amp; functions</p>',
    )).toBe('Python Variables & functions');
  });
});
