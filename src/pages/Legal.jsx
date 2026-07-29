import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Datos de la entidad. Hay que rellenarlos antes de publicar: la Fair Trading
// Act exige que el consumidor sepa con quien contrata.
export const LEGAL_ENTITY = {
  company: 'Swapy Limited',
  nzbn: 'NZBN pending',
  address: 'Registered office to be confirmed, New Zealand',
  email: 'hello@swapy.co.nz',
  privacyEmail: 'privacy@swapy.co.nz',
}

const LAST_UPDATED = '29 July 2026'

const PRIVACY = {
  slug: 'privacy',
  title: 'Privacy Policy',
  intro: `This policy explains how ${LEGAL_ENTITY.company} ("Swapy", "we", "us") collects, uses, stores and discloses personal information. We are an agency under the Privacy Act 2020 and we handle personal information in line with the 13 information privacy principles (IPPs), including IPP3A, which took effect on 1 May 2026 and covers information we collect about you from a source other than you.`,
  sections: [
    {
      heading: '1. What we collect',
      body: [
        'Account information: your name, email address, password (stored as a hash, never in plain text), and any phone number, location or profile details you choose to add.',
        'Listing information: everything you publish about a vehicle, including photos, price, odometer reading, WOF status, self-contained certification and the city you select for the map.',
        'Messages and offers: the content of conversations and offers you exchange with other users through Swapy.',
        'Saved searches and favourites: the filters you save and the vehicles you save, so we can show them back to you.',
        'Technical information: IP address, browser type, device type, pages viewed and approximate location derived from your IP address. This is collected automatically when you use the site.',
      ],
    },
    {
      heading: '2. Why we collect it (IPP1)',
      body: [
        'To create and run your account, publish your listings and let buyers and sellers contact each other.',
        'To operate search, filtering and the map, and to show you saved searches and favourites.',
        'To detect and prevent fraud, scams, spam and misuse of the platform, and to enforce our Terms of Use.',
        'To respond when you contact us, and to meet our legal obligations.',
        'We do not collect personal information we do not need for these purposes.',
      ],
    },
    {
      heading: '3. Where we collect it from (IPP2, IPP3 and IPP3A)',
      body: [
        'We collect most information directly from you when you register, publish a listing, send a message or contact us.',
        'We may also receive information about you from another source, for example from a payment or identity verification provider, or from another user who reports a listing. Where IPP3A applies, we will tell you that we hold that information, why we hold it and how you can access or correct it, unless an exception in the Privacy Act applies.',
      ],
    },
    {
      heading: '4. Public information',
      body: [
        'Anything you publish in a listing or on your public profile is visible to anyone who visits Swapy, including search engines. Do not put your home address, identity documents, bank details or anything else you would not want to be public in a listing, a photo or a message.',
      ],
    },
    {
      heading: '5. How we store and protect it (IPP5)',
      body: [
        'Your data is held in our database provider (Supabase) with access controls, and traffic between your browser and Swapy is encrypted in transit.',
        'Only people who need access to run the service can see personal information.',
        'No system is completely secure. If we suffer a privacy breach that has caused, or is likely to cause, serious harm, we will notify the Office of the Privacy Commissioner and the people affected as soon as practicable, as required by the Privacy Act 2020.',
      ],
    },
    {
      heading: '6. Who we share it with (IPP11)',
      body: [
        'Other users, but only the information you choose to publish or send them.',
        'Service providers who help us run Swapy: hosting, database, email delivery, error monitoring and, where applicable, payment processing. They may only use the information to provide their service to us.',
        'Law enforcement or regulators, where we are required or permitted by law to disclose it.',
        'We do not sell your personal information, and we do not share it with advertisers for their own marketing.',
      ],
    },
    {
      heading: '7. Sending information overseas (IPP12)',
      body: [
        'Some of our providers store or process data outside New Zealand. Before disclosing personal information to an overseas provider we satisfy ourselves that the provider is required to protect it with comparable safeguards to the Privacy Act 2020, or we rely on another basis permitted by IPP12.',
        'If you would like to know which providers we use and where they are located, email us and we will tell you.',
      ],
    },
    {
      heading: '8. How long we keep it (IPP9)',
      body: [
        'We keep your account information while your account is open. If you close your account we delete or anonymise your personal information within a reasonable period, unless we need to keep it to meet a legal obligation, resolve a dispute or investigate misuse.',
        'Messages between users may be retained after a listing ends so that both parties keep their record of the conversation.',
      ],
    },
    {
      heading: '9. Access and correction (IPP6 and IPP7)',
      body: [
        `You have the right to ask for a copy of the personal information we hold about you and to ask us to correct it if it is wrong. Email ${LEGAL_ENTITY.privacyEmail} and we will respond within 20 working days, as required by the Privacy Act 2020.`,
        'If we decline a request we will tell you why and explain how to complain.',
      ],
    },
    {
      heading: '10. Cookies and analytics',
      body: [
        'Swapy uses browser storage to keep you signed in and to remember your saved searches, favourites and filter preferences. These are necessary for the site to work.',
        'If we add analytics or marketing cookies, we will update this policy and ask for your consent before setting them.',
      ],
    },
    {
      heading: '11. Marketing messages',
      body: [
        'We only send you commercial electronic messages where you have consented or where consent is inferred under the Unsolicited Electronic Messages Act 2007. Every message includes who sent it and a working unsubscribe link, and we action unsubscribes promptly.',
        'Transactional messages, such as a reply to your listing or a password reset, are not marketing and are sent regardless.',
      ],
    },
    {
      heading: '12. Complaints',
      body: [
        `If you are unhappy with how we have handled your personal information, contact us first at ${LEGAL_ENTITY.privacyEmail}. If you are not satisfied with our response you can complain to the Office of the Privacy Commissioner at privacy.org.nz or on 0800 803 909.`,
      ],
    },
    {
      heading: '13. Changes to this policy',
      body: [
        'We may update this policy as Swapy changes. The date at the top shows when it was last updated. If a change materially affects how we use your personal information, we will tell you before it takes effect.',
      ],
    },
  ],
}

const TERMS = {
  slug: 'terms',
  title: 'Terms of Use',
  intro: `These terms are a contract between you and ${LEGAL_ENTITY.company} ("Swapy"). By using Swapy you accept them. If you do not accept them, do not use the site.`,
  sections: [
    {
      heading: '1. What Swapy is, and what it is not',
      body: [
        'Swapy is an online marketplace that lets people advertise campervans, motorhomes, van conversions and other vehicles in New Zealand, and lets buyers contact sellers.',
        'Swapy is not a party to any sale. We do not own, inspect, verify, store, deliver or guarantee any vehicle, we do not hold funds, and we are not an agent for either the buyer or the seller. The contract of sale is between the buyer and the seller.',
      ],
    },
    {
      heading: '2. Your account',
      body: [
        'You must be at least 18 years old to create an account.',
        'You are responsible for keeping your login details secure and for everything done through your account.',
        'You must give accurate information and keep it up to date.',
      ],
    },
    {
      heading: '3. Rules for listings',
      body: [
        'You may only list a vehicle you own or are authorised to sell.',
        'Your listing must be accurate and must not mislead. Under the Fair Trading Act 1986 it is illegal to make false or misleading representations about a vehicle, including its odometer reading, year, history, condition, WOF status or whether it is certified self-contained. Misleading conduct can result in penalties from the Commerce Commission.',
        'You must not tamper with an odometer or advertise a reading you know to be inaccurate.',
        'You must disclose known material defects, outstanding finance and any security interest registered on the Personal Property Securities Register (PPSR).',
        'One listing per vehicle. No duplicate, fake or placeholder listings.',
        'Photos must be of the actual vehicle and must be yours to use.',
      ],
    },
    {
      heading: '4. Private sellers and motor vehicle traders',
      body: [
        'If you are in the business of selling motor vehicles, you have extra obligations and you must comply with them yourself. Swapy does not do it for you.',
        'Under the Motor Vehicle Sales Act 2003 you generally must be a registered motor vehicle trader if you sell more than six vehicles, or import more than three vehicles, in any 12-month period, or if you are otherwise in the business of motor vehicle trading.',
        'Registered traders advertising a used vehicle online must display a Consumer Information Notice (CIN) with the advertisement, under the Consumer Information Standards (Used Motor Vehicles) Regulations 2008. Failing to do so is an infringement offence under the Fair Trading Act 1986.',
        'Traders also owe buyers the guarantees in the Consumer Guarantees Act 1993. Those guarantees generally do not apply to a genuine private sale between individuals.',
        'You must tell us, and make clear in your listing, if you are selling as a trader. Listing as a private seller when you are a trader is a breach of these terms and may be a breach of the law.',
      ],
    },
    {
      heading: '5. Rules for buyers',
      body: [
        'Do your own checks before you pay. View the vehicle in person, confirm the seller is who they say they are, check the WOF, the odometer, the registration and the PPSR, and consider a pre-purchase inspection.',
        'Never pay a deposit for a vehicle you have not seen, and be cautious with anyone who refuses to meet in person or pushes you to pay quickly.',
        'An offer made through Swapy is an indication of interest between you and the seller. Swapy is not a party to it and does not enforce it.',
      ],
    },
    {
      heading: '6. Prohibited conduct',
      body: [
        'Do not post content that is unlawful, misleading, abusive, harassing, discriminatory or that breaches the Harmful Digital Communications Act 2015.',
        'Do not infringe anyone’s intellectual property, including by using photos or text that are not yours.',
        'Do not scrape, copy or harvest listings or user data, and do not use Swapy to send spam.',
        'Do not attempt to interfere with the security or operation of the site.',
      ],
    },
    {
      heading: '7. Content you post',
      body: [
        'You keep ownership of the content you post. You give Swapy a non-exclusive, royalty-free licence to host, display and reproduce it for the purpose of operating and promoting the marketplace.',
        'You are responsible for your content and confirm you have the right to post it.',
      ],
    },
    {
      heading: '8. Moderation',
      body: [
        'We may edit, hide or remove any listing or message, and suspend or close any account, where we reasonably believe these terms or the law have been breached, or to protect other users.',
        'Where it is reasonable to do so, we will tell you why.',
      ],
    },
    {
      heading: '9. Fees',
      body: [
        'Listing on Swapy is free while the platform is in its early stage. If we introduce fees we will publish them and give notice before they take effect. Any price we display to consumers will include GST where GST applies.',
      ],
    },
    {
      heading: '10. Liability',
      body: [
        'Nothing in these terms limits your rights under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986 where those rights cannot lawfully be excluded.',
        'Where the law allows us to limit liability, Swapy is not liable for the acts or omissions of other users, for the condition, legality or description of any vehicle, or for any indirect or consequential loss.',
        'If you use Swapy for the purposes of a business, you agree that the Consumer Guarantees Act 1993 does not apply, to the extent permitted by section 43 of the Consumer Guarantees Act.',
      ],
    },
    {
      heading: '11. Disputes between users',
      body: [
        'Disputes about a vehicle or a sale are between the buyer and the seller. You can report a problem to us and we will act on breaches of these terms, but we cannot arbitrate a sale, order a refund or recover your money.',
        'Buyers who bought from a registered trader can take a dispute to the Motor Vehicle Disputes Tribunal. Consumer Protection at consumerprotection.govt.nz explains the options.',
      ],
    },
    {
      heading: '12. Changes and termination',
      body: [
        'We may change these terms. If a change is material we will give notice before it takes effect, and continuing to use Swapy after that means you accept the change.',
        'You can close your account at any time. We may close or suspend an account under clause 8.',
      ],
    },
    {
      heading: '13. Governing law',
      body: [
        'These terms are governed by New Zealand law, and the New Zealand courts have non-exclusive jurisdiction over any dispute.',
      ],
    },
    {
      heading: '14. Who we are',
      body: [
        `${LEGAL_ENTITY.company}, NZBN ${LEGAL_ENTITY.nzbn}. ${LEGAL_ENTITY.address}. Contact: ${LEGAL_ENTITY.email}.`,
      ],
    },
  ],
}

const DOCUMENTS = { privacy: PRIVACY, terms: TERMS }

export default function Legal({ document: documentKey = 'privacy' }) {
  const doc = DOCUMENTS[documentKey] || PRIVACY

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section legal-page">
        <header className="legal-head">
          <h1 className="page-title">{doc.title}</h1>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
          <p className="section-subtitle">{doc.intro}</p>
        </header>

        <div className="legal-body panel panel-pad">
          {doc.sections.map(section => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>

        <p className="legal-crosslink">
          {documentKey === 'privacy'
            ? <>See also our <Link to="/terms">Terms of Use</Link>.</>
            : <>See also our <Link to="/privacy">Privacy Policy</Link>.</>}
        </p>
      </main>

      <Footer />
    </div>
  )
}
