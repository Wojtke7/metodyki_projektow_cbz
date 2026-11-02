# Frontend Technology Stack

## Frontend requirements

The frontend is expected to:

- Run as a website on a desktop browser and as an installable app on a phone, from one codebase.
- Accept pasted document text, and accept a photograph or supported file (including drag and drop on desktop).
- Call the API described in [backend.md](backend.md) to obtain a plain-language explanation, source passages, possible actions, and deadlines.
- Show loading, error, and retry states while analysis runs, including on a weak connection.
- Support older people and people with disabilities: text that follows system settings, high contrast, keyboard use, screen readers, and reading content aloud.
- Avoid keeping original documents or images on the device after processing.

## Options compared

The options below are compared on cost and ease of use.

### React + Vite as a Progressive Web App (PWA)

- **Cost:** No framework licence fee and no store registration fee. Hosting is a static site plus the API hosting already required by the backend. `vite-plugin-pwa` adds the web app manifest and service worker.
- **Ease of use:** High for a web interface. Vite is a small setup with fast hot reload. One build serves desktop and phone. A phone user can open the site or install it to the home screen. The browser already provides text scaling, `forced-colors` and `prefers-contrast`, screen readers, and speech synthesis.

### React Native (Expo)

- **Cost:** No framework licence fee. Release through Apple and Google requires their developer-program registration fees and a store review for each release. API hosting remains a separate cost.
- **Ease of use:** Medium. One codebase can target iOS and Android, but a desktop website is a separate surface. Store review delays each release. Camera, files, and accessibility go through native modules instead of the browser features this product needs.

### Separate native iOS and Android applications

- **Cost:** No platform licence fee, but two codebases, store registration fees, and store review. This is the highest build and maintenance cost of the three. A desktop website would still be required.
- **Ease of use:** Low for the current scope. Each platform needs its own interface, accessibility work, camera integration, and release process.

### Cost notes

None of the three options has a framework licence fee. The cost difference is distribution and maintenance. A PWA has no store fee and one web codebase. Native distribution adds store registration fees, review time, and more release work. Store fees change; confirm the current Apple and Google fees before any native release. Hosting, OCR, and AI costs are the same ones left open in [backend.md](backend.md). No hosting estimate is given here because the deployment model is not chosen yet.

## Proposed choice: React + Vite PWA

A React PWA built with Vite is the recommended frontend for the initial version, consistent with the project notes.

- **One surface:** The same application is a normal website on desktop and an installed app on a phone. There is no App Store or Google Play review, so a fix can ship as soon as it is deployed.
- **Browser accessibility:** The browser already scales text with system settings, honours `forced-colors` and `prefers-contrast`, and exposes the page to screen readers. Those capabilities matter for older people and for WCAG.
- **Fast UI work:** Vite provides hot reload. Tailwind CSS supports the font-size and high-contrast switches. shadcn/ui, built on Radix UI, supplies components with WAI-ARIA behaviour, visible focus, and keyboard support.
- **No paid speech service:** The Web Speech API (`speechSynthesis`) reads a summary aloud in the browser. The product does not need a separate cloud text-to-speech provider.
- **Camera and files in the browser:** An HTML file input with `capture="environment"` asks a phone browser for the rear camera. On desktop, the same flow is a file picker or drag and drop.
- **API calls:** TanStack Query loads interpretation results and exposes loading, error, and retry states.
- **Cost:** React, Vite, Tailwind CSS, Radix UI, Lucide, and TanStack Query are open source. Store fees do not apply.

React Native remains a reasonable alternative if the product later needs capabilities a browser cannot provide. Separate native applications are not recommended for the first version. The web client would still be needed for desktop, and two extra codebases would slow delivery.

## Team skills

Confirm practical experience with React, Vite, and Tailwind CSS before implementation starts. The first version does not require iOS or Android release skills. Accessibility still needs practice: keyboard behaviour, screen-reader labels, contrast, and testing with assistive technologies.

## Proposed frontend components

| Concern | Proposed technology | Reason |
|---|---|---|
| UI framework and build | React + Vite | One web codebase, a small setup, and fast hot reload during development. |
| Install and offline shell | `vite-plugin-pwa` | Generate the web app manifest and a service worker so the app can be installed on a phone. Precache the application shell only. |
| Components and styling | Tailwind CSS + shadcn/ui (Radix UI) | Radix primitives provide WAI-ARIA roles, focus handling, and keyboard behaviour. Tailwind is used for type scale and high-contrast presentation. shadcn/ui components are copied into the repository so they can be adjusted. |
| Icons | Lucide React | Simple SVG icons. Decorative icons are hidden from screen readers; icons that carry meaning get an accessible name. |
| Read aloud | Web Speech API (`speechSynthesis`) | Browser speech for a summary, without a paid cloud text-to-speech service. Start speech from a user action. |
| Camera and files | HTML file input with `capture="environment"`, plus drag and drop | On a phone, `capture="environment"` requests the rear camera for a document photo. On desktop, the user picks a file or drops a PDF or scan. |
| Server state | TanStack Query | Submit text or a file, then load job status from the API. Use it for pending, error, retry, and skeleton or spinner states when the connection is weak. |

Analysis can take longer than one HTTP request. The API is expected to return a job identifier and status, as described in [backend.md](backend.md). The client should submit the input, then poll that status with TanStack Query, and must not hold one request open until analysis finishes.

The product catalog ranks some of this work above the first release. Large text and read-aloud are **Should**. High contrast, photo or scan upload, and calendar reminders are **Could**. The stack above can support them without a second client.

Build and type checks for this client are the frontend CI job in [ci-cd.md](ci-cd.md): `npm ci`, lint, type-check, and production build on every pull request.

## Accessibility behaviour

These behaviours apply to the chosen stack:

1. **Text size:** Use relative sizes so browser and system text settings can scale the page. Add an in-app text-size switch for the large-text mode in the product catalog.
2. **Contrast:** Honour `prefers-contrast` and `forced-colors`. Add an in-app high-contrast switch that does not depend on the user finding system settings.
3. **Keyboard and focus:** Interactive controls must be reachable and visible by keyboard. Use the Radix focus behaviour already provided by shadcn/ui, and do not remove focus outlines.
4. **Screen readers:** Use semantic structure and the WAI-ARIA behaviour of the Radix primitives. Do not convey state by colour alone. Hide decorative icons from assistive technologies.
5. **Read aloud:** Provide a control that speaks the summary with `speechSynthesis`. Do not autoplay speech.
6. **Verification:** Test with keyboard-only use, a screen reader, forced colours, and magnified text. Check the result against WCAG guidance as the interface grows. The README states the same goal.

## Data handling and safety requirements

These requirements apply regardless of framework:

1. **Do not store originals on the device:** Do not write uploaded files, photos, or document text to `localStorage`, `IndexedDB`, or the service worker cache. Cache the application shell only.
2. **Drop temporary previews:** Revoke object URLs created for a local preview after upload, cancel, or failure.
3. **Keep content out of client logs:** Do not write document text, file contents, or AI output to the browser console or to error reports.
4. **Limit the query cache:** Keep TanStack Query results only for the active visit. Do not persist that cache across visits.
5. **Ask for the camera only on action:** Open the camera from the photograph control. Do not request the camera when the page loads.
6. **Use HTTPS:** The installed PWA and any camera access require a secure context in deployment.
7. **Treat speech as a disclosure:** `speechSynthesis` uses the browser or operating-system voice. Do not add a separate cloud speech provider. For each supported browser, check whether the selected voice stays on the device or is processed by the browser vendor. If text can leave the device, say so in the privacy notice.
8. **Set expectations:** Show that generated explanations can be wrong and are not legal advice. Show the relevant original passage next to an explanation where the API provides it.
9. **Do not send documents before review:** Do not call an external AI path from the client until the provider terms are accepted, as described in [backend.md](backend.md). The client talks to the project API, not directly to an AI vendor.
