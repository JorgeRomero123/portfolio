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
- **Visual tone**: Light & minimal with bold creative moments
- **Theme**: Light mode — white space, subtle shadows, clean lines
- **Color palette**: Blue primary (#0070f3), gray-50 backgrounds, white cards with shadow-md. Gradient accents on tool cards for visual interest
- **Typography**: Geist Sans (body), Geist Mono (code). Bold hierarchy with large hero text (5xl-7xl)
- **Motion**: Framer Motion parallax hero, hover scales, smooth transitions (300ms). Purposeful animation, not decorative
- **Anti-references**: Generic template sites, overly corporate layouts, dark-mode-only developer portfolios
- **References**: The boldness of a creative agency with the precision of Vercel/Linear

### Design Principles
1. **Impact first** — Lead with metrics, results, and visual proof. Every section should demonstrate capability, not just describe it
2. **Bold simplicity** — Clean layouts with moments of creative expression (gradients, parallax, interactions). Minimal doesn't mean boring
3. **Show, don't tell** — Interactive tools, live demos, real photography > bullet point descriptions
4. **Consistent but not rigid** — Maintain Tailwind-based system (spacing, colors, typography) while allowing each section its own character
5. **Accessible by default** — Basic best practices: good contrast, keyboard navigation, semantic HTML. No strict WCAG target but respectful of all users

### Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- Framer Motion for animation, Recharts for data viz
- @react-three/fiber for 3D, Pannellum for 360 photos
- Deployed on Vercel with Cloudflare R2 for media storage
- Geist Sans/Mono fonts

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
