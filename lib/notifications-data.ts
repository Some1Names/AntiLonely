import { prisma } from "@/lib/prisma";
import type { NotificationItem } from "@/types/notification";

const TEXT: Record<string, { actionText: string; category: NotificationItem["type"] }> = {
  reply: { actionText: "มีคนตอบกระทู้ของคุณ", category: "reply" },
  mention: { actionText: "มีคนกล่าวถึงคุณ", category: "mention" },
  reaction: { actionText: "มีคนแสดงรีแอคชันกับกระทู้ของคุณ", category: "reaction" },
  report: { actionText: "มีการอัปเดตเกี่ยวกับรายงาน", category: "report" },
};

export async function getNotificationItems(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const items: NotificationItem[] = rows.map((n) => {
    const t = TEXT[String(n.type)] ?? {
      actionText: "มีการแจ้งเตือนใหม่",
      category: "report" as const,
    };
    return {
      id: n.id,
      type: t.category,
      actor: { name: "AntiLonely" },
      actionText: t.actionText,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
      targetUrl: "/notifications",
    };
  });

  return { items, serverTime: new Date().toISOString() };
}