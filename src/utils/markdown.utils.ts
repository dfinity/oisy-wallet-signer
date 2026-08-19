// The characters Markdown gives a meaning to - emphasis, headings, links, lists, code, tables - plus the angle
// brackets that would otherwise open HTML markup.
const MARKDOWN_SYNTAX_CHARACTERS = /[\\`*_{}[\]()#+\-.!<>|~&=]/g;

// Control characters - line breaks included - bidirectional overrides and invisible formatting characters.
// They let a text escape the line it is displayed on, be reordered on screen or hide part of itself.
const MARKDOWN_UNSAFE_CHARACTERS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g;

const replaceUnsafeCharacters = (text: string): string =>
  text.replace(MARKDOWN_UNSAFE_CHARACTERS, ' ');

/**
 * Escapes a text that is interpolated in a Markdown consent message.
 *
 * The text stays readable as provided but can no longer introduce Markdown formatting - headings, emphasis, links
 * or lists - nor HTML markup, given that `<` and `>` are escaped as well. Line breaks and invisible formatting
 * characters are replaced by a space so that the text cannot pretend to be another section of the message.
 *
 * @param {string} text - The untrusted text.
 * @returns {string} The escaped text.
 */
export const escapeMarkdown = (text: string): string =>
  replaceUnsafeCharacters(text).replace(
    MARKDOWN_SYNTAX_CHARACTERS,
    (character) => `\\${character}`
  );

/**
 * Renders a text as a Markdown inline code span.
 *
 * Markdown parsers do not interpret the content of a code span, therefore neither formatting nor markup provided
 * by a third party is rendered. The delimiter is longer than the longest run of backticks the text contains, so
 * that the text cannot close the span it is enclosed in. Line breaks and invisible formatting characters are
 * replaced by a space, since those would end the span or alter how it is displayed.
 *
 * @param {string} text - The untrusted text.
 * @returns {string} The text as an inline code span, or an empty string if the text is empty.
 */
export const inlineCode = (text: string): string => {
  const safeText = replaceUnsafeCharacters(text);

  if (safeText.length === 0) {
    return '';
  }

  const longestBacktickRun = Math.max(
    0,
    ...[...safeText.matchAll(/`+/g)].map(([backticks]) => backticks.length)
  );

  const delimiter = '`'.repeat(longestBacktickRun + 1);

  // A code span that starts and ends with a space has one space stripped on each end, and one that starts or ends
  // with a backtick would be parsed with a shifted delimiter. Padding keeps the text displayed as it is.
  const padding =
    safeText.startsWith('`') ||
    safeText.endsWith('`') ||
    (safeText.startsWith(' ') && safeText.endsWith(' '))
      ? ' '
      : '';

  return `${delimiter}${padding}${safeText}${padding}${delimiter}`;
};
