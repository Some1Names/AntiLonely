import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-[#18181b]">
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">AntiLonely</h1>
          <p className="text-[#71717a] mt-1">Home page</p>
        </div>

        <div>
          <Link
            href="/boards/music/posts/post-1"
            className="inline-flex items-center gap-2 rounded-lg bg-[#18181b] px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <span>ดูตัวอย่างหน้า 03 Post Thread</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
