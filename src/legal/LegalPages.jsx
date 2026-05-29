import React from "react";

// =============================================================================
// XaePay legal pages — Terms of Service + Privacy Policy.
//
// These are drafts. They must be reviewed by an attorney before XaePay
// publishes them or asks any real user to accept them. They are written to
// match XaePay's actual product surface and positioning (software-only,
// providers hold regulated custody, operators are the customer relationship),
// but jurisdictional fit (Nigeria NDPA, US state laws, etc.) needs legal
// review.
//
// Last drafted: 2026-05-28.
// =============================================================================

const COMPANY_LEGAL_NAME = "XaeccoX Inc.";
const COMPANY_BRAND = "XaePay";
const COMPANY_ADDRESS = "[Delaware registered address — fill in before publishing]";
const COMPANY_EMAIL = "legal@xaepay.com";
const PRIVACY_EMAIL = "privacy@xaepay.com";
const EFFECTIVE_DATE = "May 28, 2026";

function LegalLayout({ title, children, kind }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8">
        <a href="/" className="font-mono text-[11px] uppercase tracking-wider underline" style={{ color: "var(--muted)" }}>← Back to xaepay.com</a>
        <h1 className="font-display mt-4 text-3xl font-[500] tracking-tight sm:text-4xl">{title}</h1>
        <div className="mt-2 font-mono text-[11px]" style={{ color: "var(--muted)" }}>{kind} · Effective {EFFECTIVE_DATE}</div>
      </div>
      <div className="prose-style space-y-5 text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
        {children}
      </div>
      <div className="mt-12 rounded-xl p-4 text-xs" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--muted)" }}>
        Questions? Reach us at <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a>.
      </div>
    </div>
  );
}

function H2({ children }) {
  return <h2 className="font-display mt-8 text-xl font-semibold" style={{ color: "var(--ink)" }}>{children}</h2>;
}
function H3({ children }) {
  return <h3 className="font-display mt-5 text-base font-semibold" style={{ color: "var(--ink)" }}>{children}</h3>;
}
function P({ children }) {
  return <p className="leading-relaxed">{children}</p>;
}
function UL({ children }) {
  return <ul className="ml-5 list-disc space-y-1.5">{children}</ul>;
}

// =============================================================================
// Terms of Service
// =============================================================================

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" kind="Terms">
      <P>
        These Terms of Service (the "<strong>Terms</strong>") govern your access to and use of the {COMPANY_BRAND} software platform (the "<strong>Platform</strong>"), operated by {COMPANY_LEGAL_NAME} ("<strong>{COMPANY_BRAND}</strong>", "we", "our", or "us"). By creating an account or otherwise using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.
      </P>

      <H2>1. What {COMPANY_BRAND} is — and what it is not</H2>
      <P>
        {COMPANY_BRAND} is a software platform that helps cross-border payment <strong>operators</strong>, their <strong>customers</strong>, and licensed payment <strong>service providers</strong> coordinate compliance documentation, invoicing, KYC review, and transaction routing.
      </P>
      <P><strong>{COMPANY_BRAND} is not:</strong></P>
      <UL>
        <li>A bank, payment institution, money services business, money transmitter, bureau de change, or any other regulated financial entity.</li>
        <li>A party to any payment, loan, or trade between users of the Platform.</li>
        <li>A custodian of funds, virtual assets, or other property. We do not hold, pool, or transmit money on anyone's behalf.</li>
        <li>An issuer of foreign-exchange rates. Rates displayed on the Platform are provided by licensed service providers or operators; we surface them but do not set them.</li>
      </UL>
      <P>
        Regulated payment activities are executed by independent third-party providers that are licensed in the jurisdictions where they operate (each, a "<strong>Service Provider</strong>"). {COMPANY_BRAND} provides software, documentation tooling, and orchestration; the Service Provider provides the regulated payment service.
      </P>

      <H2>2. Definitions</H2>
      <UL>
        <li><strong>Operator</strong> — an agent, BDC, IMTO, freight forwarder, or other entity that uses the Platform to serve customers and route transactions to a Service Provider. Operators may be regulated themselves or may operate under a license-holder's wrapper.</li>
        <li><strong>Customer</strong> — an individual or business that uses the Platform (typically via an Operator) to send or receive cross-border payments or invoice payments.</li>
        <li><strong>Service Provider</strong> — a licensed payment provider whose regulated services are routed to via the Platform (e.g., for FX execution, settlement, or KYC).</li>
        <li><strong>Recipient</strong> — a person or business that receives funds from a Customer through a Service Provider.</li>
        <li><strong>User</strong> — any of the above when accessing the Platform.</li>
      </UL>

      <H2>3. Eligibility and accounts</H2>
      <P>
        To use the Platform you must (a) be at least 18 years old; (b) have full legal capacity to enter binding contracts; and (c) not be on any sanctions list maintained by the U.S. government, the United Nations, the European Union, the United Kingdom, or the Federal Government of Nigeria. Businesses must be lawfully registered in their jurisdiction.
      </P>
      <P>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a> if you suspect unauthorized access.
      </P>

      <H2>4. Roles and responsibilities</H2>
      <H3>4.1 Operators</H3>
      <UL>
        <li>You are responsible for vetting your customers, complying with applicable Nigerian Central Bank, SCUML, NFIU, and tax obligations, and ensuring that your activities are permitted under your own license or partnership wrapper.</li>
        <li>You set your customer-facing markup above the tier minimum defined on the Platform. You are responsible for disclosing your fees and rates to your customers.</li>
        <li>You are solely responsible for any communications, agreements, or relationships you have with your customers outside of the Platform.</li>
      </UL>
      <H3>4.2 Customers</H3>
      <UL>
        <li>You agree to provide accurate, complete, and current information when requested for KYC, transaction details, or compliance review.</li>
        <li>You are responsible for ensuring that the payments you initiate are lawful in your jurisdiction and in the destination jurisdiction.</li>
        <li>Funds and transaction execution are handled by a Service Provider, not by {COMPANY_BRAND}. Disputes regarding payment execution should be raised with your Operator and the Service Provider.</li>
      </UL>
      <H3>4.3 Service Providers</H3>
      <UL>
        <li>Service Providers are independently licensed entities that have entered into a separate routing arrangement with {COMPANY_BRAND}. Their services are governed by their own terms, license conditions, and applicable regulations.</li>
        <li>{COMPANY_BRAND} does not guarantee the availability, performance, or pricing of any Service Provider.</li>
      </UL>

      <H2>5. Fees</H2>
      <P>
        Operators pay {COMPANY_BRAND} a share of the markup charged on each transaction, as defined by the tier the Operator selects for that transaction. The tier table, including minimum markup and revenue share, is displayed in your operator dashboard at the time of transaction and may be updated from time to time on prospective transactions.
      </P>
      <P>
        Service Providers pay {COMPANY_BRAND} a routing fee on transactions routed through them, as defined in their separate agreement with {COMPANY_BRAND}.
      </P>
      <P>
        Customers do not pay {COMPANY_BRAND} directly. Any fees disclosed to Customers reflect the Operator's markup and Service Provider's fees; {COMPANY_BRAND} surfaces the math but is not the recipient.
      </P>

      <H2>6. Acceptable use</H2>
      <P>You agree not to use the Platform to:</P>
      <UL>
        <li>Send or receive funds in violation of applicable law, including sanctions, anti-money-laundering, terrorist-financing, or tax laws.</li>
        <li>Misrepresent your identity, jurisdiction, business purpose, or the purpose of any payment.</li>
        <li>Upload false, misleading, or fraudulently obtained documents.</li>
        <li>Circumvent KYC, transaction limits, or Service Provider compliance reviews.</li>
        <li>Interfere with, reverse-engineer, or attack the Platform's security or availability.</li>
        <li>Resell, rebrand, or sublicense the Platform without our written consent.</li>
      </UL>
      <P>
        We may suspend or terminate access for any User we reasonably believe has violated this section, with or without notice, and may report violations to relevant authorities.
      </P>

      <H2>7. Third-party services</H2>
      <P>
        The Platform integrates with third-party services to deliver its features, including but not limited to Supabase (database, authentication, file storage), Resend (email delivery), Meta WhatsApp Business Platform (messaging), and one or more Service Providers (regulated payment execution). Your use of those services through the Platform is also subject to their terms and privacy policies. We are not responsible for the acts, omissions, or outages of third parties.
      </P>

      <H2>8. Disclaimers</H2>
      <P>
        The Platform is provided "as is" and "as available". To the maximum extent permitted by law, {COMPANY_BRAND} disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, accuracy, and uninterrupted availability.
      </P>
      <P>
        {COMPANY_BRAND} does not guarantee that any transaction will be approved, executed, completed within any particular timeframe, or delivered to any particular recipient. Acceptance and execution of payments are entirely the responsibility of the relevant Service Provider, subject to their own compliance review, regulatory obligations, and operational capacity.
      </P>

      <H2>9. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, {COMPANY_BRAND} and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or business opportunities, arising from or related to your use of the Platform, even if advised of the possibility of such damages.
      </P>
      <P>
        Our aggregate liability for any claim arising from or related to the Platform shall not exceed the total fees you paid to {COMPANY_BRAND} in the three (3) months preceding the event giving rise to the claim, or US$100, whichever is greater.
      </P>

      <H2>10. Indemnification</H2>
      <P>
        You agree to indemnify and hold harmless {COMPANY_BRAND}, its affiliates, and their officers, directors, employees, and agents from any claim, loss, liability, or expense (including reasonable legal fees) arising from (a) your use of the Platform, (b) your violation of these Terms, (c) your violation of any law or third-party right, or (d) any transaction you initiate, process, or facilitate through the Platform.
      </P>

      <H2>11. Termination</H2>
      <P>
        You may stop using the Platform at any time and request account closure by writing to <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a>. We may suspend or terminate your access at any time, with or without notice, for any reason, including (without limitation) violation of these Terms, suspected fraud, or instructions from a regulator or Service Provider. On termination, sections that by their nature should survive (including disclaimers, limitations of liability, indemnification, and governing law) will survive.
      </P>

      <H2>12. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. Material changes will be notified by email to the address associated with your account or by a notice on the Platform. Continued use of the Platform after the effective date of the updated Terms constitutes acceptance.
      </P>

      <H2>13. Governing law and disputes</H2>
      <P>
        These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict-of-laws principles. The parties consent to the exclusive jurisdiction of the state and federal courts located in Delaware for any matter arising from or related to these Terms, except that {COMPANY_BRAND} may seek injunctive relief in any court of competent jurisdiction.
      </P>
      <P>
        Nothing in this section prevents a User in Nigeria from invoking rights that cannot be waived under Nigerian law, including under the Nigeria Data Protection Act.
      </P>

      <H2>14. Contact</H2>
      <P>
        {COMPANY_LEGAL_NAME}<br />
        {COMPANY_ADDRESS}<br />
        <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a>
      </P>
    </LegalLayout>
  );
}

// =============================================================================
// Privacy Policy
// =============================================================================

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" kind="Privacy">
      <P>
        This Privacy Policy explains what personal data {COMPANY_LEGAL_NAME} ("<strong>{COMPANY_BRAND}</strong>", "we", "our", or "us") collects through the {COMPANY_BRAND} software platform (the "<strong>Platform</strong>"), how we use it, who we share it with, and the choices you have. We comply with applicable data-protection laws, including the Nigeria Data Protection Act (NDPA), as well as US state laws (such as the California Consumer Privacy Act) and the European Union General Data Protection Regulation where they apply to a given User.
      </P>

      <H2>1. Who we are</H2>
      <P>
        {COMPANY_LEGAL_NAME} is a Delaware corporation operating the {COMPANY_BRAND} Platform. For any privacy questions, contact us at <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a>.
      </P>

      <H2>2. What we collect</H2>
      <H3>2.1 From operators</H3>
      <UL>
        <li>Account information: name, email, phone, company name, license details, role.</li>
        <li>Banking information: bank account details used to receive payouts of operator earnings.</li>
        <li>Business documentation: CAC certificate, license certificates, partnership letters, BVN/NIN where required for compliance.</li>
        <li>Operational data: customers you onboard, quotes you create, transactions you process, internal notes, audit-log activity.</li>
      </UL>
      <H3>2.2 From customers</H3>
      <UL>
        <li>Identity information: full name, business name (where applicable), email, phone, customer type (individual or business).</li>
        <li>KYC documents: government-issued photo ID, proof of address, business registration documents, BVN or NIN where required by the relevant Service Provider, and any other documents you upload during onboarding.</li>
        <li>Transaction information: quote requests, amounts, currencies, source and destination, supporting invoices, deposit slips, purpose of payment, claim records, communications related to a transaction.</li>
        <li>Recipient information: details of the people or businesses you pay, including names, bank details, photo ID (for individuals), business invoices (for businesses), and contact details.</li>
      </UL>
      <H3>2.3 From recipients</H3>
      <UL>
        <li>Where you are a Recipient, the information your Customer (or Operator) provided about you for the purpose of executing a payment to you: name or business name, bank details, contact details, and any KYC documents required by the Service Provider.</li>
      </UL>
      <H3>2.4 From service providers</H3>
      <UL>
        <li>Identity and contact information of provider users (employees of a Service Provider with portal access).</li>
        <li>KYC verdicts, transaction status updates, and other compliance feedback that the Service Provider returns to the Platform.</li>
      </UL>
      <H3>2.5 Automatically</H3>
      <UL>
        <li>Technical data: IP address, browser type, device identifiers, operating system, log files, timestamps, referrer, and similar information collected automatically when you use the Platform.</li>
        <li>Cookies and similar technologies for authentication, session management, and preferences. We do not use third-party advertising trackers.</li>
      </UL>

      <H2>3. How we use it</H2>
      <UL>
        <li>To provide, operate, and improve the Platform.</li>
        <li>To verify your identity and your customers' identities, as required by Service Providers' regulatory obligations.</li>
        <li>To route transactions to the appropriate Service Provider, including transmitting KYC packages and transaction details to them.</li>
        <li>To generate invoices, receipts, audit packs, and other compliance documentation.</li>
        <li>To communicate with you about your account, transactions, and Platform changes (by email, WhatsApp, in-product notifications, or SMS where available).</li>
        <li>To prevent fraud, abuse, and violations of these terms or applicable law.</li>
        <li>To comply with legal obligations, including responses to lawful requests from regulators or courts.</li>
      </UL>

      <H2>4. Legal basis for processing</H2>
      <P>Where applicable data-protection laws require a legal basis for processing, we rely on:</P>
      <UL>
        <li><strong>Contract</strong> — to deliver the Platform you've requested.</li>
        <li><strong>Legal obligation</strong> — to comply with anti-money-laundering, sanctions, and tax laws.</li>
        <li><strong>Legitimate interests</strong> — to secure the Platform, prevent fraud, and improve the service, balanced against your rights.</li>
        <li><strong>Consent</strong> — where you've given specific consent (for example, to send marketing emails or to share data with a particular third party beyond what's necessary to operate the Platform).</li>
      </UL>

      <H2>5. Who we share it with</H2>
      <UL>
        <li><strong>Service Providers (licensed payment providers).</strong> We share KYC packages, transaction details, and related compliance documentation with the Service Provider routing a given transaction, so they can fulfill their regulated obligations.</li>
        <li><strong>Hosting and infrastructure.</strong> Supabase (Postgres database, file storage, authentication) and Vercel / Fly.io (application hosting). These providers process personal data on our behalf as data processors.</li>
        <li><strong>Communications.</strong> Resend (transactional email), Meta WhatsApp Business Platform (transactional and notification messaging). These providers receive only the data needed to deliver the relevant message.</li>
        <li><strong>Professional advisors.</strong> Legal, accounting, audit, and security advisors bound by confidentiality.</li>
        <li><strong>Authorities.</strong> Regulators, law-enforcement agencies, or courts where compelled by valid legal process, or where we reasonably believe disclosure is necessary to prevent harm.</li>
        <li><strong>Successors.</strong> In connection with a merger, acquisition, or sale of assets, subject to confidentiality and continued protection of your data.</li>
      </UL>
      <P>
        We do not sell or rent personal data. We do not share personal data with third parties for their independent advertising or marketing purposes.
      </P>

      <H2>6. International transfers</H2>
      <P>
        The Platform is operated from the United States and personal data is stored on servers located in the United States and in jurisdictions where our service providers operate. If you are accessing the Platform from Nigeria, the European Economic Area, the United Kingdom, or another jurisdiction with different data-protection rules, you understand that your data will be transferred to and processed in jurisdictions that may not provide equivalent protection. Where required, we put appropriate safeguards in place (such as Standard Contractual Clauses) to protect international transfers.
      </P>

      <H2>7. Retention</H2>
      <P>
        We retain personal data for as long as necessary to provide the Platform and to comply with legal, regulatory, accounting, and reporting obligations. Transaction records, KYC documents, and compliance documentation are typically retained for seven (7) years from the transaction date to meet AML and tax-record requirements. Operational data not subject to a specific retention requirement is deleted or anonymized when no longer needed.
      </P>

      <H2>8. Security</H2>
      <P>
        We implement administrative, technical, and organizational measures designed to protect personal data, including row-level security on our database, encryption in transit (TLS), encryption at rest for stored files, signed-URL access controls on sensitive documents, role-based access for our team, and audit logging for administrative actions. No system is perfectly secure; you also play a role by keeping your credentials confidential and using strong authentication.
      </P>

      <H2>9. Your rights</H2>
      <P>Depending on your jurisdiction, you may have the right to:</P>
      <UL>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your data (subject to retention obligations for compliance documentation).</li>
        <li>Object to or restrict certain processing, including direct marketing.</li>
        <li>Withdraw consent where we rely on consent.</li>
        <li>Request a copy of your data in a portable format.</li>
        <li>Lodge a complaint with a data-protection authority (the Nigeria Data Protection Commission for Nigerian residents).</li>
      </UL>
      <P>
        To exercise any of these rights, email us at <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a>. We may need to verify your identity before responding.
      </P>

      <H2>10. Children</H2>
      <P>
        The Platform is not intended for anyone under 18. We do not knowingly collect personal data from children. If you believe a child has provided us personal data, contact us at <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a> and we will delete it.
      </P>

      <H2>11. Cookies</H2>
      <P>
        We use cookies and similar technologies that are strictly necessary to authenticate you, remember your session, and protect against fraud. We do not use third-party advertising cookies. You can configure your browser to refuse cookies, but some features of the Platform may not work as intended.
      </P>

      <H2>12. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy from time to time. The "Effective" date at the top reflects the most recent update. Material changes will be notified by email to the address associated with your account or by a prominent notice on the Platform.
      </P>

      <H2>13. Contact</H2>
      <P>
        {COMPANY_LEGAL_NAME}<br />
        {COMPANY_ADDRESS}<br />
        <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a>
      </P>
    </LegalLayout>
  );
}

// =============================================================================
// Data Deletion
// =============================================================================

export function DataDeletion() {
  return (
    <LegalLayout title="Data Deletion" kind="Policy">
      <P>
        This page explains how to request deletion of personal data {COMPANY_BRAND} holds about you, what we can and cannot delete, and the timeline you should expect. It supplements our <a href="/?p=privacy" className="underline" style={{ color: "var(--emerald)" }}>Privacy Policy</a>.
      </P>

      <H2>How to request deletion</H2>
      <P>
        Email <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a> from the email address associated with your account. Include the word "Deletion" in the subject line and describe the data you want removed. If you have multiple roles on the Platform (for example, both an Operator and a Customer), tell us which one(s) the request applies to.
      </P>
      <P>
        We may ask you to verify your identity before acting on a deletion request, particularly if the email comes from an address different from the one on file. Verification helps prevent fraudulent deletion of someone else's data.
      </P>

      <H2>What gets deleted</H2>
      <UL>
        <li>Your account profile, including name, email, phone, and login credentials.</li>
        <li>Documents you have uploaded that are not subject to a regulatory retention requirement.</li>
        <li>Operational data tied to your account (notes, preferences, in-product activity).</li>
      </UL>

      <H2>What we cannot delete on request</H2>
      <P>
        Some information must be retained to meet our own legal obligations or those of the licensed Service Providers we route transactions through. Specifically:
      </P>
      <UL>
        <li><strong>KYC and transaction records</strong> tied to completed or attempted cross-border payments are retained for seven (7) years from the transaction date to comply with anti-money-laundering and tax-record obligations under U.S. and Nigerian law.</li>
        <li><strong>Records held by Service Providers</strong> are governed by the Service Provider's own retention policy and applicable financial regulations. We will pass your request on but cannot guarantee deletion in their systems.</li>
        <li><strong>Records we are required to keep</strong> by valid legal process (subpoenas, court orders, regulatory directions).</li>
      </UL>
      <P>
        Where we cannot delete, we will, where possible, restrict access to the data so it is used only for the legal or compliance purpose that requires its retention.
      </P>

      <H2>Timeline</H2>
      <P>
        We aim to act on verified deletion requests within thirty (30) calendar days. Complex requests, requests involving multiple Service Providers, or requests requiring further verification may take longer; we'll keep you updated.
      </P>

      <H2>Account deactivation vs. deletion</H2>
      <P>
        If you don't need full deletion and just want to stop using the Platform, you can ask us to deactivate your account. Deactivation prevents future logins and stops outbound communications, but data is preserved (subject to the retention rules above). To deactivate, email <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a> with "Deactivation" in the subject line.
      </P>

      <H2>Questions</H2>
      <P>
        For anything about this policy, email <a href={`mailto:${PRIVACY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{PRIVACY_EMAIL}</a>.
      </P>
    </LegalLayout>
  );
}

// =============================================================================
// Refund Policy
// =============================================================================

export function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" kind="Policy">
      <P>
        Because {COMPANY_BRAND} is a software platform and does not custody funds, refunds work differently than they do at a bank or payment processor. This policy explains the two scenarios in which a refund may be possible and how to request one.
      </P>

      <H2>Scenario 1: Transaction refunds (money already moving)</H2>
      <P>
        Funds you send through the Platform are received and disbursed by the licensed Service Provider routing your transaction. {COMPANY_BRAND} does not hold or release these funds.
      </P>
      <P>
        If a transaction has not yet settled and you need it stopped or reversed, contact your Operator as soon as possible. Your Operator will work with the Service Provider to attempt a stop or recall. Whether a recall is possible depends on the stage the transaction has reached and the Service Provider's operational policies — once funds have left the Service Provider's account, recall is rarely possible.
      </P>
      <P>
        Once a transaction has settled at the destination, refunds are governed by the Service Provider's terms and by applicable law. {COMPANY_BRAND} can assist with documentation and communication but cannot order or guarantee a refund.
      </P>

      <H2>Scenario 2: Platform fees paid to {COMPANY_BRAND}</H2>
      <P>
        Operators pay {COMPANY_BRAND} a share of the markup on each transaction; Service Providers pay {COMPANY_BRAND} a routing fee. Customers do not pay {COMPANY_BRAND} directly.
      </P>
      <P>
        Where a transaction is reversed, recalled, or fails entirely after a fee has been booked, the corresponding fee owed to {COMPANY_BRAND} will be waived or, if already invoiced, credited against the next billing cycle. We do not issue cash refunds for platform fees outside this scenario.
      </P>

      <H2>How to request</H2>
      <P>
        Send the request to <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a> with the transaction reference, the amount in question, and the reason. Where the request relates to a transaction routed via a Service Provider, copy your Operator on the message — they have the relationship with the Service Provider and will be the ones progressing it.
      </P>

      <H2>Timeline</H2>
      <P>
        Platform-fee waivers or credits are typically processed within seven (7) business days of confirmation that the underlying transaction was reversed. Transaction-level refunds depend on the Service Provider and can range from a few days to several weeks; the Service Provider sets the pace.
      </P>

      <H2>Chargebacks and disputes</H2>
      <P>
        If you initiate a chargeback or dispute with your bank, card issuer, or any other payment processor for a transaction you initiated on the Platform, we may suspend your account pending resolution and may share documentation about the transaction with the disputing institution to support the response.
      </P>

      <H2>Questions</H2>
      <P>
        Email <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a> with the subject line "Refund question".
      </P>
    </LegalLayout>
  );
}

// =============================================================================
// MSA — Master Service Agreement template for Service Providers
//
// This is a *template*. It is not intended to be self-executing — Service
// Providers should sign an executed counterpart that has been reviewed by both
// parties' counsel. Posting it here lets prospective providers see the terms
// up front before entering serious onboarding conversations.
// =============================================================================

export function ServiceProviderMSA() {
  return (
    <LegalLayout title="Master Service Agreement (Service Providers)" kind="Template">
      <div className="rounded-xl p-4 text-xs mb-6" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.25)", color: "var(--ink)" }}>
        <strong>Template.</strong> This is a template Master Service Agreement that {COMPANY_BRAND} uses as the starting point for arrangements with licensed payment Service Providers. It is shared here for transparency. The version executed between {COMPANY_BRAND} and any specific Service Provider may differ. Nothing on this page is itself a binding contract; binding terms apply only after a counterpart is executed by both parties.
      </div>

      <P>
        This Master Service Agreement ("<strong>Agreement</strong>") is entered into between {COMPANY_LEGAL_NAME} ("<strong>{COMPANY_BRAND}</strong>") and the licensed payment provider that countersigns this Agreement (the "<strong>Service Provider</strong>"). It governs the routing of transactions from {COMPANY_BRAND}'s Platform to the Service Provider for regulated execution.
      </P>

      <H2>1. Definitions</H2>
      <UL>
        <li><strong>Platform</strong> — the {COMPANY_BRAND} software platform, including the operator dashboard, customer portal, provider portal, and supporting APIs.</li>
        <li><strong>Operator</strong> — a User of the Platform who introduces Customers and routes transactions.</li>
        <li><strong>Customer</strong> — a User of the Platform who initiates payments to a Recipient.</li>
        <li><strong>Recipient</strong> — the ultimate beneficiary of a payment.</li>
        <li><strong>KYC Package</strong> — the bundle of identity and compliance documents assembled by the Platform and made available to the Service Provider for a Customer or Recipient.</li>
        <li><strong>Routing Fee</strong> — the fee owed by the Service Provider to {COMPANY_BRAND} for transactions routed through it, as defined in Section 4.</li>
      </UL>

      <H2>2. Services {COMPANY_BRAND} provides</H2>
      <UL>
        <li>Software access to the provider portal, including a transactions feed, KYC queue, billing ledger, and team-management tools.</li>
        <li>Assembly and delivery of KYC Packages and supporting compliance documentation for each Customer and Recipient the Service Provider receives.</li>
        <li>Programmatic access via API (where the Service Provider has API capability) or manual order delivery via portal (for OTC providers without an API).</li>
        <li>Audit-log access and exportable reports.</li>
        <li>Coordination with Operators on amendments, cancellations, and exception handling.</li>
      </UL>

      <H2>3. Services the Service Provider provides</H2>
      <UL>
        <li>Regulated execution of payment transactions routed via the Platform, in accordance with the Service Provider's licenses and applicable law.</li>
        <li>Acceptance, review, and verdict on KYC Packages presented for routed Customers and Recipients, within the timeframes specified in the Service Level Schedule (Schedule A).</li>
        <li>Status updates back to the Platform (whether via API webhook or manual portal update) reflecting key transaction milestones.</li>
        <li>Independent compliance with sanctions, anti-money-laundering, and reporting obligations to the regulators that license it.</li>
      </UL>

      <H2>4. Routing Fee</H2>
      <P>
        The Service Provider shall pay {COMPANY_BRAND} a Routing Fee equal to 0.2% (twenty basis points) of the source amount of each transaction routed through the Service Provider and settled. The applicable rate is recorded against each fee accrual at the time of settlement and is not affected by subsequent changes to the headline rate.
      </P>
      <P>
        Fees accrue automatically in {COMPANY_BRAND}'s ledger at the moment a transaction reaches a settled state. {COMPANY_BRAND} consolidates all accrued lines for a calendar month into a single invoice issued to the Service Provider in the first ten (10) business days of the following month, payable within thirty (30) days of issue by wire, ACH, or bank transfer.
      </P>
      <P>
        Late payments accrue interest at the lesser of 1.0% per month or the maximum permitted by applicable law. {COMPANY_BRAND} may suspend routing if an invoice is more than sixty (60) days past due.
      </P>

      <H2>5. Data sharing and privacy</H2>
      <P>
        {COMPANY_BRAND} shares KYC Packages, transaction details, and supporting documentation with the Service Provider strictly to enable the Service Provider to fulfill its regulated obligations. The Service Provider shall (i) handle this data in accordance with applicable data-protection laws (including NDPA, GDPR, CCPA, where relevant); (ii) implement reasonable technical and organizational measures to protect it; and (iii) not use it for any purpose other than executing routed transactions and meeting its own compliance and reporting obligations.
      </P>
      <P>
        Where a User exercises a data-subject right (access, deletion, etc.) and the Service Provider holds responsive data, the parties will cooperate to respond within the timeframes required by law.
      </P>

      <H2>6. Service Levels</H2>
      <P>
        Specific service-level commitments (KYC review turnaround, transaction status reporting, API uptime if applicable) are set out in Schedule A to the executed counterpart. Repeated or material breaches of Schedule A are grounds for termination under Section 11.
      </P>

      <H2>7. Confidentiality</H2>
      <P>
        Each party may receive non-public information from the other ("<strong>Confidential Information</strong>"). The receiving party will (i) use Confidential Information only to perform under this Agreement; (ii) not disclose it to third parties without the disclosing party's prior written consent (other than to professional advisors bound by confidentiality); and (iii) protect it with at least the same care it uses for its own confidential information.
      </P>

      <H2>8. Intellectual Property</H2>
      <P>
        {COMPANY_BRAND} retains all rights, title, and interest in the Platform, including all software, designs, and trademarks. The Service Provider receives only the limited right to use the Platform during the term of this Agreement, solely for routed-transaction servicing.
      </P>
      <P>
        Any data, documents, or compliance artifacts the Service Provider generates and shares back via the Platform are owned by the Service Provider, with {COMPANY_BRAND} receiving a license to store, route, and display them to the relevant Operator and Customer.
      </P>

      <H2>9. Representations and warranties</H2>
      <UL>
        <li>The Service Provider represents that it holds, and shall maintain throughout the term, all licenses required to perform the payment services it executes via routing under this Agreement.</li>
        <li>{COMPANY_BRAND} represents that it has the right to make the Platform available and to deliver KYC Packages as described.</li>
        <li>Each party represents that it has full authority to enter and perform under this Agreement.</li>
      </UL>

      <H2>10. Indemnification</H2>
      <P>
        Each party shall indemnify and hold the other harmless from third-party claims arising from (i) its own breach of this Agreement, (ii) its own violation of law, or (iii) its own gross negligence or wilful misconduct. The indemnifying party shall control the defense, provided that no settlement requiring an admission of liability by the indemnified party shall be entered without that party's prior written consent.
      </P>

      <H2>11. Limitation of liability</H2>
      <P>
        Except for breaches of confidentiality or indemnification obligations, neither party shall be liable to the other for indirect, incidental, special, consequential, or punitive damages, or for lost profits or lost data, arising from this Agreement. Each party's aggregate liability for any other claim shall not exceed the total Routing Fees paid or payable under this Agreement in the twelve (12) months preceding the event giving rise to the claim.
      </P>

      <H2>12. Term and termination</H2>
      <P>
        This Agreement begins on the date the counterpart is countersigned and continues until terminated. Either party may terminate (i) on ninety (90) days' written notice for convenience; (ii) immediately for material breach not cured within thirty (30) days of written notice; or (iii) immediately if the other party becomes insolvent, files for bankruptcy, or has its licenses suspended or revoked. On termination, all accrued amounts become due, and confidentiality, indemnification, IP, and limitation-of-liability provisions survive.
      </P>

      <H2>13. Governing law and disputes</H2>
      <P>
        This Agreement is governed by the laws of the State of Delaware, USA, without regard to its conflict-of-laws principles. Disputes shall be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules, seated in Wilmington, Delaware. Either party may seek injunctive relief in any court of competent jurisdiction to protect its IP or Confidential Information.
      </P>

      <H2>14. General</H2>
      <UL>
        <li><strong>Assignment.</strong> Neither party may assign this Agreement without the other's prior written consent, except to a successor in connection with a merger, acquisition, or sale of substantially all assets.</li>
        <li><strong>Independent contractors.</strong> The parties are independent contractors; nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship.</li>
        <li><strong>Force majeure.</strong> Neither party is liable for delays caused by events beyond its reasonable control, including natural disasters, outages of third-party services, and acts of government.</li>
        <li><strong>Entire agreement.</strong> This Agreement, together with any executed schedules, constitutes the entire agreement between the parties on its subject matter and supersedes prior discussions and writings.</li>
        <li><strong>Notices.</strong> Notices under this Agreement must be in writing and sent to the email or postal address on the cover page of the executed counterpart.</li>
      </UL>

      <H2>Contact for prospective Service Providers</H2>
      <P>
        If you are a licensed payment provider interested in onboarding, write to <a href={`mailto:${COMPANY_EMAIL}`} className="underline" style={{ color: "var(--emerald)" }}>{COMPANY_EMAIL}</a> with "Provider onboarding" in the subject line. We will share the executable counterpart with the corporate schedule (cover page, Schedule A service levels, Schedule B pricing addendum) once initial diligence has been completed.
      </P>
    </LegalLayout>
  );
}
