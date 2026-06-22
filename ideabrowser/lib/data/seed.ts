import type { Idea } from "@/lib/types";

// Bundled seed ideas so the app is fully browsable before Supabase or an
// Anthropic key are configured. Once the AI pipeline runs, generated ideas are
// stored in the database and take precedence.

const today = new Date().toISOString().slice(0, 10);

export const SEED_IDEAS: Idea[] = [
  {
    slug: "inboxzero-for-contractors",
    title: "InboxZero for Contractors",
    one_liner:
      "An AI front desk that turns a contractor's missed calls and texts into booked, paid jobs.",
    category: "Vertical SaaS",
    status: "published",
    featured_date: today,
    created_by_ai: false,
    created_at: new Date().toISOString(),
    scores: {
      opportunity: 9,
      problem_severity: 8,
      feasibility: 7,
      timing: 9,
      revenue_potential: 8,
      overall: 8,
    },
    signals: [
      { source: "reddit", metric: "Reddit discussion", value: "14 threads · 380 comments", detail: "r/Contractor, r/HVAC — 'I lose jobs because I can't answer the phone on a roof'" },
      { source: "trends", metric: "Related searches", value: "rising", detail: "ai receptionist for contractors, missed call text back" },
    ],
    sections: [
      { type: "summary", title: "Summary", content: "Home-services contractors (HVAC, plumbing, roofing, electrical) miss **20-30% of inbound calls** because they're on a job site. Every missed call is a $300-$5,000 job that goes to whoever answers next.\n\nInboxZero for Contractors is an AI voice + SMS agent that answers every call, qualifies the lead, quotes ballpark pricing, and books the job straight into the contractor's calendar — then follows up until they pay.\n\nThis is a wedge into the $600B+ home-services market that incumbents (ServiceTitan, Jobber) treat as an afterthought." },
      { type: "why_now", title: "Why Now", content: "- Voice AI finally sounds human and runs at ~$0.05/min.\n- Contractors already live in SMS; **'missed-call text-back'** is a proven behavior.\n- Labor shortage means owner-operators are on tools, not phones, more than ever." },
      { type: "proof_signals", title: "Proof Signals", content: "- Reddit threads in r/Contractor and r/HVAC repeatedly cite lost jobs from missed calls.\n- Existing 'missed call text back' tools (a dumb version of this) already charge $99-$300/mo and have thousands of users.\n- Local SEO agencies upsell 'answering service' as a $500/mo add-on." },
      { type: "market_gap", title: "Market Gap", content: "ServiceTitan is too heavy and expensive for the 1-10 truck shops that make up the **long tail**. Generic AI receptionists (e.g. for dentists) don't understand trade-specific qualification ('what's the SEER rating', 'is it a slab leak'). The gap is a trade-native agent priced for a solo operator." },
      { type: "value_ladder", title: "Value Ladder", content: "| Tier | Price | What they get |\n|---|---|---|\n| Free trial | $0 | 25 AI-handled calls |\n| Starter | $149/mo | Unlimited SMS, 1 number, calendar booking |\n| Pro | $349/mo | Voice AI, quoting, review requests, CRM sync |\n| Done-for-you | $1,000 setup | We configure scripts + integrations |" },
      { type: "value_equation", title: "Value Equation", content: "- **Dream outcome:** never lose a job to a missed call again.\n- **Perceived likelihood:** high — they can hear the AI book a test job in 5 minutes.\n- **Time delay:** value on day one.\n- **Effort/sacrifice:** near-zero — forward your number, done." },
      { type: "value_matrix", title: "Value Matrix", content: "| | InboxZero | ServiceTitan | Human answering svc |\n|---|---|---|---|\n| Price | $$ | $$$$ | $$$ |\n| Trade-aware | ✅ | ✅ | ❌ |\n| 24/7 | ✅ | ❌ | ✅ |\n| Books + quotes | ✅ | ✅ | ❌ |" },
      { type: "acp", title: "Audience · Community · Product", content: "- **Audience:** 1-10 truck home-services operators.\n- **Community:** trade Facebook groups, r/Contractor, local supply houses, trade TikTok.\n- **Product wedge:** missed-call text-back → full AI receptionist." },
      { type: "execution_plan", title: "Execution Plan", content: "1. **Days 0-30:** build SMS missed-call text-back on Twilio + a booking link. Land 5 design partners.\n2. **Days 30-60:** add voice AI (Vapi/Retell) with a trade-qualification script. Charge $149/mo.\n3. **Days 60-90:** calendar + CRM integrations, review requests. Hire a part-time onboarding specialist.\n\n**Budget:** ~$3-5k (telephony + voice AI credits + landing page)." },
      { type: "community_signals", title: "Community Signals", content: "- r/Contractor, r/HVAC, r/Plumbing\n- 'Contractor' Facebook groups (100k+ members)\n- Trade TikTok / YouTube (e.g. HVAC influencers)\n- Local supply-house counters (offline distribution)" },
      { type: "keywords", title: "Keywords", content: "| Keyword | Intent | Competition |\n|---|---|---|\n| ai receptionist for contractors | high | low |\n| missed call text back | high | medium |\n| answering service hvac | high | medium |\n| contractor scheduling software | medium | high |" },
    ],
  },
  {
    slug: "compliance-copilot-for-clinics",
    title: "Compliance Copilot for Clinics",
    one_liner:
      "An always-on assistant that keeps small medical clinics audit-ready for HIPAA and OSHA.",
    category: "Healthcare",
    status: "published",
    featured_date: null,
    created_by_ai: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    scores: {
      opportunity: 8,
      problem_severity: 9,
      feasibility: 6,
      timing: 7,
      revenue_potential: 8,
      overall: 7,
    },
    signals: [
      { source: "reddit", metric: "Reddit discussion", value: "9 threads · 210 comments", detail: "r/healthIT — 'our HIPAA binder is a mess and the auditor is coming'" },
    ],
    sections: [
      { type: "summary", title: "Summary", content: "Independent clinics, dental offices, and therapy practices are legally required to maintain HIPAA and OSHA compliance but have **no compliance officer**. They cobble together binders, expired trainings, and forgotten risk assessments — then panic before an audit.\n\nCompliance Copilot turns this into a guided, always-current system: it tracks required policies, schedules staff trainings, runs the annual risk assessment, and produces an audit-ready packet on demand." },
      { type: "why_now", title: "Why Now", content: "- OCR HIPAA enforcement and fines are rising.\n- LLMs can now read regulations and map them to a clinic's actual setup.\n- Cyber-insurance now *requires* documented compliance, creating a hard deadline." },
      { type: "proof_signals", title: "Proof Signals", content: "- r/healthIT and r/dentistry threads about audit panic and messy binders.\n- Existing compliance tools (Compliancy Group) charge $200-$500/mo and are clunky.\n- Cyber-insurers demanding proof of HIPAA controls before renewal." },
      { type: "market_gap", title: "Market Gap", content: "Enterprise GRC tools (Vanta, Drata) target software companies, not clinics. Legacy healthcare-compliance tools are checklist PDFs with a consultant attached. Nobody offers an **AI-native, clinic-sized** product that does the work, not just tracks it." },
      { type: "value_ladder", title: "Value Ladder", content: "| Tier | Price | What they get |\n|---|---|---|\n| Free scan | $0 | Gap report on current compliance |\n| Solo | $199/mo | Policies, training tracking, risk assessment |\n| Practice | $399/mo | Multi-location, audit packet, BAA tracking |\n| Concierge | $2,500/yr | Human review + mock audit |" },
      { type: "value_equation", title: "Value Equation", content: "- **Dream outcome:** pass an audit without panic; keep your insurance.\n- **Perceived likelihood:** high — show a generated audit packet.\n- **Time delay:** instant gap report.\n- **Effort:** answer a guided intake once." },
      { type: "value_matrix", title: "Value Matrix", content: "| | Copilot | Compliancy Group | Consultant |\n|---|---|---|---|\n| Price | $$ | $$$ | $$$$ |\n| AI-native | ✅ | ❌ | ❌ |\n| Audit packet | ✅ | ✅ | ✅ |\n| Self-serve | ✅ | partial | ❌ |" },
      { type: "acp", title: "Audience · Community · Product", content: "- **Audience:** office managers at <10-provider clinics.\n- **Community:** r/healthIT, r/dentistry, MGMA chapters, practice-management Facebook groups.\n- **Product wedge:** free compliance gap scan." },
      { type: "execution_plan", title: "Execution Plan", content: "1. **Days 0-30:** build the free HIPAA gap-scan intake + report. Recruit 5 clinics.\n2. **Days 30-60:** policy generation + training tracker. Charge $199/mo.\n3. **Days 60-90:** audit-packet export + BAA tracking. Partner with a cyber-insurer for distribution.\n\n**Budget:** ~$4-6k; key risk is regulatory accuracy — keep a compliance advisor on retainer." },
      { type: "community_signals", title: "Community Signals", content: "- r/healthIT, r/dentistry, r/therapists\n- MGMA (Medical Group Management Association) chapters\n- Practice-management Facebook groups\n- Cyber-insurance broker networks" },
      { type: "keywords", title: "Keywords", content: "| Keyword | Intent | Competition |\n|---|---|---|\n| hipaa compliance software small practice | high | medium |\n| osha compliance dental office | high | low |\n| hipaa risk assessment tool | high | medium |\n| clinic compliance checklist | medium | low |" },
    ],
  },
];
