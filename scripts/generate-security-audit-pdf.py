#!/usr/bin/env python3
"""Generate Vaam Ki Aawaz Security Threat and Technical Bugs Analysis PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
LOGO_PATH = ROOT / "public" / "vaamki-logo.png"
OUTPUT_PATH = ROOT / "docs" / "Vaam_Ki_Aawaz_Security_Threat_and_Technical_Bugs_Analysis.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 0.75 * inch
BORDER_INSET = 0.4 * inch


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def draw_page_border(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#7a1216"))
    canvas.setLineWidth(1.5)
    canvas.rect(
        BORDER_INSET,
        BORDER_INSET,
        PAGE_WIDTH - 2 * BORDER_INSET,
        PAGE_HEIGHT - 2 * BORDER_INSET,
    )
    canvas.setStrokeColor(colors.HexColor("#c4a35a"))
    canvas.setLineWidth(0.6)
    inner = BORDER_INSET + 3
    canvas.rect(
        inner,
        inner,
        PAGE_WIDTH - 2 * inner,
        PAGE_HEIGHT - 2 * inner,
    )
    # Footer page number (skip cover)
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#555555"))
        canvas.drawCentredString(
            PAGE_WIDTH / 2,
            BORDER_INSET + 8,
            f"Page {doc.page - 1}",
        )
        canvas.setFont("Helvetica-Oblique", 7)
        canvas.drawString(
            MARGIN,
            BORDER_INSET + 8,
            "Vaam Ki Aawaz — Confidential",
        )
    canvas.restoreState()


def draw_cover_page(canvas, doc):
    """Cover: border + logo midway between top margin and title; title centered on page."""
    draw_page_border(canvas, doc)
    canvas.saveState()

    top_margin_y = PAGE_HEIGHT - MARGIN
    # Title block centered on the page (horizontal + vertical)
    title_lines = [
        ("Vaam Ki Aawaz", "Helvetica-Bold", 24),
        ("Security Threat and Technical Bugs Analysis", "Helvetica-Bold", 16),
    ]
    subtitle_lines = [
        ("Comprehensive Application Security & Code Quality Audit", "Helvetica", 11),
        ("Next.js CMS — Authentication, APIs, Content Publishing, and Engagement", "Helvetica", 10),
        ("Document date: 13 July 2026", "Helvetica", 10),
        ("Classification: Confidential — Internal Use", "Helvetica-Oblique", 9),
    ]

    line_gap = 8
    title_block_height = 0
    for _, _, size in title_lines:
        title_block_height += size + line_gap
    title_block_height += 18
    for _, _, size in subtitle_lines:
        title_block_height += size + 6

    # Vertical center of the whole title+subtitle block
    title_block_center_y = PAGE_HEIGHT / 2
    title_top_y = title_block_center_y + title_block_height / 2

    # Logo center = midpoint between top margin and the top of the title block
    logo_center_y = (top_margin_y + title_top_y) / 2
    logo_size = 1.55 * inch

    if LOGO_PATH.exists():
        canvas.drawImage(
            str(LOGO_PATH),
            PAGE_WIDTH / 2 - logo_size / 2,
            logo_center_y - logo_size / 2,
            width=logo_size,
            height=logo_size,
            preserveAspectRatio=True,
            mask="auto",
        )

    # Draw title block from top downward, centered horizontally
    y = title_top_y
    canvas.setFillColor(colors.HexColor("#7a1216"))
    for text, font, size in title_lines:
        canvas.setFont(font, size)
        y -= size
        canvas.drawCentredString(PAGE_WIDTH / 2, y, text)
        y -= line_gap

    y -= 10
    canvas.setFillColor(colors.HexColor("#333333"))
    for text, font, size in subtitle_lines:
        canvas.setFont(font, size)
        y -= size
        canvas.drawCentredString(PAGE_WIDTH / 2, y, text)
        y -= 6

    canvas.restoreState()


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#7a1216"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#333333"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#7a1216"),
            spaceBefore=16,
            spaceAfter=10,
            borderPadding=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubHeading",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#1a1a1a"),
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyJustify",
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#222222"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FindingTitle",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#7a1216"),
            spaceBefore=10,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetaLabel",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#444444"),
            spaceBefore=2,
            spaceAfter=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetaValue",
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#222222"),
            spaceAfter=3,
            leftIndent=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletBody",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#222222"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="TocEntry",
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#222222"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SeverityCritical",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=colors.HexColor("#8b0000"),
        )
    )
    return styles


def severity_hex(sev: str) -> str:
    mapping = {
        "Critical": "#8b0000",
        "High": "#c0392b",
        "Medium": "#d68910",
        "Low": "#1a5276",
        "Informational": "#566573",
    }
    return mapping.get(sev, "#222222")


def finding_block(styles, number, title, severity, category, files, evidence, why, impact, reproduce, fix, confidence):
    bits = []
    bits.append(Paragraph(f"{number}. {esc(title)}", styles["FindingTitle"]))

    sev_para = Paragraph(
        f"<b>Severity:</b> <font color='{severity_hex(severity)}'>{severity}</font>"
        f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Category:</b> {esc(category)}"
        f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Confidence:</b> {confidence}",
        styles["MetaValue"],
    )
    bits.append(sev_para)
    bits.append(Paragraph(f"<b>Affected file(s):</b> {esc(files)}", styles["MetaValue"]))
    bits.append(Paragraph(f"<b>Evidence:</b> {esc(evidence)}", styles["MetaValue"]))
    bits.append(Paragraph(f"<b>Why it is a problem:</b> {esc(why)}", styles["MetaValue"]))
    bits.append(Paragraph(f"<b>Realistic impact:</b> {esc(impact)}", styles["MetaValue"]))
    if reproduce:
        bits.append(Paragraph(f"<b>How to reproduce:</b> {esc(reproduce)}", styles["MetaValue"]))
    bits.append(Paragraph(f"<b>Recommended fix:</b> {esc(fix)}", styles["MetaValue"]))
    bits.append(Spacer(1, 4))
    return KeepTogether(bits)


# --- Finding data (security vs technical) ---

SECURITY_FINDINGS = [
    dict(
        title="Unauthenticated category create / hide",
        severity="Critical",
        category="Broken Access Control",
        files="src/app/api/categories/route.ts; ClientPage.tsx (UI-only gate)",
        evidence="POST /api/categories upserts categories with no requireAuth or permission check. Product intent confirmed: only MASTER_ADMIN or admins with manageCategories may change categories.",
        why="Authorization exists only in the UI. Attackers call the API directly and bypass the permission check.",
        impact="Any internet user can create fake categories or soft-hide real ones, disrupting navigation and publishing.",
        reproduce='POST /api/categories with JSON {"name":"x","isHidden":true} without authentication cookies.',
        fix="Require authentication; load user from DB; allow only MASTER_ADMIN or ADMIN with manageCategories === true; return 403 otherwise.",
        confidence="High",
    ),
    dict(
        title="Hardcoded JWT secret fallback in source code",
        severity="High",
        category="Cryptographic / Authentication",
        files="src/lib/auth.ts (lines 5–6)",
        evidence='Code uses process.env.JWT_SECRET || "your-super-secret-jwt-key-replace-in-production". Production Hostinger env sets a long random JWT_SECRET, so the fallback is not active when the env var is present.',
        why="If the env var is ever missing on a deploy, the known default secret allows forging MASTER_ADMIN tokens.",
        impact="Misconfigured deploy could enable full administrative takeover of the CMS.",
        reproduce="Omit JWT_SECRET locally, mint a JWT with the fallback string and role MASTER_ADMIN, call privileged APIs.",
        fix="Fail application startup if JWT_SECRET is missing or weak; never ship a default secret. Rotate if any environment may have used the fallback.",
        confidence="High",
    ),
    dict(
        title="Public /api/debug information disclosure",
        severity="High",
        category="Sensitive Information Disclosure",
        files="src/app/api/debug/route.ts",
        evidence="Unauthenticated GET returns masked DATABASE_URL structure, DB connection test result, NODE_ENV, and process.cwd(). Confirmed: must not remain public in production.",
        why="Exposes infrastructure and environment details to anyone who can reach the endpoint.",
        impact="Aids reconnaissance (DB host/user shape, deploy paths, environment). Connection failures may leak further detail.",
        reproduce="GET /api/debug without authentication.",
        fix="Remove the route in production, or restrict to MASTER_ADMIN and non-production environments only.",
        confidence="High",
    ),
    dict(
        title="Stored XSS via article HTML; ineffective sanitizers",
        severity="High",
        category="Cross-Site Scripting (XSS)",
        files="src/utils/sanitizeHtml.tsx; src/utils/designUtils.ts (cleanHtml); ArticlePage.tsx; TiptapEditor GenericIframe / Link",
        evidence="sanitizeHtmlClient only normalizes whitespace; cleanHtml only strips ZWSP/nbsp. Content is rendered with dangerouslySetInnerHTML. Product intent: publishers must not run scripts; TipTap toolbar features (links, images, video embeds, formatting) must remain.",
        why="Dangerous tags and event handlers in published HTML execute for every reader. Same-origin XSS can drive authenticated admin actions while an admin views a post.",
        impact="Compromised or malicious publisher account can attack readers and logged-in staff. Direct API posts can bypass any client-only checks.",
        reproduce="Publish article HTML containing e.g. <img src=x onerror=alert(1)> or a script tag via editor paste or API.",
        fix="Server-side HTML allowlist on blog create/update (and ideally on render) that permits TipTap-safe tags/attrs and YouTube/Vimeo iframes only; strip script, on*, javascript: URLs. Do not change TipTap toolbar UX. Add CSP as defense in depth.",
        confidence="High",
    ),
    dict(
        title="OTP send/verify lacking rate limits and lockout",
        severity="High",
        category="API Abuse / Weak OTP",
        files="src/app/api/otp/send/route.ts; src/app/api/otp/verify/route.ts",
        evidence="Any email can request OTPs with no throttle; 6-digit codes; no verify attempt limit; codes stored and compared in plaintext.",
        why="Enables SMTP/email bombing and OTP guessing for flows that trust verification.",
        impact="Inbox flooding via site SMTP credentials; abuse of newsletter/admin UX OTP steps; resource cost on mail provider.",
        reproduce="Repeatedly POST /api/otp/send for a victim email; brute-force /api/otp/verify.",
        fix="Per-IP and per-email rate limits; exponential backoff; hash OTPs at rest; max attempts; bind OTP to purpose/session.",
        confidence="High",
    ),
    dict(
        title="JWT role trusted without database re-check",
        severity="High",
        category="Authorization / Session Management",
        files="src/app/api/events/*; src/app/api/resources/*; src/app/reports/page.tsx",
        evidence="These paths check authPayload.role / session.role from the JWT instead of reloading current role from the database (unlike blogs/users/site-config).",
        why="Role demotion does not revoke elevated access until the 24h token expires.",
        impact="A demoted former MASTER_ADMIN can still manage events, resources, and reports for up to one day.",
        reproduce="Log in as MASTER_ADMIN, demote the account in DB, continue calling event/resource APIs with the same cookie.",
        fix="Always authorize from the current DB user record; invalidate or shorten sessions on role/active changes.",
        confidence="High",
    ),
    dict(
        title="Login endpoint without rate limiting",
        severity="High",
        category="Authentication Abuse",
        files="src/app/api/auth/login/route.ts",
        evidence="Unlimited password attempts; each verifyPassword uses scrypt (CPU-costly).",
        why="Enables credential stuffing and login-endpoint CPU exhaustion.",
        impact="Account compromise risk and potential DoS against the auth path.",
        reproduce="Script repeated POST /api/auth/login with varying passwords.",
        fix="Rate limit by IP and email; lockout or CAPTCHA after N failures.",
        confidence="High",
    ),
    dict(
        title="File uploads allowed for any authenticated user",
        severity="High",
        category="Broken Access Control / File Upload",
        files="src/app/api/uploads/route.ts; src/lib/fileStorage.ts",
        evidence="Only requireAuth is checked; inactive contributors can upload; MIME type taken from client file.type without magic-byte verification.",
        why="Upload privilege is broader than publishing privilege; client-claimed MIME is spoofable.",
        impact="Disk abuse by deactivated accounts; risk of storing non-image content under image extensions.",
        reproduce="Authenticate as inactive contributor; POST multipart file to /api/uploads.",
        fix="Require publish/admin capability and active status; verify file signatures; enforce quotas.",
        confidence="High",
    ),
    dict(
        title="Open redirect via blog image API",
        severity="Medium",
        category="Open Redirect",
        files="src/app/api/image/blog/[id]/route.ts",
        evidence="Redirects to http(s) URLs or resolves relative/protocol-relative URLs from postImage or first <img src> in content.",
        why="Trusted site URLs can bounce users to attacker-controlled destinations.",
        impact="Phishing and trust abuse via shared /api/image/blog/{id} links.",
        reproduce="Publish content with external or //evil.example image src; visit /api/image/blog/{id}.",
        fix="Serve only local media or data:image URIs; never redirect to arbitrary hosts.",
        confidence="High",
    ),
    dict(
        title="Unauthenticated bootstrap setup endpoint and race",
        severity="Medium",
        category="Authentication",
        files="src/app/api/auth/setup/route.ts",
        evidence="POST is public until a MASTER_ADMIN exists; count-then-create is not transactional.",
        why="On an empty database, anyone can claim the first master admin; concurrent requests may race.",
        impact="Hostile first-writer takeover during initial setup or if the user table is wiped.",
        reproduce="On empty DB, POST /api/auth/setup with email/password; optionally race two requests.",
        fix="Gate with a setup secret or one-time env flag; enforce uniqueness/transactional create.",
        confidence="High",
    ),
    dict(
        title="Unauthenticated comments without abuse controls",
        severity="Medium",
        category="API Abuse",
        files="src/app/api/blogs/[id]/comments/route.ts",
        evidence="POST accepts name/email/comment with no auth, OTP, CAPTCHA, or rate limit; stores email.",
        why="Public write endpoint is trivial to automate.",
        impact="Spam, PII pollution, and database growth.",
        reproduce="Loop POST /api/blogs/{id}/comments with arbitrary payloads.",
        fix="Rate limit, CAPTCHA or verified identity, moderation queue.",
        confidence="High",
    ),
    dict(
        title="Click count and reaction inflation",
        severity="Medium",
        category="Integrity / Abuse",
        files="src/app/api/blogs/[id]/click/route.ts; reactions/route.ts",
        evidence="Unauthenticated click increment; visitorId fully client-controlled for reactions.",
        why="Popularity metrics are not integrity-protected.",
        impact="Fake rankings and misleading engagement statistics.",
        reproduce="Script POST click/reaction with rotating visitorIds.",
        fix="Rate limits, stronger visitor binding, anomaly detection.",
        confidence="High",
    ),
    dict(
        title="Missing security headers and Content-Security-Policy",
        severity="Medium",
        category="Missing Security Headers",
        files="next.config.ts",
        evidence="No CSP, X-Frame-Options, Referrer-Policy, or related hardening headers configured.",
        why="Browser-side defenses against XSS and clickjacking are weaker than they should be.",
        impact="Higher impact if HTML injection occurs; easier framing attacks.",
        reproduce="Inspect response headers on production pages.",
        fix="Add CSP (compatible with TipTap/embeds), frame protections, and standard security headers in Next config.",
        confidence="High",
    ),
    dict(
        title="Resource detail endpoint returns full fileData payloads",
        severity="Medium",
        category="Data Exposure / DoS",
        files="src/app/api/resources/[id]/route.ts",
        evidence="GET returns the full resource including large base64 fileData when present.",
        why="Large binary blobs should be served as media URLs, not embedded in JSON.",
        impact="Bandwidth/memory pressure; unnecessary exposure of full file contents in API responses.",
        reproduce="GET /api/resources/{id} for a PDF stored as data URI/fileData.",
        fix="Store on disk/media only; return URL references, not raw base64 in list/detail JSON.",
        confidence="High",
    ),
    dict(
        title="Inactive contributors can still obtain sessions",
        severity="Low",
        category="Session / Authorization",
        files="src/app/api/auth/login/route.ts",
        evidence="Login does not reject active === false; cookie is still issued (publish routes correctly block inactive publishers).",
        why="Deactivation does not fully revoke interactive access.",
        impact="Combined with unrestricted uploads, deactivated users retain unnecessary capabilities.",
        reproduce="Deactivate a contributor; log in successfully; call /api/uploads.",
        fix="Reject login for inactive contributors; optionally revoke outstanding sessions.",
        confidence="High",
    ),
    dict(
        title="OTP codes stored and compared in plaintext",
        severity="Low",
        category="Cryptography",
        files="OTP send/verify routes; Otp model",
        evidence="Codes inserted and selected as plaintext strings with equality compare.",
        why="DB disclosure of OTP table yields usable codes within expiry.",
        impact="Elevates impact of any database read compromise affecting OTP rows.",
        reproduce="N/A (inspect schema/code path).",
        fix="Store salted hashes; use constant-time compare; short TTL and single use.",
        confidence="High",
    ),
    dict(
        title="Contributor codes generated with Math.random",
        severity="Low",
        category="Cryptography",
        files="src/lib/contributorCode.ts",
        evidence="Suffix characters chosen via Math.random rather than crypto.randomInt.",
        why="Non-cryptographic RNG is predictable relative to CSPRNG.",
        impact="Lower practical risk for display codes, but poor crypto hygiene.",
        reproduce="N/A.",
        fix="Use crypto.randomInt / randomBytes.",
        confidence="High",
    ),
    dict(
        title="API error responses leak internal exception messages",
        severity="Low",
        category="Information Disclosure",
        files="Multiple API routes (blogs, OTP, authors, resources, etc.)",
        evidence="Responses include details: err.message or similar internal strings.",
        why="Helps attackers map stack, schema, and misconfigurations.",
        impact="Reconnaissance aid; usually not direct RCE.",
        reproduce="Trigger failures (bad schema, invalid IDs) and inspect JSON error bodies.",
        fix="Return generic client errors; log details server-side only.",
        confidence="High",
    ),
    dict(
        title="Inline PDF media without Content-Disposition attachment",
        severity="Low",
        category="Content Handling",
        files="src/app/api/media/[...path]/route.ts",
        evidence="PDFs served with Content-Type application/pdf and no attachment disposition; no nosniff header.",
        why="Browser PDF viewers have historically had XSS-class issues with crafted PDFs.",
        impact="Browser-dependent risk for malicious PDFs uploaded by privileged users.",
        reproduce="Upload PDF and open /api/media/resources/… in browser.",
        fix="Add Content-Disposition: attachment for PDFs and X-Content-Type-Options: nosniff.",
        confidence="Medium",
    ),
    dict(
        title="No password strength policy on register/setup",
        severity="Low",
        category="Password Handling",
        files="src/app/api/auth/register/route.ts; setup/route.ts",
        evidence="Only presence of password is checked; hashing via scrypt is otherwise sound.",
        why="Weak passwords increase credential stuffing success.",
        impact="Easier compromise of staff accounts if weak passwords are chosen.",
        reproduce="Create user with a short password.",
        fix="Enforce minimum length and basic complexity server-side.",
        confidence="High",
    ),
    dict(
        title="CSRF residual risk with cookie sessions",
        severity="Informational",
        category="CSRF",
        files="Login/logout cookie settings (sameSite: lax, httpOnly)",
        evidence="Auth uses httpOnly cookie with SameSite=Lax; no CSRF tokens on state-changing APIs.",
        why="Lax mitigates many classic cross-site POSTs; XSS remains the more realistic abuse path.",
        impact="Limited for classic CSRF; still worth defense-in-depth for sensitive actions.",
        reproduce="N/A.",
        fix="Consider CSRF tokens or SameSite=Strict for admin mutations; prioritize XSS fixes.",
        confidence="Medium",
    ),
    dict(
        title="Client-side OTP before user create not enforced server-side",
        severity="Informational",
        category="Authorization / Business Logic",
        files="ClientPage OTP flow; src/app/api/auth/register/route.ts",
        evidence="OTP verify is a UI gate; /api/auth/register does not require a verified OTP token.",
        why="Email verification of new admins/contributors can be skipped via direct API use by an authorized admin.",
        impact="Weaker assurance that the email mailbox is controlled by the new user.",
        reproduce="As MASTER_ADMIN, POST /api/auth/register without completing OTP UI.",
        fix="Issue a short-lived server-side verification token after OTP and require it on register.",
        confidence="High",
    ),
]

TECHNICAL_FINDINGS = [
    dict(
        title="ADMIN manageUsers permission not parsed on list/register APIs",
        severity="Medium",
        category="Logic / Authorization Bug",
        files="src/app/api/users/route.ts; src/app/api/auth/register/route.ts (users/[id] parses correctly)",
        evidence="permissions is stored as a JSON string but cast directly to an object; .manageUsers is never true for ADMINs.",
        why="Delegated user-management permission is broken on the server while the UI shows it as enabled.",
        impact="Only MASTER_ADMIN can list/create users via API; admins with manageUsers see UI that fails silently.",
        reproduce="Grant manageUsers to an ADMIN; call GET /api/users — expect 403.",
        fix="Use parseUserPermissions consistently on all authz checks.",
        confidence="High",
    ),
    dict(
        title="Newsletter form does not persist subscriptions",
        severity="Medium",
        category="Incomplete Feature / Data Integrity",
        files="ClientPage.tsx (executeNewsletterSubscription); OTP routes",
        evidence="After OTP success, the client only shows a thank-you message and clears fields. No newsletter table/API write. Product intent: store subscriber details securely in the database when activated.",
        why="Users believe they subscribed; data is discarded.",
        impact="Lost subscribers; false UX; OTP cost without business value.",
        reproduce="Complete newsletter OTP flow; verify no DB row is created.",
        fix="Add NewsletterSubscriber model/API with validation, rate limits, consent fields, and secure storage; wire OTP verify to a server-side subscribe action.",
        confidence="High",
    ),
    dict(
        title="Runtime DDL on hot API request paths",
        severity="Medium",
        category="Reliability / Performance",
        files="src/lib/db-setup.ts; OTP/events/authors routes using CREATE TABLE / ALTER",
        evidence="Schema ensure functions run during request handling.",
        why="DDL under load causes locks, latency spikes, and racey schema evolution.",
        impact="Intermittent slow requests and production risk during traffic peaks.",
        reproduce="Hit /api/blogs or OTP under concurrency while schema ensure runs.",
        fix="Use Prisma migrations at deploy time only; remove request-path DDL.",
        confidence="High",
    ),
    dict(
        title="Unbounded article content and data-URI images in database",
        severity="Medium",
        category="Performance / DoS",
        files="src/app/api/blogs/route.ts; src/lib/fileStorage.ts isValidImageRef",
        evidence="No max content length; data:image references are accepted as valid image refs.",
        why="Huge LongText payloads inflate DB and memory for list/detail operations.",
        impact="Slow pages, high memory use, possible request timeouts.",
        reproduce="POST a multi-megabyte HTML body or large data URI as postImage.",
        fix="Enforce body size limits; require disk/media URLs for images.",
        confidence="High",
    ),
    dict(
        title="TypeScript build errors ignored in Next config",
        severity="Medium",
        category="Reliability",
        files="next.config.ts",
        evidence="typescript.ignoreBuildErrors: true",
        why="Type errors do not fail CI/production builds.",
        impact="Runtime exceptions from preventable type bugs ship to production.",
        reproduce="Introduce a type error; next build still succeeds.",
        fix="Remove the flag and fix type errors.",
        confidence="High",
    ),
    dict(
        title="ensureBlogSchema / seed race on empty blog table",
        severity="Low",
        category="Concurrency / Logic",
        files="src/app/api/blogs/route.ts GET",
        evidence="count === 0 then createMany of seed posts without strong concurrency control.",
        why="Parallel cold starts can duplicate seed attempts (createMany may partially conflict).",
        impact="Noisy errors or duplicate seed attempts on first deploy.",
        reproduce="Concurrent GET /api/blogs against empty BlogPost table.",
        fix="Seed in migration/deploy script; or use a transactional advisory lock.",
        confidence="Medium",
    ),
    dict(
        title="Monolithic ClientPage maintainability risk",
        severity="Low",
        category="Maintainability",
        files="src/app/ClientPage.tsx (~4300+ lines)",
        evidence="Homepage, admin, newsletter, resources, events, and auth UX colocated in one client component.",
        why="Hard to review, test, and securely change authorization-sensitive UI.",
        impact="Higher chance of regressions and missed authz gaps in future changes.",
        reproduce="N/A (structural).",
        fix="Split by feature routes/components without changing behavior when refactoring is explicitly requested.",
        confidence="High",
    ),
    dict(
        title="Inconsistent authorization patterns across APIs",
        severity="Low",
        category="Architecture / Maintainability",
        files="Events/resources (JWT role) vs blogs/users/site-config (DB user)",
        evidence="Two different authz styles coexist.",
        why="Easy to introduce privilege bugs when adding endpoints.",
        impact="Ongoing security debt and review cost.",
        reproduce="Compare requireAuth usage across api folder.",
        fix="Central helper: requireUser() returning DB role + parsed permissions.",
        confidence="High",
    ),
    dict(
        title="jose package not declared as direct dependency",
        severity="Informational",
        category="Dependency Hygiene",
        files="src/lib/auth.ts; package.json",
        evidence="jose is imported for JWT but only appears transitively in the lockfile.",
        why="Upstream dependency changes can break auth builds unexpectedly.",
        impact="Fragile installs / future breakage.",
        reproduce="Inspect package.json vs import of jose.",
        fix="Add jose as a direct dependency with a pinned version.",
        confidence="High",
    ),
    dict(
        title="Misleading HTML sanitizer naming and behavior",
        severity="Informational",
        category="Code Smell / Security Debt",
        files="src/utils/sanitizeHtml.tsx; designUtils cleanHtml",
        evidence="Names imply XSS protection; implementations only normalize whitespace.",
        why="Developers may assume content is safe when it is not.",
        impact="False sense of security; delays real XSS remediation.",
        reproduce="Read sanitizeHtmlClient implementation.",
        fix="Rename or replace with a real allowlist sanitizer; document TipTap-safe policy.",
        confidence="High",
    ),
]


def summary_table(styles, rows):
    data = [
        [
            Paragraph("<b>#</b>", styles["MetaLabel"]),
            Paragraph("<b>Severity</b>", styles["MetaLabel"]),
            Paragraph("<b>Title</b>", styles["MetaLabel"]),
        ]
    ]
    for i, f in enumerate(rows, 1):
        data.append(
            [
                Paragraph(str(i), styles["MetaValue"]),
                Paragraph(
                    f"<font color='{severity_hex(f['severity'])}'><b>{f['severity']}</b></font>",
                    styles["MetaValue"],
                ),
                Paragraph(esc(f["title"]), styles["MetaValue"]),
            ]
        )
    table = Table(data, colWidths=[0.4 * inch, 1.0 * inch, 5.0 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5e6e7")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ]
        )
    )
    return table


def build_document():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()

    frame = Frame(
        MARGIN,
        MARGIN,
        PAGE_WIDTH - 2 * MARGIN,
        PAGE_HEIGHT - 2 * MARGIN,
        id="normal",
    )
    # Cover frame is empty — all cover content is drawn on the canvas
    cover_frame = Frame(
        MARGIN,
        MARGIN,
        PAGE_WIDTH - 2 * MARGIN,
        PAGE_HEIGHT - 2 * MARGIN,
        id="cover",
    )
    doc = BaseDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        title="Vaam Ki Aawaz — Security Threat and Technical Bugs Analysis",
        author="Security Audit",
    )
    doc.addPageTemplates(
        [
            PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover_page),
            PageTemplate(id="Body", frames=[frame], onPage=draw_page_border),
        ]
    )

    story = []
    # Cover template draws page 1; then switch to body content pages
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())

    # Executive summary
    story.append(Paragraph("1. Executive Summary", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "This document records security vulnerabilities and technical defects identified during a "
            "full-codebase audit of the Vaam Ki Aawaz Next.js application (Prisma/MySQL, cookie JWT auth, "
            "rich-text publishing, OTP email flows, and public engagement APIs). Findings are based on "
            "code evidence. Product clarifications from stakeholders are incorporated: category mutation "
            "must require MASTER_ADMIN or manageCategories; publishers must not be able to execute scripts "
            "via article HTML while TipTap toolbar features remain; JWT_SECRET is set in Hostinger production; "
            "/api/debug must not be public; newsletter subscriptions must eventually persist securely in the database.",
            styles["BodyJustify"],
        )
    )
    story.append(
        Paragraph(
            "<b>Overall Security Risk Rating:</b> High &nbsp;&nbsp;|&nbsp;&nbsp; "
            "<b>Overall Code Quality Rating:</b> Fair — needs hardening and consistency fixes.",
            styles["BodyJustify"],
        )
    )
    story.append(
        Paragraph(
            f"This report lists <b>{len(SECURITY_FINDINGS)}</b> security-related findings and "
            f"<b>{len(TECHNICAL_FINDINGS)}</b> technical / reliability / maintainability findings.",
            styles["BodyJustify"],
        )
    )

    story.append(Paragraph("2. Scope and Method", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "Review covered authentication and session handling, authorization on API routes, file uploads "
            "and media serving, OTP and mail flows, HTML rendering paths, engagement endpoints, configuration "
            "and debug surfaces, and selected reliability patterns (schema bootstrap, error handling, build config). "
            "Hypothetical issues without code evidence were excluded. Intended product behavior was confirmed "
            "with the project owner before final severity assignment for categories and rich-text XSS.",
            styles["BodyJustify"],
        )
    )

    story.append(Paragraph("3. Ratings Legend", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "<b>Critical</b> — Direct, unauthenticated or trivial path to major integrity or takeover impact. "
            "<b>High</b> — Realistic exploit or serious abuse with significant impact. "
            "<b>Medium</b> — Meaningful risk or defect under common conditions. "
            "<b>Low</b> — Limited impact or harder prerequisites. "
            "<b>Informational</b> — Hygiene, incomplete feature, or defense-in-depth note.",
            styles["BodyJustify"],
        )
    )

    # Security section
    story.append(PageBreak())
    story.append(Paragraph("4. Security Issues", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "This section covers authentication, authorization, injection/XSS, session handling, "
            "sensitive data exposure, upload risks, abuse of public APIs, and related cryptographic concerns.",
            styles["BodyJustify"],
        )
    )
    story.append(Paragraph("4.1 Security Findings Summary", styles["SubHeading"]))
    story.append(summary_table(styles, SECURITY_FINDINGS))
    story.append(Spacer(1, 10))
    story.append(Paragraph("4.2 Security Findings Detail", styles["SubHeading"]))

    for i, f in enumerate(SECURITY_FINDINGS, 1):
        story.append(
            finding_block(
                styles,
                number=f"S-{i:02d}",
                **{k: f[k] for k in (
                    "title", "severity", "category", "files", "evidence",
                    "why", "impact", "reproduce", "fix", "confidence",
                )},
            )
        )

    # Technical section
    story.append(PageBreak())
    story.append(Paragraph("5. Technical Bugs and Reliability Issues", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "This section covers logic bugs, incomplete features, concurrency and performance problems, "
            "build/configuration reliability issues, and maintainability concerns that affect correctness "
            "or operational safety even when they are not classic external exploit classes.",
            styles["BodyJustify"],
        )
    )
    story.append(Paragraph("5.1 Technical Findings Summary", styles["SubHeading"]))
    story.append(summary_table(styles, TECHNICAL_FINDINGS))
    story.append(Spacer(1, 10))
    story.append(Paragraph("5.2 Technical Findings Detail", styles["SubHeading"]))

    for i, f in enumerate(TECHNICAL_FINDINGS, 1):
        story.append(
            finding_block(
                styles,
                number=f"T-{i:02d}",
                **{k: f[k] for k in (
                    "title", "severity", "category", "files", "evidence",
                    "why", "impact", "reproduce", "fix", "confidence",
                )},
            )
        )

    # Top fixes & scenarios
    story.append(PageBreak())
    story.append(Paragraph("6. Most Urgent Fixes (Top 10)", styles["SectionHeading"]))
    urgent = [
        "Authenticate and authorize POST /api/categories (MASTER_ADMIN or manageCategories).",
        "Remove or lock down /api/debug in production.",
        "Fail closed if JWT_SECRET is missing; keep production secret strong and unique.",
        "Rate-limit login and OTP send/verify; hash OTPs.",
        "Server-side TipTap-safe HTML allowlist on blog create/update (no scripts; keep toolbar features).",
        "Re-check role/permissions from the database for events, resources, and reports.",
        "Restrict uploads by role/active status; verify file magic bytes.",
        "Fix parseUserPermissions on users list and register routes.",
        "Close open redirect in /api/image/blog/[id].",
        "Stop runtime DDL; use migrations; remove ignoreBuildErrors; implement secure newsletter persistence.",
    ]
    items = [
        ListItem(Paragraph(t, styles["BulletBody"]), leftIndent=12, bulletColor=colors.HexColor("#7a1216"))
        for t in urgent
    ]
    story.append(ListFlowable(items, bulletType="1", start=1, leftIndent=20))

    story.append(Paragraph("7. Potential Attack Scenarios", styles["SectionHeading"]))
    scenarios = [
        "Anonymous category defacement via unauthenticated POST /api/categories.",
        "Stored XSS from publisher HTML leading to reader compromise or admin session action abuse.",
        "OTP/SMTP abuse by flooding /api/otp/send against arbitrary addresses.",
        "Privilege persistence: demoted MASTER_ADMIN continues using JWT for events/resources/reports.",
        "Open-redirect phishing via /api/image/blog/{id} after planting external image URLs in content.",
        "Credential stuffing against /api/auth/login without rate limits.",
    ]
    items = [
        ListItem(Paragraph(t, styles["BulletBody"]), leftIndent=12, bulletColor=colors.HexColor("#7a1216"))
        for t in scenarios
    ]
    story.append(ListFlowable(items, bulletType="1", start=1, leftIndent=20))

    story.append(Paragraph("8. Technical Debt Summary", styles["SectionHeading"]))
    story.append(
        Paragraph(
            "The codebase mixes strong patterns (scrypt password hashing, httpOnly cookies, many routes that "
            "re-load users from the database) with weak ones (JWT-role checks, public mutating endpoints, "
            "runtime schema DDL, and a very large ClientPage). Misleading sanitizer helpers create a false "
            "sense of XSS safety. Engagement and OTP endpoints lack abuse controls. Completing newsletter "
            "persistence and unifying authorization helpers would reduce both security and operational risk.",
            styles["BodyJustify"],
        )
    )

    story.append(Paragraph("9. Recommended Next Steps", styles["SectionHeading"]))
    next_steps = [
        "Patch Critical and High security items first (categories, debug, XSS sanitization, rate limits, JWT-role checks, uploads).",
        "Add automated authorization tests for every mutating API route.",
        "Implement TipTap-compatible server-side HTML sanitization without changing the editor toolbar.",
        "Design and ship a secure NewsletterSubscriber API before activating the public form.",
        "Run dependency vulnerability scanning (npm audit / Dependabot) on a recurring schedule.",
        "Re-test after remediation and update this document’s status column in a follow-up revision.",
    ]
    items = [
        ListItem(Paragraph(t, styles["BulletBody"]), leftIndent=12, bulletColor=colors.HexColor("#7a1216"))
        for t in next_steps
    ]
    story.append(ListFlowable(items, bulletType="1", start=1, leftIndent=20))

    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "— End of Report —",
            ParagraphStyle(
                "EndNote",
                parent=styles["CoverSubtitle"],
                fontName="Helvetica-Oblique",
                textColor=colors.HexColor("#666666"),
            ),
        )
    )

    doc.build(story)
    return OUTPUT_PATH


if __name__ == "__main__":
    out = build_document()
    print(f"Wrote: {out}")
