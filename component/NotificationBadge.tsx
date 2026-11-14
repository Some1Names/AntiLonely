// The orange count on the bell: how many notifications are unread.
export default function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-kmutt-orange-dark px-1.5 text-xs leading-5 text-white">
      {count}
    </span>
  );
}
