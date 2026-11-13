export interface EmojiItem {
  emoji: string;
  labelTh: string;
  hex: string;
}

export const QUICK_REACTIONS = [
  '😭',
  '🥹',
  '😢',
  '😣',
  '😂',
  '👍',
] as const;

export const EMOJI_CATALOG: Record<string, EmojiItem> = {
  '😭': { emoji: '😭', labelTh: 'ร้องไห้หนักมาก', hex: '1f62d' },
  '🥹': { emoji: '🥹', labelTh: 'ซาบซึ้ง', hex: '1f979' },
  '😢': { emoji: '😢', labelTh: 'เศร้า', hex: '1f622' },
  '😣': { emoji: '😣', labelTh: 'ปวดใจ', hex: '1f623' },
  '😂': { emoji: '😂', labelTh: 'หัวเราะ', hex: '1f602' },
  '👍': { emoji: '👍', labelTh: 'ถูกใจ', hex: '1f44d' },
  '❤️': { emoji: '❤️', labelTh: 'หัวใจ', hex: '2764' },
  '🤩': { emoji: '🤩', labelTh: 'ตาวาว', hex: '1f929' },
  '🔥': { emoji: '🔥', labelTh: 'ไฟลุก', hex: '1f525' },
  '😮': { emoji: '😮', labelTh: 'ประหลาดใจ', hex: '1f62e' },
  '🎉': { emoji: '🎉', labelTh: 'ยินดี', hex: '1f389' },
  '🫂': { emoji: '🫂', labelTh: 'กอด', hex: '1fac2' },
};

export function getEmojiItem(emoji: string): EmojiItem | undefined {
  return EMOJI_CATALOG[emoji];
}

export function getEmojiLabel(emoji: string): string {
  return EMOJI_CATALOG[emoji]?.labelTh ?? `รีแอคชัน ${emoji}`;
}

