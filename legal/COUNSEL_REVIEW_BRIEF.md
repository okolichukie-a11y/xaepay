# XaePay — Counsel Review Brief

**Prepared for:** [Counsel name]
**Prepared by:** Okoli Chukie (okoli.chukie@gmail.com), XaeccoX Inc.
**Subject:** Pre-launch legal review of the XaePay platform's customer-facing legal documents and one B2B contract template.

---

## 1. What we need from counsel

Five documents need review before XaePay opens to real users. They are drafted, technically functional, and operationally accurate, but **have not been reviewed by an attorney.** We are asking you to:

1. Confirm that the framing of XaePay as a software platform (not a regulated financial institution) is legally defensible given its operations as described in §3 below.
2. Verify jurisdictional fit — XaePay is a Delaware corporation, its primary user base is in Nigeria, and it does not transmit, custody, or pool funds. The documents need to satisfy Nigeria's NDPA, US state privacy laws (CCPA in particular), and GDPR where it touches EU-resident users.
3. Identify any clauses that may be unenforceable in Nigeria (especially the limitation-of-liability cap and the Delaware governing-law / arbitration clauses) and propose alternatives.
4. Resolve the six specific TODOs in §6 below.
5. Redline any clause where the language is imprecise, overbroad, missing required language for one of the jurisdictions, or otherwise carries unnecessary risk.

If you'd prefer to deliver this in two passes — first a high-level structural review with redlines on the most important sections, then a fuller line-by-line — that's fine. Please scope and quote accordingly.

---

## 2. Company background

- **Legal entity:** XaeccoX Inc., a Delaware corporation (formation in progress as of June 2026).
- **Registered address:** TBD — being finalized as part of the Delaware formation. **This is one of the open TODOs below.**
- **Operating brand:** XaePay (the product).
- **Founding context:** XaeccoX is the parent consulting practice (xaeccox.io). XaePay is its first software product. XaePay is a separately-marketed offering but legally part of XaeccoX Inc. for now; we may spin it out as its own entity later if the volume justifies it.
- **Live URL:** https://xaepay.com
- **Status:** Private beta. No real customers transacting yet. We need the legal documents reviewed before we open to real customer signups.

---

## 3. What XaePay does (operational summary)

XaePay is a **software and compliance documentation platform** for cross-border payments between Nigeria and the rest of the world (primarily USD, GBP, EUR, AED, CNY, INR). Its three user types:

### 3.1 Operators
- Nigerian businesses or individuals operating under a licensed wrapper: BDCs, IMTOs, MSBs, freight forwarders, customs agents, or independent agents partnered with a licensed payment provider.
- The operator is the customer-facing relationship in Nigeria. They onboard customers, set rates, handle KYC document collection, and earn a share of the markup per transaction.
- They are NOT employees of XaePay. They use the platform under the Terms of Service.

### 3.2 Customers
- The end-users sending or receiving cross-border payments.
- Businesses paying foreign suppliers (e.g., Nigerian importer paying a Shenzhen factory).
- Individuals sending family support or making personal payments.
- Diaspora senders abroad funding NGN payments to recipients in Nigeria.
- Customers reach the platform through an operator or, for diaspora senders, via the self-serve cold-start signup (which auto-assigns them to a default operator — currently XaeccoX itself).

### 3.3 Service Providers (the actual regulated entities)
- Licensed payment providers that execute the regulated leg of each transaction.
- Currently: **Cedar Money Inc.** (https://cedarmoney.com). Cedar is licensed for cross-border payments and is a counterparty to XaePay via a Master Service Agreement (template included in §8e below).
- Architecturally, the platform supports multiple providers — additional licensed providers may be added in the future.

### 3.4 What XaePay itself does NOT do
- Does **not** hold customer funds, even momentarily.
- Does **not** pool customer funds.
- Does **not** transmit money. Money moves between operator-collected NGN accounts and the licensed provider's foreign-currency accounts. XaePay never touches it.
- Does **not** quote foreign exchange rates on its own book. Wholesale FX rates come from the licensed provider; operators set the customer-facing markup above the platform-mandated minimum.
- Does **not** act as counterparty to any trade.

---

## 4. Fund flow (the regulated leg)

A canonical outbound (NGN → USD) cross-border transaction:

1. Customer messages their Nigerian operator with payment details.
2. Operator inputs the transaction into XaePay's operator dashboard. XaePay's software:
   - Fetches a live wholesale rate from the licensed provider's API.
   - Adds the operator's chosen markup (above the tier minimum).
   - Generates a payment instructions PDF with locked rate, NGN amount, deposit reference.
   - Sends the customer the quote via WhatsApp and email.
3. Customer confirms within a 4-minute rate lock window.
4. Customer deposits NGN to the licensed provider's local collection bank account (NOT to XaePay; NOT to the operator).
5. The licensed provider, having received the NGN, executes the foreign-currency wire to the beneficiary's bank account abroad.
6. XaePay receives status updates via webhook and surfaces them to the operator and customer.

Inbound (USD → NGN) is the mirror — funds enter the licensed provider in foreign currency, NGN payout to the recipient in Nigeria.

For each settled transaction, the licensed provider owes XaePay a **routing fee of 0.20%** on the source amount, billed monthly. The operator's share of the markup is paid out separately. **Customers pay nothing directly to XaePay** — the platform's economics come entirely from operator markup share and provider routing fees.

---

## 5. The standalone invoicing feature

In addition to the cross-border flow above, XaePay includes a **standalone invoicing tool** allowing operators to bill their customers for goods and services (e.g., consulting, logistics, supplier coordination). The customer can pay via Zelle, ACH, bank transfer, USSD, certified check, card payment link, or by initiating a cross-border payment that runs through the rail described in §4.

For non-cross-border payments (e.g., Zelle), **XaePay does not touch the money**. The customer pays the operator directly through the chosen method. XaePay generates the invoice document, captures the customer's "I've paid" claim with optional proof of payment, and routes the operator's confirmation to mark the invoice paid.

XaePay charges nothing on these local-rail invoices today (no transaction fees, no platform fees). We may introduce a per-invoice or subscription fee later (decision deferred).

---

## 6. Outstanding TODOs requiring counsel input

These six items are explicit gaps where we need counsel's guidance before going live:

### TODO 1 — Delaware registered address
The Terms of Service and Privacy Policy currently have `[Delaware registered address — fill in before publishing]` as a placeholder. The Delaware formation is in progress. Once finalized, this needs to be inserted in three places (ToS contact section, Privacy Policy contact section, MSA contact section).

### TODO 2 — Jurisdictional fit
The documents attempt to cover three regimes simultaneously: Nigeria's NDPA, US state privacy laws (especially CCPA where it applies), and EU GDPR where applicable. Need counsel to confirm:
- The Privacy Policy's data-subject rights section adequately addresses all three.
- The international-transfer clauses are sufficient under NDPA (Nigeria's most recent guidance from the Nigeria Data Protection Commission).
- The lawful-basis-for-processing list (contract, legal obligation, legitimate interests, consent) is correctly applied for each data type we collect.

### TODO 3 — Service Provider naming
The current documents refer abstractly to "Service Provider" rather than naming Cedar Money Inc. Question: should we name Cedar (more transparent, helps customer trust) or stay abstract (gives us flexibility to swap providers without re-papering)? We currently lean toward abstract with an option to name Cedar in a customer-facing supplemental disclosure.

### TODO 4 — Dispute resolution
ToS specifies Delaware law and AAA arbitration in Wilmington, DE. For Nigerian users, this may be:
- Unenforceable (Nigerian consumer protection law may invalidate foreign forum selection for consumer disputes).
- Disadvantageous to us (US arbitration costs make small Nigerian disputes uneconomic for us to defend).
Need counsel to recommend either a Nigeria-specific carve-out, a different forum, or confirm the existing language is enforceable.

### TODO 5 — Retention periods
Privacy Policy currently states transaction records and KYC documents are retained for seven (7) years from the transaction date to meet AML and tax-record requirements. The 7-year figure is the US standard. Nigerian AML/CFT regulations (e.g., MLPA 2022) may require a different period. Need counsel to confirm or adjust.

### TODO 6 — Limitation of liability cap
ToS caps our aggregate liability at the higher of "total fees paid in the 3 months preceding the event" or US$100. Under Nigerian consumer protection law, this cap may be unenforceable for consumer transactions. Need counsel to:
- Confirm the cap is enforceable for B2B operators (likely yes).
- Confirm or replace the cap for individual / consumer customers.
- Carve out unwaivable claims (death, personal injury, gross negligence, willful misconduct) per standard practice.

---

## 7. Suggested questions for counsel

In addition to the TODOs above, please consider:

1. Is XaePay's "we are software, not a regulated entity" framing legally adequate to avoid Money Services Business (MSB), money transmitter, or virtual asset service provider (VASP) registration in the US?
2. Same question under Nigerian law — does the platform need any direct CBN, SCUML, or NFIU registration, or is the licensed-provider model sufficient?
3. The platform charges Service Providers a 0.20% routing fee on settled transactions. Is this structure clean from a regulatory standpoint, or does the fact that we economically benefit from each transaction routed bring us closer to being a regulated party?
4. The Master Service Agreement (MSA) template (§8e) is the contract we sign with each Service Provider. Please review for:
   - Whether the fee mechanics, billing cadence, and remediation rights are commercially reasonable.
   - Whether the data-sharing language adequately accounts for cross-border data flow obligations.
   - Whether the SLA framework (described in Schedule A — not yet drafted) needs to be more detailed before counterparts sign.
5. Are there mandatory disclosures (CFPB-style, NDPC-style, etc.) we are not currently making but should be?
6. Should we add a separate cookie banner / cookie policy beyond what's currently in the Privacy Policy?
7. Anything else you'd add as standard practice for a platform of this shape.

---

## 8. The documents under review

The full text of each document follows below. Live versions are also available at:

| Document | URL |
|---|---|
| Terms of Service | https://xaepay.com/?p=terms |
| Privacy Policy | https://xaepay.com/?p=privacy |
| Refund Policy | https://xaepay.com/?p=refunds |
| Data Deletion Policy | https://xaepay.com/?p=data-deletion |
| Master Service Agreement (template) | https://xaepay.com/?p=msa |

The canonical source is the React component at `src/legal/LegalPages.jsx` in the codebase. Any redlines you propose will be applied there.

---

### 8a. Terms of Service

(Full text below — these are the customer-facing terms that any operator, customer, or service-provider user accepts by using the platform.)

> **Effective:** May 28, 2026

These Terms of Service govern your access to and use of the XaePay software platform, operated by XaeccoX Inc. By creating an account or otherwise using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.

**1. What XaePay is — and is not.** XaePay is a software platform that helps cross-border payment operators, their customers, and licensed payment service providers coordinate compliance documentation, invoicing, KYC review, and transaction routing.

XaePay is NOT:
- A bank, payment institution, money services business, money transmitter, bureau de change, or any other regulated financial entity.
- A party to any payment, loan, or trade between users of the Platform.
- A custodian of funds, virtual assets, or other property. We do not hold, pool, or transmit money on anyone's behalf.
- An issuer of foreign-exchange rates. Rates displayed on the Platform are provided by licensed service providers or operators; we surface them but do not set them.

Regulated payment activities are executed by independent third-party providers that are licensed in the jurisdictions where they operate (each, a "Service Provider"). XaePay provides software, documentation tooling, and orchestration; the Service Provider provides the regulated payment service.

**2. Definitions.** Operator, Customer, Service Provider, Recipient, User — as defined in the live document.

**3. Eligibility and accounts.** Users must be at least 18, have full legal capacity to enter binding contracts, and not be on any sanctions list maintained by the U.S. government, the United Nations, the European Union, the United Kingdom, or the Federal Government of Nigeria. Businesses must be lawfully registered in their jurisdiction.

**4. Roles and responsibilities.** Operators vet customers and set rates. Customers provide accurate information. Service Providers execute regulated payments. XaePay provides software. Detailed role descriptions in the live document.

**5. Fees.** Operators pay XaePay a share of the markup per transaction (tier-based 30–70% to XaePay). Service Providers pay XaePay a 0.20% routing fee on routed volume. Customers do not pay XaePay directly.

**6. Acceptable use.** Standard prohibitions on illegal use, sanctions evasion, fraud, circumventing KYC, and security violations.

**7. Third-party services.** Integrations with Supabase (database/auth/storage), Resend (email), Meta WhatsApp Business Platform (messaging), Service Provider(s). Users are also subject to those services' terms.

**8. Disclaimers.** Platform provided "as is." No warranties on Service Provider performance, no guarantee of transaction completion or timing.

**9. Limitation of liability.** Aggregate liability capped at the greater of US$100 or three months of fees paid by the claimant. **[See TODO 6 — needs review for Nigerian enforceability.]**

**10. Indemnification.** Standard mutual indemnification.

**11. Termination.** User-initiated closure on request; platform-initiated suspension for breach.

**12. Changes to terms.** Material changes notified by email or in-product notice.

**13. Governing law and disputes.** Delaware law; AAA arbitration in Wilmington, DE. Carve-out for Nigerian Data Protection Act rights. **[See TODO 4 — needs review for Nigerian forum enforceability.]**

**14. Contact.** XaeccoX Inc. / [Delaware address — TODO 1] / legal@xaepay.com.

*(Full prose lives at /?p=terms — please redline against that version.)*

---

### 8b. Privacy Policy

> **Effective:** May 28, 2026

This Privacy Policy explains what personal data XaeccoX Inc. collects through the XaePay platform, how we use it, who we share it with, and the choices users have. We comply with applicable data-protection laws, including the Nigeria Data Protection Act (NDPA), US state laws (CCPA), and the EU GDPR where they apply to a given user.

**1. Who we are.** XaeccoX Inc., Delaware corporation. Contact: privacy@xaepay.com.

**2. What we collect.**
- *From operators:* account info (name/email/phone/company/license), banking info (payout account), business documentation (CAC, license certificates, partnership letters, BVN/NIN where required), operational data (customers onboarded, quotes, transactions, audit log).
- *From customers:* identity (name, business name, email, phone, type), KYC documents (photo ID, address proof, business registration, BVN/NIN), transaction information (quotes, amounts, currencies, source/destination, invoices, deposit slips, purpose, claim records), recipient information.
- *From recipients:* details provided by the paying customer/operator for the purpose of executing payment.
- *From service-provider users:* identity, KYC verdicts, transaction status updates, compliance feedback.
- *Automatically:* IP, browser, device, OS, logs, timestamps, session cookies (no third-party advertising trackers).

**3. How we use it.** Operate the platform; verify identities; route transactions to providers; generate documentation; communicate; prevent fraud; comply with legal obligations.

**4. Legal basis.** Contract; legal obligation; legitimate interests; consent. Mapped per data type in the full document.

**5. Sharing.**
- Service Providers (licensed payment providers) — KYC packages and transaction details routed for execution.
- Hosting/infrastructure: Supabase, Vercel/Fly.io (data processors).
- Communications: Resend (email), Meta WhatsApp (messaging).
- Professional advisors (legal, accounting, audit) under confidentiality.
- Regulators / law enforcement / courts on valid legal process.
- Successors in a merger or sale of assets.
- **We do not sell or rent personal data.**

**6. International transfers.** Data is stored in the United States and other jurisdictions where our processors operate. Where required, we put in place Standard Contractual Clauses or other appropriate safeguards.

**7. Retention.** Transaction records, KYC documents, and compliance documentation retained for **seven (7) years** from transaction date. **[See TODO 5 — verify against Nigerian MLPA requirements.]**

**8. Security.** Row-level security on the database, TLS in transit, encryption at rest for stored files, signed-URL access controls, role-based access for the team, audit logging.

**9. Your rights.** Access, correct, delete (subject to retention), object/restrict, withdraw consent, portability, lodge a complaint (Nigeria Data Protection Commission for Nigerian residents).

**10. Children.** Platform is not for under-18s; we do not knowingly collect from children.

**11. Cookies.** Only strictly necessary cookies. No third-party advertising.

**12. Changes.** Material changes notified by email or prominent notice.

**13. Contact.** privacy@xaepay.com.

*(Full prose at /?p=privacy.)*

---

### 8c. Refund Policy

> **Effective:** May 28, 2026

XaePay does not custody funds, so refunds work differently than at a bank or payment processor.

**Scenario 1 — Transaction refunds.** Funds are received and disbursed by the licensed Service Provider. If a transaction has not settled, the customer should contact their Operator who works with the Service Provider to attempt a stop or recall. Once settled, refunds are governed by the Service Provider's terms and applicable law. XaePay assists with documentation but cannot order a refund.

**Scenario 2 — Platform fees.** If a transaction is reversed after a XaePay fee was booked, the corresponding fee is waived or credited. We do not issue cash refunds for platform fees outside this scenario.

**Process.** Email legal@xaepay.com with the transaction reference, copy the Operator if Service Provider involvement is needed.

**Timeline.** Platform-fee waivers within ~7 business days. Transaction-level refunds depend on the Service Provider.

**Chargebacks.** Initiating a chargeback may result in account suspension pending resolution; we may share transaction documentation with the disputing institution.

*(Full prose at /?p=refunds.)*

---

### 8d. Data Deletion Policy

> **Effective:** May 28, 2026

How to request deletion of personal data XaePay holds, what we can and cannot delete, and timelines. Supplements the Privacy Policy.

**How to request.** Email privacy@xaepay.com from the account email with "Deletion" in the subject. Identity verification may be required.

**What gets deleted.** Account profile (name, email, phone, credentials), unretained uploaded documents, operational data not subject to retention.

**What we cannot delete on request.**
- KYC and transaction records retained for 7 years from the transaction date for AML and tax-record obligations under US and Nigerian law.
- Records held by Service Providers under their own retention policies.
- Records required to be kept by valid legal process.

Where we cannot delete, we restrict access so data is only used for the legal/compliance purpose requiring retention.

**Timeline.** Verified deletion requests acted on within 30 calendar days.

**Account deactivation vs. deletion.** Deactivation stops logins and outbound communications but preserves data (subject to retention rules). Request via privacy@xaepay.com with "Deactivation."

*(Full prose at /?p=data-deletion.)*

---

### 8e. Master Service Agreement (template — Service Providers)

> **Status:** Template only. Not self-executing. Each Service Provider signs an executed counterpart that may include schedule additions (SLA, pricing addendum, integration spec).

Entered into between XaeccoX Inc. and the countersigning licensed payment provider. Governs routing of transactions from XaePay's Platform to the Service Provider for regulated execution.

**1. Definitions.** Platform, Operator, Customer, Service Provider, Recipient, KYC Package, Routing Fee.

**2. Services XaePay provides.** Provider portal access (transactions feed, KYC queue, billing ledger, team management), KYC Package assembly + delivery, programmatic API or manual portal access, audit-log access, coordination on amendments and exceptions.

**3. Services Service Provider provides.** Regulated payment execution under their license; KYC verdict within SLA timeframes; status updates back to the platform; independent compliance with sanctions, AML, and reporting obligations.

**4. Routing Fee.** 0.20% (20 basis points) on the source amount of each settled transaction. Accrues automatically; XaePay consolidates monthly into a single invoice payable in 30 days by wire/ACH/bank transfer. Late payments accrue interest at the lesser of 1.0% per month or maximum permitted by law. Routing may be suspended on invoices more than 60 days past due.

**5. Data sharing and privacy.** KYC Packages and transaction details shared strictly to enable Service Provider's regulated obligations. Both parties handle data per applicable laws (NDPA, GDPR, CCPA), implement reasonable safeguards, and cooperate on data-subject requests.

**6. Service Levels.** SLA framework lives in Schedule A to each executed counterpart.

**7. Confidentiality.** Standard receiving-party obligations.

**8. Intellectual property.** XaePay retains all rights to the Platform. Service Provider receives limited license to use during the term. Compliance artifacts the Service Provider generates remain theirs, with a license to XaePay to store, route, and display.

**9. Representations and warranties.** Service Provider holds and maintains all required licenses; XaePay has the right to make the Platform available; both parties have authority to enter the agreement.

**10. Indemnification.** Mutual. Indemnifying party controls defense; no admission of liability by indemnified party without consent.

**11. Limitation of liability.** Carved-out for confidentiality breach and indemnification. Otherwise no indirect/incidental/consequential damages. Aggregate liability capped at total Routing Fees paid in the prior 12 months.

**12. Term and termination.** Begins on counterpart execution. Either party may terminate on 90 days notice for convenience, immediately for material uncured breach (30-day cure), or immediately for insolvency / license revocation. Surviving provisions: confidentiality, indemnification, IP, limitation of liability.

**13. Governing law and disputes.** Delaware law; AAA Commercial Arbitration in Wilmington. Injunctive relief available in any court of competent jurisdiction to protect IP or Confidential Information.

**14. General.** Assignment requires consent (except to merger successor). Independent contractors. Force majeure. Entire agreement.

*(Full prose at /?p=msa.)*

---

## 9A. Additional operator-side features under design (added 2026-06-10)

These are features the platform is actively building. We'd like counsel's read on each before they go to live operators, especially their Nigerian regulatory implications.

### 9A.1 Proforma Invoice Agent / Third-Party Trade Restructure

**What it does.** When a Nigerian customer needs to pay a foreign supplier but doesn't have direct USD banking infrastructure, a XaePay-licensed operator (BDC, IMTO, freight forwarder) acts as a contractual *trade partner*. The agent:

1. Reads the original supplier invoice (supplier → end customer) via AI extraction
2. Restructures it into a new invoice where:
   - **Supplier** stays as supplier
   - **Operator** is named as the buyer / payer
   - **End customer** is named as the consignee + ultimate beneficial owner of the goods
3. Both the original and restructured invoices are preserved; nothing is hidden
4. A trade-partner agreement between operator and end customer is signed before the agent acts
5. Form M handling: the agent prompts the operator to specify who is the importer-of-record (themselves or the end customer)
6. Standard compliance review (sanctions, RFI risk, document completeness) runs against the restructured invoice
7. The restructured invoice is what flows to the payment provider for execution

**Why it matters commercially.** This is how a large share of Nigerian cross-border trade already happens informally. Operators fronting USD to suppliers on behalf of customers is a standard pattern; the goal is to *formalise + document* it cleanly.

**Specific questions for counsel:**

1. Can a Nigerian licensed BDC / IMTO / agent legally be named as "buyer" on a supplier invoice where the consignee + UBO is a third party (the end customer)? Under what license category does this fall?
2. What is the correct Form M structure for this flow? Does Form M need to be opened by the operator (named buyer) or by the end customer (UBO)? What documentation supports CBN's view of the importer-of-record?
3. Where do VAT, customs duties, and withholding-tax obligations sit (operator vs end customer)? Is there a tax-pass-through structure that's defensible?
4. What contractual language between operator and end customer would make this defensible to CBN / SCUML / NFIU on audit? (We'll draft based on counsel guidance.)
5. Does this structure trigger any TBML reporting obligations the operator should be aware of?
6. Are there license categories Nigerian operators commonly hold (or could acquire) that explicitly authorise acting as a trade-partner buyer-of-record? If so, which?

### 9A.2 Trade-partner correspondent network (other licensed BDC agents)

**What it does.** XaePay would surface a "Trade Partners" registry inside the operator dashboard where licensed operators can register one another as collaboration counterparties. A single cross-border payment may then be jointly handled (e.g., Operator A in Lagos has the customer relationship; Operator B in Abuja has spare USD liquidity; they split the transaction and the margin transparently). All collaboration is documented.

**Specific questions for counsel:**

1. Can two licensed Nigerian BDCs (or other licensed agents) legally split a single cross-border transaction with documented margin allocation, without crossing into joint-venture / correspondent-banking territory that would require additional licensing?
2. Whose books does the transaction sit on for CBN reporting purposes — the BDC of customer record, the BDC of funding record, or both?
3. What's the right transfer-pricing approach when two BDCs share margin on a single deal?
4. What AML division of responsibility is required between collaborating BDCs?
5. Are there CBN guidelines on inter-BDC collaboration we should follow explicitly?

### 9A.3 Liquidity partners — including USDT / USDC off-ramp providers

**What it does.** XaePay would surface a "Liquidity Partners" registry where operators can document their own FX / asset liquidity sources (other BDCs, P2P OTC desks, USDT/USDC off-ramp counterparties). The XaePay platform never touches the asset itself. The operator-to-liquidity-partner relationship is between those parties; XaePay only records the relationship + routes references on each transaction.

**Specific questions for counsel:**

1. Does XaePay's positioning ("we record references, we never touch crypto, the partner relationships are between regulated parties") protect it from being classified as a VASP under Nigerian SEC's framework? US / global equivalents?
2. For Nigerian operators using USDT / USDC liquidity: what licensing or authorisation do *they* need post-2023 SEC framework? Is a BDC license sufficient, or do they need a separate VASP authorisation?
3. For PSPs that accept USDT / USDC for off-ramp to fiat settlement: what authorisation do they need to do this legally in Nigeria?
4. What documentation should a XaePay-surfaced liquidity-partner relationship preserve to make it defensible on audit (proof of authorisation, transaction logs, settlement confirmations)?
5. Is there a meaningful difference between using USDT (an issuer-controlled stablecoin) vs USDC vs other stablecoins for Nigerian regulatory purposes?

### 9A.4 Multi-PSP onboarding (operators bring their own payment providers)

**What it does.** Instead of only routing through the platform-default PSP (currently one licensed partner), operators could onboard additional PSPs they already have relationships with. XaePay then routes through whichever PSP is best-fit for a given corridor / cost / speed.

**Specific questions for counsel:**

1. When an operator brings a PSP relationship onto XaePay, what vetting responsibility (if any) does XaePay have for that PSP's licensing and AML compliance?
2. Should there be a written PSP-onboarding addendum signed by the operator that acknowledges their responsibility for the PSP relationship and indemnifies XaePay for the underlying execution?
3. Does adding multiple PSPs change XaePay's own regulatory exposure (e.g., does it move us toward looking like an MSB / aggregator rather than software-only)?
4. What documentation must XaePay collect from each new PSP before transactions are routed through them?

### 9A.5 Operator AI Agent ("Agentic" tier)

**What it does.** A subscription tier (₦50K/mo) where the operator's portal is augmented with AI agents that draft routine work (quote responses, KYC reminders, payment confirmations, regulatory report email summaries). Every agent action requires explicit operator approval before any external send / state change. Nothing auto-sends.

**Specific questions for counsel:**

1. Is there any Nigerian regulatory issue with AI-drafted communications to customers about regulated transactions, given (a) all sends require human operator approval and (b) full audit trail is preserved?
2. Should the AI agent's drafts be disclosed to customers ("this message was drafted by AI and reviewed by your operator")? In what jurisdictions is such disclosure legally required, recommended, or unnecessary?
3. Do AI-generated regulatory report drafts (which the operator reviews + files) raise any concerns under CBN / SCUML / NFIU reporting standards?
4. Liability allocation: if an operator approves an AI draft that turns out to contain an error, is XaePay's liability limited by its "tool provider" positioning, or is there exposure we should address contractually?

### 9A.6 Engagement priority within 9A

- **9A.1 (proforma)** is the most strategically valuable and most urgent — it unlocks the largest share of Nigerian SME cross-border trade volume
- **9A.5 (AI agent)** is the next most urgent — already in customer-facing pricing
- **9A.2 + 9A.3 + 9A.4** can be reviewed together as a "partner network" cluster — slower timeline OK

We're happy to scope the legal review across two engagements: (1) the documents under review in §8 (already on your plate), (2) §9A items as a second engagement. Or one combined engagement if you prefer.

---

## 9. Engagement notes

- **Format for redlines:** plain markdown comments, tracked-changes Word document, or PDF redlines — any of these work for us.
- **Volume:** the full prose of all five documents is roughly 6,000 words combined.
- **Timeline:** we'd like to go live within 3–4 weeks of engagement. Earlier if possible.
- **Budget:** open to fixed fee, hourly, or blended. Please scope and quote.
- **Repeat engagement:** we anticipate ongoing need (provider MSAs as new providers come online, marketing copy review, regulatory analysis as the product evolves). If you can offer a retainer arrangement, we'd be interested.

**Contact:**
Okoli Chukie
okoli.chukie@gmail.com
+1 [Chukie's US number]
+234 [Chukie's NG number]

---

*This brief was prepared on June 7, 2026. The legal documents it covers were drafted by the platform's product team and have not been reviewed by counsel. Nothing in this brief is itself legal advice or a binding statement of policy.*
