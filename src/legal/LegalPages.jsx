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
