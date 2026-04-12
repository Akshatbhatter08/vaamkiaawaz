# Vaam Ki Aawaz - Comprehensive Implementation Plan

This document outlines the approach to address all 15 feature requests comprehensively. The changes span across UI configuration, CSS modeling, state structure, backend APIs, and Database models.

## User Review Required
> [!IMPORTANT]
> The OTP authentication (Request 4) requires sending emails. Do you have an existing SMTP service (like SendGrid, Resend, or Google App Password) that you would like me to use? Or should I use an ethereal/simulated email service for now?
> Also, for Request 11 (Multiple Post Photos), would you like the secondary photo to appear somewhere specific in the article, or just in a carousel / gallery format at the top with the first photo?
> For the Rich Text formatting (Request 12), I will integrate `react-quill` which allows true bold, italics, indenting, and exact spaces to be saved natively as HTML in the database without destroying your design system.

## Proposed Changes

### 1-2. UI Styling Modifications (Logo size & Tagline)
- Increase the base `width` and `height` CSS values attached to the `<img src="/vaamki-logo.png" />`.
- Adjust `max-w-2xl` and `leading`-styles for the tagline `<p>` directly beneath the header title to ensure it renders as a single line on desktop devices (removing `max-w-2xl` or widening it).

### 3. Taza Khabare Sorting
- Update the `filteredNews` sorting pattern in `page.tsx`. Current sorting just uses static IDs to map, but we will upgrade it to sort strictly by descending `getPostSortTimestamp()` to strictly ensure chronology.

### 4-5. OTP Authentication & Newsletter Form
- **Schema Update:** Expand `User` model to handle OTP secrets/verifications and add a `NewsletterSubscriber` model with `name`, `email`, and `phone`.
- **Backend:** Create new OTP APIs (e.g. `/api/auth/otp/send` and `/api/auth/otp/verify`).
- **Frontend:** Implement OTP modals for account creation and newsletter subscription to replace the direct action submissions.

### 6. Breaking News Ticker
- Dynamically inject the titles of `filteredNews.slice(0, 5)` into the `<div className="ticker-move">` instead of the static hardcoded strings.

### 7. Nav Menu Tab Sorting
- Rearrange `navTabs` in `page.tsx` directly to strictly follow: Home, Taza khabre, Blog, Newsletter, Categories, Parichay.

### 8. Sabse Zyada Padhi Gayi (Most Read)
- Convert the static string array into a dynamically sorted array capturing all posts and ranking by clicks: `const topReadPosts = [...allAvailablePosts].sort((a, b) => getPostClicks(b) - getPostClicks(a)).slice(0, 4);`

### 9. Abhiyan Calendar
- **Schema Update:** Add `AbhiyanEvent` model with `title`, `date`, `time`, `description`.
- **Backend APIs:** `/api/events` (GET, POST, DELETE). Only Admins/Master can POST/DELETE.
- **Frontend:** Interactive list of events that expand via a modal to show `description`, replacing the hardcoded calendar items.

### 10. Title Change
- Change the static string "ब्लॉग पोस्ट" to "समाचार" (Samachar) inside `page.tsx`.

### 11. Multiple Post Photos
- **Schema Update:** Update `BlogPost` schema to add `postImage2 String?` (or JSON array).
- **Frontend:** Update the upload form to support multiple selections, and render the second photo below the main image or inside the text body.

### 12. Rich Text Formatting Maintenance
- Instead of using `<textarea>`, we will install `react-quill` to wrap the content form, allowing true WYSIWYG editing. This will natively output stylized HTML strings.

### 13. PDF Print functionality
- Add a new "Print to PDF" button alongside Facebook/WhatsApp share.
- Build a hidden `@media print` layout that enforces an A4 dimension, drops in the pre-defined `<header>` containing the horizontal logo, date, and author, while suppressing all other UI bounds.

### 14. Signature Footers
- Parse `activePost.author` mapping or ensure the current upload session captures the *actual logged-in user admin name* regardless of the "Author" selected from dropdown, outputting it discretely at the base of the article. Let me know if you want the "Selected Author" vs "LoggedIn Uploader" tracked distinctly.

### 15. Form Reordering
- Move the native <button> "ब्लॉग प्रकाशित करें" below the `<textarea>` boxes for natural flow.

## Verification Plan
1. Validate Backend mapping migrations:
    - Reset dev servers and seed `npx prisma db push`.
2. Inspect layouts:
    - Logo scale. Tagline string limit bounds. Sorting mechanisms validation.
3. Validate feature completeness:
    - Live-test article print-to-pdf styling, dummy OTP routing, rich text editor behavior, and photo uploads.
