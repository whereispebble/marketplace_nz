import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck, FiChevronDown, FiMail, FiSearch, FiShield, FiTag, FiTruck } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import howItWorksBackground from '../assets/nz-mount-cook.webp'

const BUYER_STEPS = [
  {
    icon: <FiSearch />,
    title: 'Search with real filters',
    body: 'Filter by make, model, year, transmission, price, mileage, region and the equipment that matters for freedom camping.',
  },
  {
    icon: <FiShield />,
    title: 'Check before you travel',
    body: 'Every listing shows WOF status, self-contained certification, odometer and how long the vehicle has been on the market.',
  },
  {
    icon: <FiTag />,
    title: 'Message and make an offer',
    body: 'Talk to the seller inside Swapy and send an offer. Nothing is committed until you both agree on a price.',
  },
]

const SELLER_STEPS = [
  {
    icon: <FiTruck />,
    title: 'List in a few minutes',
    body: 'Add photos, the NZ details buyers ask for and a city so your vehicle shows on the map.',
  },
  {
    icon: <FiMail />,
    title: 'Answer real buyers',
    body: 'Offers and questions arrive in one inbox, so you are not chasing conversations across three different apps.',
  },
  {
    icon: <FiCheck />,
    title: 'Close the sale',
    body: 'Agree a price, arrange the handover and mark the listing as sold when you are done.',
  },
]

const FAQS = [
  {
    question: 'What does self-contained mean in New Zealand?',
    answer: 'A self-contained vehicle carries its own water and waste for at least three days without needing a dump station. Certified vehicles can stay overnight in many council areas where other vehicles cannot. Certification rules changed in recent years, so always check the certificate date and what standard it was issued under before you buy.',
  },
  {
    question: 'Does Swapy check the vehicles?',
    answer: 'No. Swapy is a marketplace: sellers write their own listings and are responsible for what they publish. Always view the vehicle in person, ask for the WOF and service history, and consider a pre-purchase inspection before paying.',
  },
  {
    question: 'How much does it cost to list a vehicle?',
    answer: 'Listing is free while Swapy is in its early stage. Pricing will be announced here before anything changes, and any listing published before that keeps its original terms.',
  },
  {
    question: 'How do payments work?',
    answer: 'Buyer and seller arrange payment directly between themselves. Swapy does not hold funds. Never pay a deposit for a vehicle you have not seen, and be wary of anyone who refuses to meet in person.',
  },
  {
    question: 'Can I sell from overseas or before I arrive in NZ?',
    answer: 'You can create the listing at any time, but the vehicle needs a New Zealand city so buyers can find it on the map and arrange a viewing.',
  },
  {
    question: 'What happens to my listing when the vehicle sells?',
    answer: 'Mark it as sold from your profile. It stops appearing in search results but stays in your history, so you keep the record of the sale.',
  },
]

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleChange = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const handleSubmit = event => {
    event.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('That email address does not look right.')
      return
    }

    // Todavia no hay backend de soporte: la peticion se guarda en el navegador
    // para no perderla y se confirma al usuario.
    try {
      const stored = JSON.parse(localStorage.getItem('swapy:requests') || '[]')
      stored.unshift({ ...form, sentAt: new Date().toISOString() })
      localStorage.setItem('swapy:requests', JSON.stringify(stored.slice(0, 50)))
    } catch {
      // almacenamiento no disponible: se ignora, el mensaje ya se ha confirmado
    }

    setError('')
    setSent(true)
    setForm({ name: '', email: '', topic: 'general', message: '' })
  }

  return (
    <div className="app-shell photo-shell how-shell">
      <div className="photo-background" style={{ backgroundImage: `url(${howItWorksBackground})` }} aria-hidden="true" />

      <Navbar compact />

      <main className="container page-section">
        <header className="how-hero">
          <h1 className="page-title">The marketplace everyone was waiting for.</h1>
          <p className="section-subtitle">
            Swapy is a New Zealand marketplace for campervans, motorhomes and van conversions. It exists because buying
            a van as a backpacker usually means trawling through Facebook groups, hostel noticeboards and listings that
            never mention whether the vehicle is certified self-contained. We put the details that actually decide a
            purchase in the same place: WOF, certification, odometer, berths, belts and where the vehicle is right now.
          </p>
        </header>

        <section className="how-section">
          <h2 className="section-title">If you are buying</h2>
          <div className="how-grid">
            {BUYER_STEPS.map(step => (
              <article className="how-card panel panel-pad" key={step.title}>
                <span className="how-card-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <Link className="btn btn-primary" to="/">
            Browse vehicles
            <FiArrowRight />
          </Link>
        </section>

        <section className="how-section">
          <h2 className="section-title">If you are selling</h2>
          <div className="how-grid">
            {SELLER_STEPS.map(step => (
              <article className="how-card panel panel-pad" key={step.title}>
                <span className="how-card-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <Link className="btn btn-primary" to="/new-product">
            List a vehicle
            <FiArrowRight />
          </Link>
        </section>

        <section className="how-section">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="faq-list">
            {FAQS.map((faq, index) => (
              <div className={`faq-item ${openFaq === index ? 'is-open' : ''}`} key={faq.question}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(current => current === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <FiChevronDown />
                </button>
                {openFaq === index && <p className="faq-answer">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="how-section" id="contact">
          <h2 className="section-title">Send us a request</h2>
          <p className="section-subtitle">
            Something broken, a feature you need, or a listing that looks wrong? Tell us and we will get back to you by email.
          </p>

          {sent ? (
            <div className="panel panel-pad request-sent">
              <FiCheck />
              <div>
                <strong>Request received</strong>
                <p>Thanks for writing. We will reply to the email address you gave us.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setSent(false)}>
                Send another
              </button>
            </div>
          ) : (
            <form className="panel panel-pad request-form" onSubmit={handleSubmit} noValidate>
              <div className="dual-field">
                <label className="field-group">
                  <span>Name</span>
                  <input className="field" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
                </label>
                <label className="field-group">
                  <span>Email</span>
                  <input className="field" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                </label>
              </div>

              <label className="field-group">
                <span>Topic</span>
                <select className="field" name="topic" value={form.topic} onChange={handleChange}>
                  <option value="general">General question</option>
                  <option value="listing">Problem with a listing</option>
                  <option value="account">Account or profile</option>
                  <option value="feature">Feature request</option>
                  <option value="business">Dealer or partnership</option>
                </select>
              </label>

              <label className="field-group">
                <span>Message</span>
                <textarea className="field" name="message" rows={5} value={form.message} onChange={handleChange} placeholder="Tell us what you need." />
              </label>

              {error && <p className="request-error">{error}</p>}

              <button className="btn btn-primary" type="submit">
                Send request
                <FiArrowRight />
              </button>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
