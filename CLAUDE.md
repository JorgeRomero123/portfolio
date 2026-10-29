## Design Context

### Users
- **Primary audience**: Recruiters/hiring managers AND potential clients/collaborators equally
- **Context**: Visitors evaluating Jorge as a senior full-stack engineer with creative depth
- **Job to be done**: Quickly assess technical capability, see real impact metrics, and explore creative output (photography, 360 tours, interactive tools)
- **Emotional goal**: Visitors should feel impressed by the breadth of work and confident in Jorge's abilities

### Brand Personality
- **Voice**: Bold & Creative — expressive, distinctive, memorable
- **Tone**: Confident but not arrogant, creative but grounded in engineering rigor
- **3-word personality**: Bold, Creative, Technical
- **Think**: A design agency meets a senior engineer's portfolio — not generic, not corporate

### Aesthetic Direction
- **Visual tone**: Colorful, busy, joyful — organized chaos. Printed editorial illustration, not a clean SaaS page. Jorge's personality over polish
- **Theme**: Light, on cream paper — never plain white. Texture over emptiness: halftone dots, riso grain, colour-blocked sections
- **Color palette**: Cream paper `#F4EDE1`, ink `#1B1B1B`, peach `#F0C49B`, lavender `#B8B6EA`, grass green `#3F8F45`, mustard `#E5A23C`, dusty pink `#D98580`, cornflower `#6C7DE0`. Warm and slightly muted — no neon, no gradients, no purple-to-blue AI glow
- **Surfaces**: 2–3px ink borders, hard offset shadows (e.g. `4px 4px 0 #1B1B1B`) instead of soft blurred ones, halftone fills for shadows/backgrounds, the odd slightly rotated sticker/label. No glassmorphism, no `backdrop-blur` decoration
- **Hero**: An isometric cutaway building illustration where each room is a piece of Jorge's work (coding, photography/drone, 360 tours, Projection Mapper, card games, Spurs balcony); rooms are clickable and link to their section
- **Typography**: Characterful display face with an ink-drawn feel for headlines (chosen via `/font-lab`), quiet humanist sans for body, JetBrains Mono for code/labels. Geist and Space Grotesk are retired — they read as template defaults
- **Motion**: Playful and physical — wobbles, hops, stickers that peel, hover lifts that grow the hard shadow. Purposeful, respects reduced motion
- **Anti-references**: Generic template/v0/AI-generated sites, Geist-on-white, `rounded-2xl` everywhere, gradient blobs, glassmorphism, overly corporate layouts, dark-mode-only developer portfolios
- **References**: Editorial magazine illustration and risograph print; the boldness of a creative agency, with engineering rigor underneath

### Design Principles
1. **Impact first** — Lead with metrics, results, and visual proof. Every section should demonstrate capability, not just describe it
2. **Organized chaos** — Lots of colour, texture and life, held together by a clear grid and hierarchy. Busy is fine; confusing is not
3. **Show, don't tell** — Interactive tools, live demos, real photography > bullet point descriptions
4. **Consistent but not rigid** — Maintain Tailwind-based system (spacing, colors, typography) while allowing each section its own character
5. **Accessible by default** — Basic best practices: good contrast, keyboard navigation, semantic HTML. No strict WCAG target but respectful of all users

### Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- Framer Motion for animation, Recharts for data viz
- @react-three/fiber for 3D, Pannellum for 360 photos
- Deployed on Vercel with Cloudflare R2 for media storage
- Fonts via `next/font/google` (display/body pairing being chosen in `/font-lab`; JetBrains Mono for code)

## Code Graph (graphify)

A graphify code graph lives in `graphify-out/` (gitignored, so it may be absent
on a fresh clone — rebuild with `graphify update .`, no API cost).

Prefer it over reading many files for **structural** questions: what depends on
X, how two subsystems connect, where the hubs are, whether something is safe to
delete. Use `graphify affected "X"`, `path "A" "B"`, `explain "X"`, `god-nodes`,
or the graphify MCP tools. Stick to grep/git for exact-string and local
questions — they're faster and never stale.

**Check freshness first.** `graphify-out/GRAPH_REPORT.md` names the commit it was
built from. If that doesn't match `git rev-parse HEAD`, re-run `graphify update .`
before trusting it, or fall back to grep.
