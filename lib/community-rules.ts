// The community rules ("กติกาของชุมชน"), in one place. The /rules page and the
// rules view inside the signup form both render them through
// component/CommunityRules.tsx. Keep the topics in line with the report
// reasons in component/ReportModal.tsx and the sanctions in lib/sanctions.ts.

import { MAX_SUSPENSION_DAYS, SUSPENSION_PRESET_DAYS } from "./sanctions";

export type CommunityRule = {
  id: string;
  emoji: string;
  title: string;
  body: string;
};

export const COMMUNITY_RULES_INTRO =
  "AntiLonely เป็นที่ที่เราคุยกันได้โดยไม่ต้องบอกว่าเป็นใคร ความไม่ระบุตัวตนจะปลอดภัยได้ก็ต่อเมื่อทุกคนช่วยกันดูแล กติกามีไม่กี่ข้อ อ่านแป๊บเดียวจบ";

export const COMMUNITY_RULES: CommunityRule[] = [
  {
    id: "kind",
    emoji: "💛",
    title: "ใจดีต่อกัน",
    body: "คนอีกฝั่งของจอก็เป็นนักศึกษาเหมือนเรา ไม่เห็นด้วยกันได้ แต่คุยกันด้วยความเคารพ วิจารณ์ที่ความคิด ไม่ใช่ที่ตัวคน",
  },
  {
    id: "harassment",
    emoji: "🙅",
    title: "ไม่กลั่นแกล้ง ไม่คุกคาม ไม่สร้างความเกลียดชัง",
    body: "ห้ามด่าทอ ล้อเลียน ข่มขู่ หรือตามรังควานใคร และห้ามดูถูกใครเพราะเพศ เพศวิถี เชื้อชาติ ศาสนา ความพิการ หรือที่มาของเขา",
  },
  {
    id: "doxxing",
    emoji: "🕶️",
    title: "ไม่เปิดเผยว่าใครเป็นใคร",
    body: "ห้ามโพสต์ชื่อจริง รูป เบอร์โทร ไอดีโซเชียล รหัสนักศึกษา หรืออะไรก็ตามที่ทำให้รู้ว่าใครเป็นใคร และห้ามพยายามสืบว่าใครอยู่เบื้องหลังชื่อเล่น ข้อมูลของตัวเองก็ระวังไว้ด้วยนะ",
  },
  {
    id: "spam",
    emoji: "📢",
    title: "ไม่สแปม ไม่หลอกลวง",
    body: "ห้ามโฆษณา ขายของ ชวนลงทุน ส่งลิงก์แปลก ๆ หรือโพสต์ข้อความเดิมซ้ำ ๆ ถ้ามีใครมาขอเงิน ขอรหัสผ่าน หรือขอข้อมูลส่วนตัว รีพอร์ตได้ทันที",
  },
  {
    id: "sexual-violent",
    emoji: "🔞",
    title: "ไม่มีเนื้อหาทางเพศหรือความรุนแรง",
    body: "ห้ามโพสต์ภาพหรือข้อความทางเพศ ภาพที่โหดร้าย หรือชักชวนให้ไปทำร้ายใคร",
  },
  {
    id: "self-harm",
    emoji: "🫂",
    title: "ถ้ามีใครอาจกำลังคิดทำร้ายตัวเอง",
    body: "ตอบเขาอย่างอ่อนโยน อย่าตัดสิน แล้วกดรีพอร์ตโดยเลือก “มีคนอาจกำลังคิดทำร้ายตัวเอง” ทีมดูแลจะรีบเข้าไปดู ถ้าเร่งด่วน โทรสายด่วนสุขภาพจิต 1323 ได้ตลอด 24 ชั่วโมง หรือ 1669 ในกรณีฉุกเฉิน ถ้าคนนั้นคือตัวเราเอง ก็โทรได้เหมือนกันนะ คุณไม่ได้อยู่คนเดียว",
  },
];

const presetDays = SUSPENSION_PRESET_DAYS.join(" / ");

// What happens when a rule is broken, in order. Matches the sanctions the
// admin panel can issue (lib/sanctions.ts).
export const ENFORCEMENT_STEPS: { title: string; body: string }[] = [
  {
    title: "รีพอร์ต",
    body: "เจออะไรไม่โอเค กดรีพอร์ตที่โพสต์หรือความคิดเห็นนั้นได้เลย คนที่ถูกรีพอร์ตจะไม่รู้ว่าใครเป็นคนรีพอร์ต ทีมดูแลจะอ่านทุกเรื่อง และอาจซ่อนหรือลบสิ่งที่ผิดกติกา",
  },
  {
    title: "ระงับบัญชีชั่วคราว",
    body: `ถ้าทำผิดกติกา บัญชีอาจถูกระงับ ${presetDays} วัน หรือนานกว่านั้นได้สูงสุด ${MAX_SUSPENSION_DAYS} วัน ระหว่างนั้นจะเข้าสู่ระบบไม่ได้`,
  },
  {
    title: "แบนถาวร",
    body: "ถ้าทำผิดซ้ำ หรือเป็นเรื่องร้ายแรง เช่น เปิดเผยตัวตนคนอื่น ข่มขู่ หรือหลอกลวง บัญชีอาจถูกแบนถาวรได้ทันทีโดยไม่ต้องผ่านขั้นก่อนหน้า",
  },
];
