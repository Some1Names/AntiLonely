import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/component/admin/AdminDashboard";

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET = 7 * 60 * 60 * 1000;

// หาวันที่ปัจจุบันตามเวลาไทย
function getBangkokTodayStart() {
  const now = new Date();
  const bangkokDate = new Date(now.getTime() + BANGKOK_OFFSET);

  return new Date(
    Date.UTC(
      bangkokDate.getUTCFullYear(),
      bangkokDate.getUTCMonth(),
      bangkokDate.getUTCDate(),
    ) - BANGKOK_OFFSET,
  );
}

// แปลงวันที่เป็นข้อความ เช่น จ. อ. พ.
function getDayLabel(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

// คำนวณว่าข้อมูลอยู่ในวันลำดับที่เท่าไรของกราฟ
function getDayIndex(date: Date, startDate: Date) {
  return Math.floor((date.getTime() - startDate.getTime()) / DAY_MS);
}

// นับจำนวนข้อมูลแยกตามวัน
function countByDay(dates: Date[], startDate: Date) {
  const result = Array(7).fill(0);

  for (const date of dates) {
    const index = getDayIndex(date, startDate);

    if (index >= 0 && index < 7) {
      result[index]++;
    }
  }

  return result;
}

// แสดงเวลาที่ผ่านมา เช่น 2 นาทีที่แล้ว
function getTimeAgo(date: Date) {
  const diff = Math.max(0, Date.now() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 30) return `${days} วันที่แล้ว`;

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-ink-soft">
          กำลังโหลดข้อมูล Dashboard...
        </div>
      }
    >
      <AdminDashboardData />
    </Suspense>
  );
}

async function AdminDashboardData() {
  await connection();

  const todayStart = getBangkokTodayStart();

  // กราฟแสดงข้อมูลย้อนหลัง 7 วัน รวมวันนี้
  const chartStart = new Date(todayStart.getTime() - 6 * DAY_MS);

  // ดึงข้อมูลจริงจาก Database
  const [
    totalUsers,
    activeRooms,
    postsToday,
    pendingReports,
    usersThisWeek,
    postsThisWeek,
    recentRooms,
    recentReports,
  ] = await Promise.all([
    // จำนวนผู้ใช้ทั้งหมด
    prisma.user.count(),

    // จำนวนห้องที่กำลังใช้งาน
    prisma.room.count({
      where: { status: "active" },
    }),

    // จำนวนโพสต์วันนี้ (นับเฉพาะโพสต์หลัก ไม่รวมข้อความตอบกลับ)
    prisma.message.count({
      where: {
        createdAt: { gte: todayStart },
        parentId: null,
      },
    }),

    // จำนวนรายงานที่รอดำเนินการ
    prisma.report.count({
      where: { status: "pending" },
    }),

    // วันที่สมัครของผู้ใช้ในช่วง 7 วัน
    prisma.user.findMany({
      where: {
        createdAt: { gte: chartStart },
      },
      select: { createdAt: true },
    }),

    // วันที่สร้างโพสต์ในช่วง 7 วัน
    prisma.message.findMany({
      where: {
        createdAt: { gte: chartStart },
        parentId: null,
      },
      select: { createdAt: true },
    }),

    // ห้องที่สร้างล่าสุด
    prisma.room.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    }),

    // รายงานที่สร้างล่าสุด
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        message: {
          select: {
            content: true,
            room: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  // สร้างวันที่ 7 วันสำหรับแสดงใต้กราฟ
  const chartLabels = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(chartStart.getTime() + index * DAY_MS);
    return getDayLabel(date);
  });

  // เตรียมข้อมูลกราฟจากวันที่จริงใน Database
  const usersSeries = countByDay(
    usersThisWeek.map((user) => user.createdAt),
    chartStart,
  );

  const postsSeries = countByDay(
    postsThisWeek.map((post) => post.createdAt),
    chartStart,
  );

  // สร้างรายการกิจกรรมจากข้อมูลที่มีอยู่จริง
  const activities = [
    ...recentRooms.map((room) => ({
      id: `room-${room.id}`,
      type: "room" as const,
      text: `สร้างห้องใหม่ "${room.name}"`,
      createdAt: room.createdAt,
    })),

    ...recentReports.map((report) => ({
      id: `report-${report.id}`,
      type: "report" as const,
      text: `มีรายงานข้อความใน ${report.message.room.name} ("${report.message.content.slice(0, 50)}")`,
      createdAt: report.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((activity) => ({
      ...activity,
      timeAgo: getTimeAgo(activity.createdAt),
    }));

  return (
    <AdminDashboard
      stats={{
        totalUsers,
        activeRooms,
        postsToday,
        pendingReports,
      }}
      chartLabels={chartLabels}
      usersSeries={usersSeries}
      postsSeries={postsSeries}
      activities={activities}
    />
  );
}