import {i18Schema} from '../types/i18n';
import en from './en.json';

describe('English translations', () => {
  it('should validate all keys against schema', () => {
    const result = i18Schema.safeParse(en);
    expect(result.success).toBe(true);
  });
});
