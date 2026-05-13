# Article Page Implementation Tasks

- [ ] **API: Add GET + PATCH to `/api/blogs/[id]/route.ts`**
  - [/] Add GET endpoint for fetching single post
  - [ ] Add PATCH endpoint for editing post (master admin or post author only)

- [ ] **Delete ClientRedirect.tsx** — no longer needed

- [ ] **Build `/post/[id]/page.tsx`** — Server component
  - [ ] Fetch post, related posts, sidebar data via Prisma
  - [ ] Retain OG metadata generation
  - [ ] Pass data to ArticlePage client component

- [ ] **Build `/post/[id]/ArticlePage.tsx`** — Client component
  - [ ] Header + navbar (same as homepage)
  - [ ] Breadcrumb navigation
  - [ ] Article title, author, date, reading time
  - [ ] Abstract/summary highlighted box
  - [ ] Full article content
  - [ ] Share buttons (copy, WhatsApp, Facebook, print)
  - [ ] Uploader credit
  - [ ] Delete button with Hindi confirmation dialog
  - [ ] Edit functionality (master admin + post author)
  - [ ] Suggested posts section
  - [ ] Sidebar (top reads, resources, newsletter, calendar)
  - [ ] Ad placeholders
  - [ ] Footer
  - [ ] Dark/light theme support
  - [ ] Print layout

- [ ] **Update `ClientPage.tsx`**
  - [ ] Change handlePostOpen to router.push
  - [ ] Remove activePost modal block
  - [ ] Remove print layout block (moved to article page)
  - [ ] Clean up unused activePost state

- [ ] **Update `globals.css`** — Add article page styles

- [ ] **Verify** — Build, test navigation, test edit, test delete
