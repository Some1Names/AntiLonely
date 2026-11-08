# Board Feed Header, Figma Mock, and Post Thread Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Room Board Feed (`/rooms/[roomId]` and `/boardfeed`) with the shared `Header` component and Figma design, populate it with the Figma mock posts, and link each post card directly to its corresponding Post Thread page (`/rooms/[roomId]/posts/[postId]`).

**Architecture:** Extract a shared room posts dataset in `lib/mock/post-thread.ts` so both `RoomBoardFeed` and `getMockPostThread` read from the same source of truth. Replace the disconnected `BoardHeader` usage with the main `component/Header.tsx`, add the room hero metadata pills and breadcrumb link from the Figma spec, and wire `component/PostCard.tsx` with Next.js `<Link>` navigation to `/rooms/[roomId]/posts/[postId]`.

**Tech Stack:** Next.js 16.4.3 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS v4, Node.js native test runner (`node --test`).

**Spec:** [design.md](../../../design.md) and Figma Board Feed frame (`webpro-DB`, node `0-1`).

## Global Constraints

- Next.js 16 runtime params (`params`) in Server Components must remain wrapped in `<Suspense>` with `await connection()`.
- Use shared `Header` from `component/Header.tsx` across pages so logo (`/`), `+ สร้าง` modal (`CreateButton`), `โนติ` (`/notifications`), and login/avatar links behave consistently.
- Preserve existing unit tests in `lib/**/*.test.ts` and ensure `npx tsc --noEmit` passes with zero errors.
- Do not commit unless explicitly instructed by the user (per global user rule).

## Review Focus

1. **Clicking a specific post on the board feed opens the wrong thread content:** `getMockPostThread(roomId, postId)` must return the author, content, and reactions matching `post-1`, `post-2`, and `post-3` from the board feed rather than hardcoded single-post data.
2. **Zero-reply post thread count mismatch:** Clicking `post-3` ("ยังไม่มีใครตอบ · มาเป็นคนแรกกัน", `replyCount: 0`) must render a thread with `0` comments (`comments: []`), while `post-1` (`replyCount: 4`) renders 4 total comments (top-level + replies).
3. **Unknown `postId` or newly created client post navigation:** Accessing `getMockPostThread(roomId, "unknown-id")` must gracefully fall back to a valid default thread object without throwing.
4. **Header props omission on secondary pages:** Rendering `<Header notifications={...} />` without explicit `rooms` or `alias` must default to `myRooms` and `currentUser.alias` from `lib/mock.ts`.
5. **PostCard without `roomId` (e.g., on `/profile` page):** When `roomId` is omitted on `PostCard`, the reply button must not render a broken `/rooms/undefined/posts/...` link.

---

### Task 1: Shared Room Posts Mock & Post-Thread Lookup

**Files:**
- Modify: `lib/mock.ts:63-71`
- Modify: `lib/mock/post-thread.ts:1-107`
- Test: `lib/post-thread.test.ts`

**Interfaces:**
- Consumes: `PostThreadFeedResponse`, `ReactionItem`, `CommentItemData` from `types/post-thread.ts`
- Produces:
  - `export interface BoardPostSummary { id: string; roomId: string; author: string; createdAtOffsetMs: number; timeLabel: string; content: string; reactions: { emoji: string; count: number }[]; replyCount: number; }` in `lib/mock/post-thread.ts`
  - `export function getMockBoardPosts(roomId: string): BoardPostSummary[]` in `lib/mock/post-thread.ts`
  - `export function getMockPostThread(boardSlug?: string, postId?: string, referenceTime?: number): PostThreadFeedResponse` in `lib/mock/post-thread.ts`

- [ ] **Step 1: Write failing tests in `lib/post-thread.test.ts` for Figma board posts and post-specific thread lookup**

```ts
it('returns the 3 Figma mock posts for a room with matching authors, content, reactions, and reply counts', () => {
  const posts = getMockBoardPosts('songs');
  assert.equal(posts.length, 3);
  assert.deepEqual(
    posts.map((p) => ({ id: p.id, author: p.author, content: p.content, replyCount: p.replyCount })),
    [
      { id: 'post-1', author: 'ปลาทู', content: 'ฝนตกไหม - Three Man Down', replyCount: 4 },
      { id: 'post-2', author: 'ปวยเล้ง', content: 'นิโคติน - mirrr เศร้าแบบเกือบตาย', replyCount: 18 },
      { id: 'post-3', author: 'ผักกาด', content: 'รักไม่ได้ - Groove Riders', replyCount: 0 },
    ]
  );
});

it('getMockPostThread returns thread data matching post-1, post-2, post-3 and falls back safely for unknown postId', () => {
  const t1 = getMockPostThread('songs', 'post-1', FIXED_NOW);
  assert.equal(t1.thread.author.name, 'ปลาทู');
  assert.equal(t1.thread.content, 'ฝนตกไหม - Three Man Down');
  assert.equal(countTotalComments(t1.thread.comments), 4);

  const t2 = getMockPostThread('songs', 'post-2', FIXED_NOW);
  assert.equal(t2.thread.author.name, 'ปวยเล้ง');
  assert.equal(t2.thread.content, 'นิโคติน - mirrr เศร้าแบบเกือบตาย');

  const t3 = getMockPostThread('songs', 'post-3', FIXED_NOW);
  assert.equal(t3.thread.author.name, 'ผักกาด');
  assert.equal(t3.thread.content, 'รักไม่ได้ - Groove Riders');
  assert.equal(countTotalComments(t3.thread.comments), 0);

  const fallback = getMockPostThread('books', 'custom-999', FIXED_NOW);
  assert.equal(fallback.thread.id, 'custom-999');
  assert.equal(fallback.thread.boardSlug, 'books');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `getMockBoardPosts is not a function` (or missing export).

- [ ] **Step 3: Implement `getMockBoardPosts` and post-aware `getMockPostThread` in `lib/mock/post-thread.ts` and update `songs` metadata in `lib/mock.ts`**

In `lib/mock.ts`, update the `songs` room entry so `description` is `"ขอเพลงเศร้า ๆ จนผีในห้องบอกเปลี่ยนเพลงเถอะ เศร้าจนจะตายอีกรอบแล้ว"` and `members` is `482` (`postsToday: 31`), matching the Figma header.

In `lib/mock/post-thread.ts`, define the 3 Figma posts:
1. `post-1`: author `'ปลาทู'`, `timeLabel: '2 ชม. ที่แล้ว'`, content `'ฝนตกไหม - Three Man Down'`, reactions `[{ emoji: '😢', count: 6 }, { emoji: '😭', count: 12 }]`, `replyCount: 4` (with 2 top-level comments + 2 nested replies = 4 total comments).
2. `post-2`: author `'ปวยเล้ง'`, `timeLabel: '3 ชม. ที่แล้ว'`, content `'นิโคติน - mirrr เศร้าแบบเกือบตาย'`, reactions `[{ emoji: '😂', count: 5 }, { emoji: '😭', count: 17 }, { emoji: '😢', count: 6 }]`, `replyCount: 18`.
3. `post-3`: author `'ผักกาด'`, `timeLabel: '6 ชม. ที่แล้ว'`, content `'รักไม่ได้ - Groove Riders'`, reactions `[{ emoji: '😢', count: 13 }, { emoji: '😮', count: 4 }]`, `replyCount: 0` (`comments: []`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all unit tests green).

---

### Task 2: Board Feed Header & Room Banner Alignment

**Files:**
- Modify: `component/RoomBoardFeed.tsx:1-109`
- Modify: `app/profile/page.tsx:1-35`

**Interfaces:**
- Consumes:
  - `Header` from `component/Header.tsx`
  - `currentUser`, `myRooms`, `type Room` from `lib/mock.ts`
  - `formatCount` from `lib/format.ts`
  - `getMockBoardPosts`, `type BoardPostSummary` from `lib/mock/post-thread.ts`
- Produces:
  - Updated `RoomBoardFeed({ room }: { room: Room })` rendering the shared `Header` and the Figma room banner.

- [ ] **Step 1: Replace `BoardHeader` with `component/Header.tsx` in `component/RoomBoardFeed.tsx` and `app/profile/page.tsx`**

Import `Header from "@/component/Header"` and `currentUser, myRooms` from `@/lib/mock`, then render `<Header notifications={currentUser.notifications} rooms={myRooms} alias={currentUser.alias} />`.

- [ ] **Step 2: Update the Room Hero section in `component/RoomBoardFeed.tsx` to match the Figma layout and links**

Include:
- Breadcrumb with clickable home link: `<Link href="/" className="hover:underline">หน้าหลัก</Link> <span>/</span> <span>{room.name}</span>`
- Room title (`text-2xl sm:text-3xl font-bold font-display text-ink`) and description (`text-sm text-gray-500`)
- Metadata badge row beneath description:
  - `{room.isPrivate ? "ส่วนตัว" : "สาธารณะ"}` (`rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600`)
  - `สมาชิก {formatCount(room.members)}` (`rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600`)
  - `ออนไลน์ {room.postsToday} คน` (`rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700`)
- Right-side room controls:
  - Toggleable `isJoined` button (`เข้าร่วมแล้ว` / `เข้าร่วมห้อง`, `rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50`)
  - Overflow `•••` button (`rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50`)

- [ ] **Step 3: Seed `RoomBoardFeed` state with `getMockBoardPosts(room.id)` and wire new post creation**

Initialize `const [posts, setPosts] = useState<BoardPostSummary[]>(() => getMockBoardPosts(room.id))` and when `handlePost()` creates a post, use `author: currentUser.alias`, `id: \`post-${Date.now()}\``, `roomId: room.id`, `timeLabel: "เมื่อสักครู่"`, `reactions: []`, `replyCount: 0`.

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

---

### Task 3: PostCard Figma Layout & Post Thread Navigation

**Files:**
- Modify: `component/PostCard.tsx:1-116`

**Interfaces:**
- Consumes:
  - `Link` from `next/link`
  - `EmojiPicker` from `emoji-picker-react`
  - `ReportModal` from `component/ReportModal.tsx`
- Produces:
  - `export default function PostCard(props: PostCardProps)` supporting `id?: string | number`, `roomId?: string`, `author?: string`, `room?: string`, `time: string`, `content: string`, `reactions?: Reaction[]`, `replyCount: number`.

- [ ] **Step 1: Update `component/PostCard.tsx` header layout and overflow `•••` action**

Match the Figma card header:
- Left: Avatar circle (`h-10 w-10 rounded-full bg-gray-300 shrink-0`) next to a vertical stack containing the author name (`text-sm font-semibold text-gray-900`) on top and relative time (`text-xs text-gray-400`) below (plus optional `room` badge when rendered on `/profile`).
- Right: `•••` button that toggles a compact menu with `"รายงานกระทู้"` (opening `ReportModal` with `{ author: author ?? "นิรนาม", roomName: room ?? roomId ?? "", text: content }`) and `"คัดลอกลิงก์"`.

- [ ] **Step 2: Link `PostCard` content and reply button to `/rooms/${roomId}/posts/${id}`**

When `roomId` and `id !== undefined` are provided (`const threadHref = roomId && id !== undefined ? \`/rooms/${roomId}/posts/${id}\` : null`):
- Wrap the post content `<p>` in `<Link href={threadHref} className="mb-3 block text-base text-gray-900 hover:text-kmutt-orange-dark transition-colors">` so clicking the post body opens the thread.
- Render the reply button (`{replyCount > 0 ? \`ตอบกลับ ${replyCount}\` : "ยังไม่มีใครตอบ · มาเป็นคนแรกกัน"}`) as `<Link href={threadHref} className="rounded-full border border-gray-200 px-3.5 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">`.
- When `threadHref` is `null` (such as on `/profile` without `roomId`), fall back to non-link `<p>` and `<button type="button">`.

- [ ] **Step 3: Run full test suite and TypeScript verification**

Run: `npm test; npx tsc --noEmit`
Expected: PASS (all tests pass, 0 TypeScript errors).

