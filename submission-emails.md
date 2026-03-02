# Swans Hackathon Submission Emails

---

## Email 1 — To "Andrew Richards" (Client Delivery Email)

**To:** talent.legal-engineer.hackathon.client-email@swans.co
**From:** ishaqibrahimm1000@gmail.com
**Subject:** Your Intake Automation is Live — Police Reports to Signed Retainers in Under 2 Minutes

---

Hi Andrew,

Great news — your intake automation is built, tested, and ready for your team to use.

I know the core issue: by the time your paralegals manually read through a police report and type everything into Clio, the potential client has already called another firm. That bottleneck is gone now.

### What the System Does

Your team uploads a police report PDF and the system handles everything from there:

1. **AI Extraction** — Reads the full police report (even messy scanned MV-104AN forms) and pulls out every critical field: client info, adverse party, accident details, injuries, witness names, report metadata — all in seconds.

2. **Human Verification** — Your paralegal sees the extracted data side-by-side with the original PDF. They can correct anything before it goes into Clio. No data enters the system without your team's sign-off.

3. **One-Click Processing** — Once verified, a single click triggers the full pipeline:
   - All custom fields are populated in the Clio Matter
   - The matter stage advances to "Retainer Ready," which triggers Clio's document automation
   - The **Retainer Agreement is generated automatically** using Clio's merge fields and conditional logic — pre-filled with the client name, defendant, accident date, location, injuries, and the correct legal language based on the case type
   - The **Statute of Limitations is calendared** 8 years out on the Responsible Attorney's calendar in Clio, with a 6-month warning reminder
   - A **personalized email** goes out to the potential client referencing their specific accident, with the retainer PDF attached and a link to book a consultation (the link automatically switches between your in-office and virtual scheduling pages depending on the season)

4. **AI Case Viability Scoring** — As a bonus, every case gets an instant viability score (0-100) based on liability clarity, injury severity, defendant profile, evidence quality, and SOL status. This helps your team prioritize high-value cases immediately, before the first attorney call.

### What This Means for Your Firm

- **Speed-to-lead**: What used to take 45+ minutes of manual work now takes under 2 minutes. You're the first firm to get back to the client with a professional retainer agreement.
- **Zero manual data entry**: No more reading through scanned PDFs and retyping fields into Clio.
- **No missed deadlines**: SOL dates are automatically tracked — your attorneys get calendar reminders without lifting a finger.
- **Scales with volume**: Whether your team processes 5 cases a day or 50, the system handles it the same way.

### Try It Now

Here's your live dashboard: **https://richards-law-intake-psi.vercel.app/**

Click any of the demo cases (including Reyes v. Francois) to see the full flow, or upload a new police report PDF to test it yourself.

I also recorded a short walkthrough showing the full system in action — I'll share that with you ahead of our meeting so you can review it on your own time.

### Next Steps

I'd love to walk you through the system live and get your feedback. Are you available **next Friday at 10:00 AM EST**? I can do a 30-minute screen share to cover the full workflow and answer any questions from your team.

In the meantime, feel free to run a few reports through it — the more you test, the better feedback we'll have to discuss.

Looking forward to hearing your thoughts, Andrew.

Best,
Khalifa Ibrahim
Legal Engineer @ Swans

---
---

## Email 2 — To Swans Team (Technical Submission)

**To:** talent.legal-engineer.hackathon.submission-email@swans.co
**From:** ishaqibrahimm1000@gmail.com
**Subject:** Legal Engineer Hackathon Submission - Khalifa Ibrahim

---

Hi Swans Team,

Please find my hackathon submission below.

### Video Walkthrough (Screen + Webcam)

**[VIDEO LINK — INSERT LOOM/GOOGLE DRIVE LINK HERE]**

The video covers:
- Full end-to-end flow: PDF upload, AI extraction, human verification, one-click Clio pipeline
- Architecture breakdown: Next.js frontend, Claude Sonnet 4 extraction, Make.com/direct Clio API dual-path processing, Clio document automation for retainer generation
- Issues encountered (Clio API quirks with custom field value IDs, Make.com URL-encoding curly braces, webhook boolean type mismatches, note creation requiring dedicated module instead of raw API call) and how each was resolved
- Assumptions made (added multi-report-type support beyond vehicle accidents, built AI viability scoring as a value-add, implemented follow-up task creation in Clio)
- Post-deployment implications: scaling to additional case types, firm-wide analytics dashboard for intake volume and conversion tracking, potential integration with court filing systems

### Automation Blueprint

**[ATTACH: Make.com scenario JSON export]**

The Make.com scenario includes two routes:
- **Route 1 (auto-create)**: Creates a new Contact + Matter in Clio, then runs the full pipeline
- **Route 2 (existing matter)**: Updates an existing Matter's custom fields, stages, calendar entries, and sends the client email

### Live App Link

**https://richards-law-intake-psi.vercel.app/**

The app is deployed on Vercel and ready for testing. You can:
- Click any demo case or upload any police report PDF from the provided folder
- The system handles MV-104AN vehicle accident reports, slip and fall, assault, dog bite, and general incident reports
- The Reyes v. Francois case is included as a one-click demo

### Technical Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| AI Extraction | Claude Sonnet 4 (Anthropic API) with structured JSON output |
| Case Management | Clio Manage API v4 (custom fields, stages, calendar, doc automation, tasks) |
| Automation | Make.com (webhook-driven, 8-module Clio pipeline) |
| Retainer Generation | Clio Document Automation (merge fields + conditional logic) |
| Email | Personalized with accident details, retainer PDF, seasonal Calendly routing |
| Deployment | Vercel (serverless functions, 120s timeout for extraction) |
| Scoring | Deterministic viability engine (AIS injury scale, liability benchmarks, NY CPLR) |

### Key Architectural Decisions

1. **Dual processing path**: Make.com webhook (primary) with direct Clio API fallback — ensures the system works even if one integration is down
2. **Human-in-the-loop verification**: AI extracts, human approves — critical for legal data accuracy
3. **Deterministic scoring**: Viability scores use data tables (not LLM inference) for reproducibility and auditability
4. **Multi-report-type support**: The extraction prompt and conditional logic handle 5 case types, not just vehicle accidents — this is a production consideration since firms handle diverse caseloads
5. **Retainer via Clio doc automation**: As required, the retainer is generated natively in Clio using merge fields and conditional paragraphs, not externally

Thank you for the opportunity. Happy to discuss any aspect of the build in more detail.

Best,
Khalifa Ibrahim
