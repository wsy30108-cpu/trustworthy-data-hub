// Simple markdown to HTML renderer
export const renderMarkdown = (md: string): string => {
    if (!md) return "";

    let html = md;

    // 1. Code blocks (Priority: Handle blocks before inline backticks)
    html = html.replace(/```([\s\S]+?)```/g, '<pre class="p-4 bg-slate-50 border border-slate-200 rounded-2xl my-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-700"><code>$1</code></pre>');

    // 2. Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-8 mb-3 text-slate-800">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-10 mb-4 pb-2 border-b border-slate-100 text-slate-900">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black mt-12 mb-6 text-slate-900">$1</h1>');

    // 3. Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

    // 4. Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 text-primary-600 rounded-md text-[11px] font-mono">$1</code>');

    // 5. Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed text-slate-600 mb-1">$1</li>');

    // 6. Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed text-slate-600 mb-1">$1</li>');

    // 7. Tables - Robust Parsing
    // First, convert markdown rows to temporary HTML <tr>
    html = html.replace(/\|(.+)\|/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        if (cells.every(c => c.match(/^[-:]+$/))) return "<!-- T-DIVIDER -->";
        return `<tr>${cells.map(c => `<td class="py-2 px-4 border border-slate-100">${c}</td>`).join('')}</tr>`;
    });

    // Remove divider placeholder
    html = html.replace(/<!-- T-DIVIDER -->/g, "");

    // Join consecutive <tr> tags by removing whitespace/newlines between them
    // Use \s+ to ensure we only target actual whitespace and avoid infinite matches
    html = html.replace(/<\/tr>\s+(?=<tr>)/g, "</tr>");

    // Wrap consecutive table rows in a single table element
    html = html.replace(/(<tr>[\s\S]+?<\/tr>)+/g, (match) => {
        return `<div class="my-6 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white"><table class="w-full border-collapse text-xs"><tbody>${match}</tbody></table></div>`;
    });

    // 8. Paragraphs - wrap non-tag lines
    html = html.replace(/^(?!<[hlu]|<li|<ol|<code|<strong|<p|<table|<tr|<td|<pre|<div|<!--)(.+)$/gm, '<p class="text-sm leading-relaxed text-slate-500 mb-4">$1</p>');

    // 9. Clean up empty lines
    html = html.replace(/^\s*$/gm, "");

    return html;
};
