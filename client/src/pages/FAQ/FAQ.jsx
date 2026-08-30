import { Link } from 'react-router-dom'
import { HelpCircle, MessageSquare } from 'lucide-react'

import Accordion from '../../components/common/Accordion'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ALL_FAQS } from '../../data/faqs'

export default function FAQ() {
  useDocumentTitle('FAQ')

  return (
    <>
      <section className="hero-gradient border-b border-ink-100">
        <div className="container-app py-10 lg:py-12">
          <Breadcrumbs items={[{ label: 'FAQ' }]} />
          <div className="max-w-2xl">
            <span className="badge-brand">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Help centre
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
            <p className="mt-3 text-lg text-ink-600">
              Answers to the questions patients ask most about booking, accounts, fees and privacy.
            </p>
          </div>
        </div>
      </section>

      <div className="container-app section">
        <div className="mx-auto max-w-3xl space-y-10">
          {ALL_FAQS.map((group) => (
            <section key={group.category} aria-labelledby={`faq-${group.category.replace(/\s+/g, '-')}`}>
              <h2
                id={`faq-${group.category.replace(/\s+/g, '-')}`}
                className="mb-4 text-xl font-bold sm:text-2xl"
              >
                {group.category}
              </h2>
              <Accordion items={group.items} allowMultiple />
            </section>
          ))}

          <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised shadow-sm">
              <MessageSquare className="h-6 w-6 text-brand-600" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink-900">Still need help?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Our support team is happy to walk you through anything that is not covered here.
            </p>
            <Link to="/contact" className="btn-primary mt-5">
              Contact support
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
