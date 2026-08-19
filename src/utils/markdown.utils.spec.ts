import {escapeMarkdown, inlineCode} from './markdown.utils';

describe('markdown.utils', () => {
  const markupPayload = '<button style=zoom:99>';

  describe('escapeMarkdown', () => {
    it('should leave a plain text untouched', () => {
      expect(escapeMarkdown('PUPT')).toEqual('PUPT');
      expect(escapeMarkdown('Payment 123 for order 456')).toEqual('Payment 123 for order 456');
    });

    it('should escape markup', () => {
      expect(escapeMarkdown(markupPayload)).toEqual('\\<button style\\=zoom:99\\>');
    });

    it('should leave no unescaped angle bracket', () => {
      const result = escapeMarkdown('<img src=x onerror=alert(1)>');

      expect(result).not.toMatch(/(^|[^\\])[<>]/);
    });

    it('should escape emphasis, headings and lists', () => {
      expect(escapeMarkdown('# Title')).toEqual('\\# Title');
      expect(escapeMarkdown('**Fee:** 0')).toEqual('\\*\\*Fee:\\*\\* 0');
      expect(escapeMarkdown('_emphasis_')).toEqual('\\_emphasis\\_');
      expect(escapeMarkdown('- item')).toEqual('\\- item');
      expect(escapeMarkdown('===')).toEqual('\\=\\=\\=');
    });

    it('should escape links and images', () => {
      expect(escapeMarkdown('[click](https://evil.com)')).toEqual(
        '\\[click\\]\\(https://evil\\.com\\)'
      );
      expect(escapeMarkdown('![](https://evil.com/x.png)')).toEqual(
        '\\!\\[\\]\\(https://evil\\.com/x\\.png\\)'
      );
    });

    it('should escape code spans', () => {
      expect(escapeMarkdown('`code`')).toEqual('\\`code\\`');
    });

    it('should escape the escaping character itself', () => {
      expect(escapeMarkdown('\\<button\\>')).toEqual('\\\\\\<button\\\\\\>');
    });

    it('should replace line breaks that would impersonate another section', () => {
      expect(escapeMarkdown('ok\n\n**Fee:**\n0.1 TKN')).toEqual('ok  \\*\\*Fee:\\*\\* 0\\.1 TKN');
      expect(escapeMarkdown('ok\r\nnext')).toEqual('ok  next');
    });

    it('should replace bidirectional and invisible formatting characters', () => {
      expect(escapeMarkdown('a\u202eb')).toEqual('a b');
      expect(escapeMarkdown('a\u200bb')).toEqual('a b');
      expect(escapeMarkdown('a\ufeffb')).toEqual('a b');
    });

    it('should handle an empty text', () => {
      expect(escapeMarkdown('')).toEqual('');
    });
  });

  describe('inlineCode', () => {
    it('should render a plain text as code', () => {
      expect(inlineCode('PUPT')).toEqual('`PUPT`');
    });

    it('should render markup as code', () => {
      expect(inlineCode(markupPayload)).toEqual('`<button style=zoom:99>`');
    });

    it('should not let the text close the code span', () => {
      expect(inlineCode('a`b')).toEqual('``a`b``');
      expect(inlineCode('a``b`c')).toEqual('```a``b`c```');
    });

    it('should pad a text that starts or ends with a backtick', () => {
      expect(inlineCode('`')).toEqual('`` ` ``');
      expect(inlineCode('`code`')).toEqual('`` `code` ``');
    });

    it('should pad a text that starts and ends with a space', () => {
      expect(inlineCode(' a ')).toEqual('`  a  `');
    });

    it('should replace line breaks that would end the code span', () => {
      expect(inlineCode('ok\n\n**Fee:**\n0.1 TKN')).toEqual('`ok  **Fee:** 0.1 TKN`');
    });

    it('should replace bidirectional and invisible formatting characters', () => {
      expect(inlineCode('a\u202eb')).toEqual('`a b`');
      expect(inlineCode('a\u200bb')).toEqual('`a b`');
    });

    it('should return an empty string for an empty text', () => {
      expect(inlineCode('')).toEqual('');
    });
  });
});
