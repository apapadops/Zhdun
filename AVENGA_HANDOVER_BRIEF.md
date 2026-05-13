# Betano AI Initiatives Pipeline — Handover Brief for Avenga

**Document type:** First-Line Support Reference Guide  
**Prepared by:** Betano AI & Transformation Team  
**Audience:** Avenga Support Team  
**Status:** Pilot Phase — May 2026

---

## 1. Executive Overview

### What is the Betano AI Initiatives Pipeline?

Betano has built an internal tool called **Zhdun** — a unified intake portal for teams across the organisation to submit requests for AI initiatives and process optimisation projects.

Instead of filling out a static form, requestors have a **guided conversational experience**: they chat with an AI assistant that asks the right questions, captures all the necessary information, and automatically categorises the request before it reaches the assessment team.

The tool serves two types of requests:

| Type | Description | Example |
|---|---|---|
| **AI Initiative** | Deploying an AI/LLM tool or building an AI-powered workflow | "I want to use Claude to auto-summarise customer complaints before our agents read them" |
| **Optimisation Project** | Automating or streamlining an existing manual process | "Our compliance team manually inputs data from emails into spreadsheets — 3 hrs/day" |
| **Hybrid** | A project with a significant AI component | Process automation that uses an LLM for document parsing |

### Why it Exists

Betano operates across multiple markets (Malta, Bulgaria, Romania, Czech Republic, UK, Germany, Denmark, Brazil, Mexico, Argentina) and has a growing number of teams looking to leverage AI and automation. The pipeline ensures:

- Every initiative is captured consistently regardless of who submits it
- Each request is automatically scored and categorised so the right people review it
- Nothing falls through the cracks — every submission enters a managed pipeline with clear statuses
- The AI/Transformation team can prioritise and decide efficiently

### Current Status

The pipeline is **live and in active use**. Betano is rolling out the tool organisation-wide across all markets and business units. The volume of submissions is expected to be high and to grow rapidly as adoption increases. Avenga's support is needed **immediately** to cover the operational demands of this rollout.

---

## 2. Goals & Avenga's Engagement Scope

This section directly addresses what Avenga needs to prepare their proposal and proceedings.

### 2.1 What Betano Is Trying to Achieve

Betano is doing a **company-wide rollout** of the AI Initiatives Pipeline. The tool is built; the challenge now is operational — ensuring that every person who submits a request gets a responsive, high-quality experience from submission through to decision.

Specifically, Betano needs Avenga to:

1. **Absorb the operational load** of supporting requestors across all markets so the internal Betano AI team can focus on assessment and decision-making
2. **Ensure submission quality** — catch incomplete or unclear requests before they reach the Betano team's review queue, reducing back-and-forth
3. **Own requestor communication** throughout the pipeline lifecycle — from first submission to final decision notification
4. **Scale with the rollout** — the support model must be able to handle growing volume as the tool reaches more departments and markets

### 2.2 What Avenga's Proposal Should Cover

Betano expects Avenga's response to address the following:

| Topic | Detail needed |
|---|---|
| **Team structure & capacity** | Who will be on the support team, what seniority, how many FTEs, coverage hours |
| **Tooling & channel recommendation** | How Avenga proposes to manage incoming support requests (ticketing system, Slack, email, etc.) — Betano has not mandated a specific tool |
| **Onboarding plan** | How quickly Avenga can be operational given the pipeline is already live |
| **Quality assurance process** | How Avenga will ensure submission quality before cases reach the Betano review team |
| **Escalation model** | How Avenga proposes to structure escalation to the Betano AI team |
| **Reporting & visibility** | What metrics and reporting Avenga will provide to Betano on a regular basis |

### 2.3 What Is Out of Scope for Avenga

To avoid ambiguity in the proposal:

- Avenga **does not** assess or score submissions
- Avenga **does not** issue GO / HOLD / NO-GO decisions
- Avenga **does not** have authority to override tiers assigned by the system
- Avenga **does not** access or manage the Betano internal admin panel (unless separately agreed)

All assessment and decision-making remains with the **Betano AI & Transformation team**.

### 2.4 Your Perspective & Recommendations — What We Want to Hear from Avenga

Beyond the operational proposal, Betano is genuinely interested in Avenga's own thinking on this type of engagement. We see this as a collaborative relationship, and we expect Avenga's experience from comparable projects to add real value to how we shape and run the pipeline.

As part of your response, we invite Avenga to address the following:

**Experience from similar engagements**
- Have you supported similar AI intake or governance pipelines for other clients? What worked well and what didn't?
- What are the most common failure points you've seen in first-line support models for tech-enabled business processes?
- Are there patterns in how requestors behave (confusion points, drop-off, recurring misunderstandings) that we should anticipate and design around?

**Suggestions on our current setup**
- Based on what you've read in this document, do you see any gaps in how we've structured the intake, tiering, or pipeline process?
- Are there fields we capture that you'd recommend we handle differently, or information we're not capturing that would help triage or support?
- Do you have a view on what a realistic SLA framework should look like for this type of pipeline, given the volume and variety of requests?

**Operational recommendations**
- What tooling and channel setup would you recommend for managing first-line support at the volume we're expecting, and why?
- How would you structure the Avenga team for this engagement — roles, coverage model, escalation internally within Avenga before it reaches the Betano team?
- What reporting cadence and metrics would you propose to give Betano visibility into the health of the support operation?

We are open to challenge and to learning from your expertise. If there are aspects of our approach that you would do differently based on what you've seen work elsewhere, we want to hear it.

---

## 3. How the System Works — End-to-End Flow


```
Requestor opens Zhdun
        │
        ▼
Conversational intake chat
  (AI assistant asks questions,
   requestor answers in natural language
   or via quick-reply buttons)
        │
        ▼
All fields captured → Tier assigned automatically (T1 / T2 / T3)
        │
        ▼
Requestor reviews summary → clicks "Commit to Pipeline"
        │
        ▼
Case created in the pipeline (Status: Pending)
        │
        ▼
Betano AI team reviews, scores, decides
  [GO / HOLD / NO-GO / Needs Info]
        │
        ▼
Requestor notified of outcome
```

The Betano AI & Transformation team operates the pipeline in a **Kanban-style dashboard** with the following status columns:

| Status | Meaning |
|---|---|
| **Pending** | Just submitted, not yet reviewed |
| **In Review** | Betano team is assessing it |
| **Needs Info** | Team needs more detail from the requestor |
| **Accepted** | Approved to proceed (GO verdict) |
| **Rejected** | Not approved (NO-GO or HOLD verdict) |

---

## 4. Information We Capture

Every submission captures a structured set of fields through the conversation. Below is a high-level reference of what is collected.

### 4.1 Fields Captured for Every Submission (All Types)

| Field | What it represents | Example |
|---|---|---|
| **Initiative / Project Title** | Short name for the initiative | "Complaint Triage AI Assistant" |
| **Requestor Name** | Auto-filled from login | Maria Georgiou |
| **Requestor Email** | Auto-filled from login | m.georgiou@betano.com |
| **Requestor Department** | Which department is requesting | Customer Experience |
| **Markets Affected** | Which markets this will impact | Bulgaria, Romania, All Markets |
| **Strategic Driver** | Which Betano strategic pillar this aligns to | Hey Betano (AI Transformation) |
| **Problem Statement** | The pain point or challenge being addressed | "Agents spend 30 min/day manually categorising tickets" |
| **Expected Outcome** | The desired end-state when the initiative is complete | "Tickets pre-categorised before agent sees them, saving 30 min/day/agent" |
| **Deadline** | Business deadline, if any | Q3 2026 |
| **Tier** | Automatically assigned: T1 / T2 / T3 | T2 |

### 4.2 AI Initiative-Specific Fields

Captured when the submission is classified as an **AI Initiative** or **Hybrid**.

| Field | What it represents | Example |
|---|---|---|
| **Initiative Description** | Detailed description of the AI use case | "Use an LLM to read incoming support tickets and output a suggested category and urgency level" |
| **Intended Purpose** | What the AI is being used for | Decision Support, Process Automation |
| **Users Scope** | How many people will use it | Personal Use / Department Use / Enterprise Use |
| **AI Tool** | Which AI platform/tool is proposed | Claude (Anthropic), Gemini, Not Sure |
| **Data Types Involved** | What kind of data the AI will process | Personal / PII, Financial Data, Customer Data |
| **System Integrations** | What internal systems it needs to connect to | Case Management System, Internal Data Lake |
| **Human in the Loop** | Level of human oversight | Always (Final decision by human) / Sometimes |
| **Regulated Process** | Whether the use case touches regulated workflows | Yes (Financial Crime Compliance) / No |
| **Expected Benefits** | Strategic benefits expected (for higher-tier initiatives) | Cost Savings, Efficiency Gain, Risk Mitigation |

### 4.3 Optimisation Project-Specific Fields

Captured when the submission is classified as an **Optimisation Project**.

| Field | What it represents | Example |
|---|---|---|
| **Teams Involved** | Which teams will be affected or involved | Compliance, Operations |
| **Duration** | Estimated project duration | 3–6 months |
| **Monthly Volume** | How many times this process runs per month | 2,000 cases/month |
| **Hours per Case** | How long the manual process takes each time | 1.5 hours |
| **Team Profile** | Seniority level of the people doing the work | Mixed Team, Senior-heavy |
| **Annual Hours** | Auto-calculated: Volume × Hours × 12 | 36,000 hours/year |
| **FTE Saving Estimate** | Auto-calculated savings in full-time-equivalent headcount | 20.9 FTEs |
| **T-shirt Size** | Size of the opportunity (S/M/L/XL) | L (2,000–5,000 hrs/year) |
| **Soft Benefits** | Qualitative benefits beyond cost savings | Improved compliance accuracy, faster turnaround |
| **Implementation Cost** | Estimated cost to build/deploy | €80,000 |
| **Payback Period** | Estimated months to recoup investment | 14 months |

---

## 5. The Tiering System

Every submission is automatically assigned a **tier** during the conversation. The tier determines the level of scrutiny, governance, and stakeholder involvement required.

### 5.1 Tier Definitions

| Tier | Label | Points | What it means |
|---|---|---|---|
| **T3** | Quick Win | 0–7 | Small scope, simple automation, limited data risk, fast to implement. Individual or small team benefit. |
| **T2** | Tactical | 8–14 | Medium scope, department-level impact, some integration complexity, 6–12 month ROI horizon. |
| **T1** | Strategic | 15–20 | High impact, cross-departmental, touches core systems or regulated processes, significant investment or data risk. |

### 5.2 How the Tier is Calculated (Scoring Criteria)

The AI assistant silently accumulates a score (0–20) throughout the conversation based on the requestor's answers. **The requestor never sees this score** — they only see the tier label at the end if they review their submission summary.

The score is driven by two categories of criteria:

**Scope & Complexity**
- External/third-party technology or LLM involved → +4
- Cross-departmental impact → +4
- Enterprise-wide user scope → +3
- Department-level user scope → +2
- Personal/individual use → +1
- More than 100 users in scope → +1

**Risk & Compliance**
- Projected investment or savings exceeding €100k → +3
- Personal / PII data involved → +3
- Financial or regulated data involved → +3
- Integrated with production systems → +2
- Used in a regulated process (AML, KYC, Responsible Gambling) → +2

### 5.3 What Tier Means for Process

| Tier | Typical governance path |
|---|---|
| **T3** | Lighter review, faster track. May go through standard DPO/Security/Architecture sign-offs. |
| **T2** | Standard assessment by Betano AI team. Scored on 6 dimensions. Full pipeline. |
| **T1** | Highest scrutiny. Extended expected-benefits capture during intake. Full scoring. Strategic alignment required. |

---

## 6. Avenga's Role and Responsibilities

### 6.1 What Avenga Does

Avenga acts as **first-line support** for the AI Initiatives Pipeline. This means:

| Responsibility | Detail |
|---|---|
| **Requestor Support** | Be the first point of contact when a requestor needs help — understanding the process, completing their submission, or interpreting a response they received |
| **Quality Check** | Review incoming submissions for completeness and clarity before the Betano AI team picks them up |
| **Ticket Triage & Routing** | Identify the right next action for each case and route it to the appropriate owner |
| **Needs Info Follow-ups** | When the Betano AI team flags a submission as "Needs Info", Avenga contacts the requestor, explains what's missing, and ensures they provide it |
| **Status Communication** | Handle inbound "where is my request?" questions and provide accurate, up-to-date status responses |

### 6.2 What Avenga Does NOT Do

The following are strictly owned by the **Betano AI & Transformation team**:

- **Scoring submissions** — the 6-dimension assessment scoring (problem clarity, benefit quality, strategic alignment, feasibility, urgency, data quality) is done by Betano internally
- **Making GO / HOLD / NO-GO decisions** — all verdicts are issued by the Betano team
- **Changing case statuses** in the pipeline (unless explicitly granted permission)
- **Interpreting or overriding the tier** assigned by the system

If a requestor challenges a tier or a decision outcome, Avenga should acknowledge, log the concern, and **escalate to the Betano AI team**.

---

## 7. Common Support Scenarios

### Scenario 1: "What tier am I? Why was I assigned T2 / T1 / T3?"

**Context:** Requestors sometimes see their tier label and want to understand what it means or why they received it.

**How to handle:**
1. Explain the tier meaning using the table in Section 5.1
2. Explain that the tier is calculated automatically based on the scope, data risk, and estimated impact of the initiative — not a quality judgement
3. If they feel it's wrong, log the concern and escalate to the Betano AI team. Do not reassign or override the tier yourself.

**Key messages to use:**
- "T3 (Quick Win) means your initiative is scoped as a smaller, faster-to-implement project — it's not a reflection of its importance."
- "T1 (Strategic) means your initiative has cross-departmental impact or touches regulated data, so it requires a more thorough review."

---

### Scenario 2: "Needs Info" Follow-up

**Context:** The Betano AI team has reviewed a submission and flagged it as needing more detail. The case status will show "Needs Info" and there will be a note explaining what's missing.

**How to handle:**
1. Locate the specific information gap noted by the Betano team
2. Contact the requestor (email or Slack) and explain what's needed in plain language
3. Help them understand why the information is important (don't just relay the raw note)
4. Once they provide the additional detail, ensure it's added to the case and flag to the Betano team that it's ready for re-review
5. Set a follow-up reminder — if no response in [SLA TBD], escalate

**Common Needs Info reasons:**
- Expected outcome is too vague ("improve efficiency" → needs specific, measurable target)
- Missing volume or frequency data for optimisation projects
- Unclear which markets are actually affected
- Data types not specified clearly (e.g., "customer data" — is it PII?)

---

### Scenario 3: AI Policy / Tool Questions

**Context:** Requestors often have questions like "Can I use ChatGPT?" or "Is Claude approved at Betano?" or "Do I need DPO approval?"

**How to handle:**
- For questions about **approved AI tools**: The tool options available in the intake form reflect what's recognised at Betano: Claude (Anthropic), Gemini, Google AI Studio. If a requestor mentions a tool not on this list, flag it as "Not Sure" and escalate
- For questions about **data protection approval**: Explain that the pipeline will surface the relevant governance steps (DPO review, Security, Architecture) based on what data types and integrations are involved. The system handles this automatically based on the tier and data fields
- For questions about **what is/isn't allowed**: Escalate to the Betano AI team — do not make policy statements

---

### Scenario 4: Status Inquiries — "Where is my request?"

**Context:** Requestors want to know what stage their submission is at.

**How to handle:**
1. Check the pipeline dashboard for the case status
2. Provide a clear, human-readable status update using the table below

| Pipeline Status | What to tell the requestor |
|---|---|
| **Pending** | "Your submission is in the queue. The Betano AI team will pick it up shortly." |
| **In Review** | "Your submission is currently being assessed by the Betano AI team." |
| **Needs Info** | "The team has reviewed your submission and needs some additional information. [See Scenario 2]" |
| **Accepted** | "Great news — your initiative has been approved (GO verdict). The Betano AI team will be in touch with next steps." |
| **Rejected** | "The team has reviewed your submission and it has not been approved at this time. A reason will have been provided — let me share that with you." |

- Do not speculate on timelines beyond what the pipeline shows
- If a submission has been "Pending" for more than [SLA TBD], escalate to the Betano AI team

---

## 8. Escalation Path

When Avenga cannot resolve a query independently, escalate to the **Betano AI & Transformation team**.

| Contact | Role | Escalate when |
|---|---|---|
| *(TBD — Betano to provide)* | AI Team Lead | Tier challenges, decision disputes, policy questions |
| *(TBD — Betano to provide)* | Pipeline Owner | Operational issues, access problems, urgent cases |

> **Note:** SLAs between Avenga and the Betano AI team are yet to be formally defined. This is a known gap to be addressed before full production rollout.

---

## 9. Key Concepts & Glossary

| Term | Definition |
|---|---|
| **Zhdun** | Internal name for the AI Initiatives Pipeline tool |
| **Intake / Intake Wizard** | The conversational chat form that captures submission details |
| **Case** | A single submission in the pipeline |
| **Tier** | Automatically assigned category: T1 (Strategic), T2 (Tactical), T3 (Quick Win) |
| **Tier Score** | Hidden 0–20 score calculated by the AI during the conversation |
| **Pipeline** | The end-to-end workflow from submission to decision |
| **GO / HOLD / NO-GO** | The three decision outcomes issued by the Betano AI team |
| **Needs Info** | Pipeline status meaning the team needs more detail before deciding |
| **T-shirt Size** | Rough sizing of an optimisation project by annual hours saved: S (<500h), M (500–2000h), L (2000–5000h), XL (>5000h) |
| **FTE Saving** | Full-time-equivalent headcount that could be freed up by automating a process |
| **DPO** | Data Protection Officer — required approval for initiatives involving personal data |
| **Human in the Loop** | Whether a human reviews or approves AI outputs before they take effect |
| **Hey Betano** | Betano strategic pillar: AI Transformation |
| **Shield Betano** | Betano strategic pillar: Risk & Governance |
| **Betano Republic** | Betano strategic pillar: Market Expansion |
| **Core Betano** | Betano strategic pillar: Operational Excellence |
| **PII** | Personally Identifiable Information |
| **AML / KYC** | Anti-Money Laundering / Know Your Customer — regulated compliance processes |

---

## 10. What Makes a Strong vs. Weak Submission

This context helps Avenga guide requestors who need help improving their submissions or understanding why the team requested more information.

| Dimension | Weak Example | Strong Example |
|---|---|---|
| **Problem Statement** | "We have inefficiencies in our process" | "Our compliance team manually reviews 400 emails/day to extract transaction data, taking 2 hrs per person" |
| **Expected Outcome** | "Improve efficiency" | "Reduce manual review time by 80%, freeing 1.6 FTEs for higher-value work" |
| **Strategic Alignment** | Not specified | Clearly mapped to a Betano strategic driver (e.g., Core Betano / Operational Excellence) |
| **Data Clarity** | "We use some data" | "We process customer transaction records — financial data, no PII beyond account IDs" |
| **Market Scope** | "Various markets" | "Bulgaria and Romania initially, with planned expansion to Czech Republic in Q4" |

---

*This document reflects the system as of the pilot phase. It will be updated as the pipeline evolves and SLAs are formalised.*
