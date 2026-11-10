
/* ---------- รายงาน (Report) ---------- */

/** เหตุผลที่ผู้ใช้กดรายงาน */
export type ReportReason = "harassment" | "spam" | "image" | "bully" | "other";

/** pending = รอดำเนินการ, resolved = แก้ไขแล้ว (ลบเนื้อหา), dismissed = ยกเลิกรายงาน */
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Report {
  id: string;
  content: string;      // ข้อความที่ถูกรายงาน (ตัดสั้นไว้แสดงในตาราง)
  room: string;         // ชื่อห้องที่โพสต์
  author: string;       // คนที่โพสต์
  reason: ReportReason;
  count: number;        // มีคนรายงานกี่ครั้ง
  hidden: boolean;      // true = ภาพ/เนื้อหาถูกซ่อนไว้ระหว่างรอตรวจ
  status: ReportStatus;
  createdAt: number;    // เวลาที่ถูกรายงานครั้งแรก (epoch ms) ใช้คำนวณ "3h", "40m"
  handledAt?: number;   // เวลาที่แอดมินจัดการ (มีเมื่อ status ไม่ใช่ pending)
  handledBy?: string;
}

/* ---------- ห้องแชท (Room) ---------- */

export type RoomType = "public" | "private";
export type RoomStatus = "active" | "suspended" | "archived";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  members: number;
  posts: number;
  createdAt: number;
  status: RoomStatus;
  archivedAt?: number;  // มีเมื่อถูกจัดเก็บ ใช้นับ "ห้องถูกจัดเก็บวันนี้"
  postsToday: number;   // สองค่านี้ใช้คำนวณ "ห้องไหนเติบโตพุ่งสุด" บนแดชบอร์ด
  postsPrev: number;
}

/* ---------- กิจกรรมล่าสุด (Activity) ---------- */

export type ActivityType = "room" | "report" | "ban" | "trend" | "system";

export interface Activity {
  id: string;
  type: ActivityType;   // ใช้เลือกไอคอนหน้าแดชบอร์ด
  text: string;
  at: number;
}

/* ---------- สถิติรวม ---------- */

export interface AdminStats {
  totalUsers: number;
  usersThisWeek: number;
  usersLastWeek: number;     // ใช้คำนวณ "+12% จากสัปดาห์ที่แล้ว"
  usersSeries: number[];     // ผู้ลงทะเบียนต่อวัน 7 วัน (ตัวสุดท้าย = วันนี้)
  postsSeries: number[];     // โพสต์ต่อวัน 7 วัน (ตัวสุดท้าย = วันนี้)
}

/** ก้อนข้อมูลทั้งหมดที่ store เก็บไว้ */
export interface AdminState {
  v: 1;                      // เลขเวอร์ชัน เผื่อวันหลังเปลี่ยนโครงสร้างจะได้รู้
  reports: Report[];
  rooms: Room[];
  activities: Activity[];
  banned: string[];          // รายชื่อผู้ใช้ที่ถูกระงับ
  stats: AdminStats;
}

/* ---------- ค่าคงที่ที่ UI ใช้ร่วมกัน ---------- */

export type PillTone = "red" | "yellow" | "green" | "gray" | "neutral";

/** ป้ายชื่อ + สีของแต่ละเหตุผล (ใช้ทั้งชิปกรองและป้ายในตาราง) */
export const REASON_META: Record<
  ReportReason,
  { label: string; tone: PillTone; phrase: string }
> = {
  harassment: { label: "คุกคาม", tone: "red", phrase: "คุกคาม" },
  spam: { label: "สแปม", tone: "yellow", phrase: "สแปม" },
  image: { label: "ภาพไม่เหมาะสม", tone: "red", phrase: "ภาพไม่เหมาะสม" },
  bully: { label: "กลั่นแกล้ง", tone: "red", phrase: "กลั่นแกล้ง" },
  other: { label: "อื่นๆ", tone: "gray", phrase: "ละเมิดกฎ" },
};