// ideas_YYYYMMDD.md パーサー（TypeScript版からの移植）
const GENRE_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥'];

function parseSection(sectionText, index) {
  try {
    const headerMatch = sectionText.match(/^## ([①②③④⑤⑥])\s+(.+)/m);
    if (!headerMatch) return null;

    const genreNumber = headerMatch[1];
    const genreLabel = headerMatch[2].trim();

    const titleMatch = sectionText.match(/^### テーマ[：:]\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const formatMatch = sectionText.match(/\*\*フォーマット[：:]\s*(.+?)\*\*/);
    const formatRaw = formatMatch ? formatMatch[1].trim() : '';
    const format = (formatRaw.includes('Xスレッド') || formatRaw.includes('X スレッド'))
      ? 'x-thread'
      : 'instagram-carousel';

    const sourcesMatch = sectionText.match(/\*\*掛け合わせ元\*\*[：:]\s*\n([\s\S]*?)(?=\n\*\*)/);
    const sources = sourcesMatch
      ? sourcesMatch[1].split('\n').map(l => l.replace(/^[-・]\s*/, '').trim()).filter(Boolean)
      : [];

    const essenceMatch = sectionText.match(/\*\*切り口の核心\*\*[：:]\s*(.+)/);
    const essence = essenceMatch ? essenceMatch[1].trim() : '';

    const formatLineIdx = sectionText.indexOf('**フォーマット：');
    let content = '';
    if (formatLineIdx !== -1) {
      const afterFormat = sectionText.slice(formatLineIdx);
      const contentStart = afterFormat.indexOf('\n') + 1;
      const contentBlock = afterFormat.slice(contentStart);
      const contentEnd = contentBlock.search(/\n\*\*(選定ツール|キャプション|コピペ用指示文)/);
      const raw = contentEnd !== -1 ? contentBlock.slice(0, contentEnd) : contentBlock;
      content = raw.trim().slice(0, 200);
    }

    let caption;
    const captionMatch = sectionText.match(/\*\*キャプション\*\*[：:]\s*\n([\s\S]*?)(?=\n\*\*)/);
    if (captionMatch) caption = captionMatch[1].trim().slice(0, 300);

    const ctaMatch = sectionText.match(/\*\*コピペ用指示文\*\*\n([\s\S]*?)$/);
    const cta = ctaMatch ? ctaMatch[1].trim().slice(0, 300) : '';

    return { index, genreNumber, genreLabel, title, format, sources, essence, content, caption, cta };
  } catch {
    return null;
  }
}

function parseIdeasMarkdown(markdown) {
  const rawDateMatch = markdown.match(/[（(](\d{4}-\d{2}-\d{2})[）)]/);
  const rawDate = rawDateMatch ? rawDateMatch[1] : '';
  const date = rawDate.replace(/-/g, '');

  const sectionRegex = /(?=^## [①②③④⑤⑥])/m;
  const sections = markdown.split(sectionRegex).filter(s => s.trim());

  const ideas = [];
  let ideaIndex = 1;

  for (const section of sections) {
    const firstChar = section.trimStart()[3];
    if (!GENRE_NUMBERS.includes(firstChar)) continue;
    const idea = parseSection(section, ideaIndex);
    if (idea) {
      ideas.push(idea);
      ideaIndex++;
    }
  }

  return { date, rawDate, ideas };
}
