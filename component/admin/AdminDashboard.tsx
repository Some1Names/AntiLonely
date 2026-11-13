type DashboardStats = {
  totalUsers: number;
  activeRooms: number;
  postsToday: number;
  pendingReports: number;
};

type DashboardActivity = {
  id: string;
  type: "room" | "report";
  text: string;
  createdAt: Date;
  timeAgo: string;
};

type AdminDashboardProps = {
  stats: DashboardStats;
  chartLabels: string[];
  usersSeries: number[];
  postsSeries: number[];
  activities: DashboardActivity[];
};

const numberFormat = new Intl.NumberFormat("en-US");

function formatNumber(value: number) {
  return numberFormat.format(value);
}

// กราฟเส้น
function UserChart({
  labels,
  data,
}: {
  labels: string[];
  data: number[];
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = 10 + (index * 380) / 6;
      const y = 78 - ((value - min) / range) * 58;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-5">
      <svg
        viewBox="0 0 400 100"
        className="h-[100px] w-full overflow-visible"
        role="img"
        aria-label="กราฟจำนวนผู้ใช้ใหม่ในช่วง 7 วันที่ผ่านมา"
      >
        <line
          x1="10"
          y1="48"
          x2="390"
          y2="48"
          stroke="var(--color-edge-strong)"
          strokeWidth="1"
        />

        {data.some((value) => value > 0) && (
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      {!data.some((value) => value > 0) && (
        <p className="mt-2 text-center text-xs text-ink-soft/70">
          ยังไม่มีข้อมูลผู้สมัครในช่วง 7 วันที่ผ่านมา
        </p>
      )}
    </div>
  );
}

// กราฟแท่ง
function PostsChart({
  labels,
  data,
}: {
  labels: string[];
  data: number[];
}) {
  const max = Math.max(...data, 1);

  return (
    <div className="mt-5">
      <div className="flex h-[100px] items-end justify-between gap-3">
        {data.map((value, index) => {
          const height = (value / max) * 48 + (value > 0 ? 1 : 0);

          return (
            <div
              key={`${labels[index]}-${index}`}
              className="flex h-full flex-1 items-end justify-center"
              title={`${labels[index]}: ${value} โพสต์`}
            >
              <div
                className="w-full max-w-[20px] rounded-t-[4px] bg-ink"
                style={{ height: `${height}px` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between text-[11px] text-ink-soft">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      {!data.some((value) => value > 0) && (
        <p className="mt-2 text-center text-xs text-ink-soft/70">
          ยังไม่มีโพสต์ในช่วง 7 วันที่ผ่านมา
        </p>
      )}
    </div>
  );
}

// ไอคอนกิจกรรม
function ActivityIcon({ type }: { type: "room" | "report" }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-butter text-ink-soft">
      {type === "room" ? (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16v12H8l-4 3V5z" />
        </svg>
      ) : (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 2.8 19h18.4L12 3z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      )}
    </div>
  );
}

export default function AdminDashboard({
  stats,
  chartLabels,
  usersSeries,
  postsSeries,
  activities,
}: AdminDashboardProps) {
  const cards = [
    {
      title: "จำนวนผู้ใช้ทั้งหมด",
      value: stats.totalUsers,
      description: `${formatNumber(usersSeries.reduce((sum, value) => sum + value, 0))} คนสมัครใน 7 วันที่ผ่านมา`,
      danger: false,
    },
    {
      title: "จำนวนห้องที่กำลังใช้งาน",
      value: stats.activeRooms,
      description: "ห้องที่มีสถานะกำลังใช้งาน",
      danger: false,
    },
    {
      title: "จำนวนโพสต์วันนี้",
      value: stats.postsToday,
      description: "นับเฉพาะโพสต์หลัก ไม่รวมข้อความตอบกลับ",
      danger: false,
    },
    {
      title: "รายงานที่รอการดำเนินการ",
      value: stats.pendingReports,
      description: "จำนวนรายงานที่ยังไม่ได้ดำเนินการ",
      danger: true,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold sm:text-[28px] leading-tight text-ink">
          แดชบอร์ด
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          ข้อมูลภาพรวมของกิจกรรมต่างๆบน AntiLonely
        </p>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="min-w-0 rounded-[10px] border border-edge-strong bg-white px-5 py-5"
          >
            <p className="text-xs font-semibold text-ink-soft">
              {card.title}
            </p>

            <p
              className={`mt-3 text-[30px] font-bold leading-none ${
                card.danger ? "text-red-700" : "text-ink"
              }`}
            >
              {formatNumber(card.value)}
            </p>

            <p
              className={`mt-3 text-xs ${
                card.danger ? "text-red-700" : "text-ink-soft"
              }`}
            >
              {card.description}
            </p>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-[12px] border border-edge-strong bg-white px-6 py-6">
          <h2 className="text-base font-bold text-ink">
            การเติบโตของผู้ใช้
          </h2>
          <p className="text-xs text-ink-soft">
            ผู้ใช้ที่ลงทะเบียนในช่วง 7 วันที่ผ่านมา
          </p>

          <UserChart labels={chartLabels} data={usersSeries} />
        </div>

        <div className="min-w-0 rounded-[12px] border border-edge-strong bg-white px-6 py-6">
          <h2 className="text-base font-bold text-ink">
            โพสต์ต่อวัน
          </h2>
          <p className="text-xs text-ink-soft">
            จำนวนโพสต์ทั้งหมดต่อวัน
          </p>

          <PostsChart labels={chartLabels} data={postsSeries} />
        </div>
      </section>

      {/* Recent Activities */}
      <section className="mt-6 rounded-[12px] border border-edge-strong bg-white px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-ink">
          กิจกรรมล่าสุด
        </h2>

        {activities.length > 0 ? (
          <div>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex min-w-0 items-center gap-3 py-3 ${
                  index !== activities.length - 1
                    ? "border-b border-edge-strong"
                    : ""
                }`}
              >
                <ActivityIcon type={activity.type} />

                <p className="min-w-0 flex-1 truncate text-sm text-ink">
                  {activity.text}
                </p>

                <span className="shrink-0 text-xs text-ink-soft">
                  {activity.timeAgo}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[120px] items-center justify-center text-sm text-ink-soft/70">
            ยังไม่มีกิจกรรมล่าสุด
          </div>
        )}
      </section>
    </div>
  );
}