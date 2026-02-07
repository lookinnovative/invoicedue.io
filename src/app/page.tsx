import Link from 'next/link';

// Pricing card component
function PricingCard({
  name,
  price,
  positioning,
  features,
  popular = false,
  isContact = false,
}: {
  name: string;
  price: string;
  positioning: string;
  features: string[];
  popular?: boolean;
  isContact?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border p-6 flex flex-col ${
        popular
          ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary'
          : 'border-slate-200 bg-white'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
            Most popular
          </span>
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
          {name}
        </h3>
        <div className="mt-4">
          {isContact ? (
            <span className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
              Contact us
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                {price}
              </span>
              <span className="text-slate-500 text-sm"> / month</span>
            </>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-600">{positioning}</p>
        <ul className="mt-5 space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-primary font-bold mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        {isContact ? (
          <Link
            href="mailto:sales@invoicedue.io"
            className="block w-full text-center py-3.5 px-6 rounded-lg border-2 border-slate-300 text-slate-700 font-bold hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Get in touch
          </Link>
        ) : (
          <Link
            href="/signup"
            className={`block w-full text-center py-3.5 px-6 rounded-lg font-bold transition-colors ${
              popular
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Start free trial
          </Link>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
            InvoiceDue
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Get paid faster without chasing invoices
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            InvoiceDue automatically follows up on overdue invoices with
            friendly calls and payment links — so you can focus on your
            business, not collections.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-block bg-primary text-white text-lg font-bold px-10 py-4 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Start free trial
            </Link>
            <p className="mt-4 text-sm text-slate-500">No credit card required</p>
          </div>

          {/* Social Proof - Single Avatar Validation */}
          <div className="mt-14 flex justify-center">
            <div className="bg-slate-50 rounded-xl px-6 py-5 flex items-center gap-4 max-w-md">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-medium text-lg flex-shrink-0 overflow-hidden">
                {/* Placeholder for real avatar - using initials */}
                <span>SR</span>
              </div>
              <div className="text-left">
                <p className="text-sm text-slate-700 font-medium">
                  "Reduced our overdue invoices by 40% in the first month."
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Sarah R., Finance Director
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Is InvoiceDue Right for You? */}
      <section className="py-14 px-6 bg-slate-50/70">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-slate-900 text-center mb-10"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Is InvoiceDue right for you?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Who it's for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3
                className="text-lg font-bold text-slate-900 flex items-center gap-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span className="text-green-600">✓</span> Built for
              </h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>B2B companies with Net-30 or Net-60 terms</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>Finance teams tired of manual follow-up</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>Service businesses and professional firms</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>AR managers who want visibility into outreach</span>
                </li>
              </ul>
            </div>
            {/* Who it's not for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3
                className="text-lg font-bold text-slate-900 flex items-center gap-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span className="text-slate-400">✗</span> Not designed for
              </h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>High-frequency subscription auto-billing</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Platforms that shut off access for non-payment</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Debt collection or legal enforcement</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Ultra-high volume (1000s of invoices/day)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-slate-900 text-center mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Simple, predictable pricing
          </h2>
          <p className="text-center text-slate-600 mb-10">
            7-day free trial on all plans. No credit card required.
          </p>
          <div className="grid md:grid-cols-4 gap-5">
            <PricingCard
              name="Starter"
              price="$49"
              positioning="For small teams getting started."
              features={[
                'Up to 25 invoices / month',
                'Automated call follow-up',
                'Payment link delivery',
              ]}
            />
            <PricingCard
              name="Growth"
              price="$149"
              positioning="For growing AR operations."
              features={[
                'Up to 100 invoices / month',
                'Priority call scheduling',
                'Full dashboard access',
              ]}
              popular
            />
            <PricingCard
              name="Scale"
              price="$399"
              positioning="For finance departments."
              features={[
                'Up to 500 invoices / month',
                'Advanced call policies',
                'Dedicated support',
              ]}
            />
            <PricingCard
              name="Enterprise"
              price=""
              positioning="Custom volume and integrations."
              features={[
                'Unlimited invoices',
                'Custom integrations',
                'SLA and onboarding',
              ]}
              isContact
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Ready to get paid faster?
          </h2>
          <p className="mt-4 text-slate-400">
            Join finance teams who are reducing overdue invoices without the
            manual work.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block bg-white text-slate-900 text-lg font-bold px-10 py-4 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Start free trial
            </Link>
            <p className="mt-4 text-sm text-slate-500">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} InvoiceDue. All rights reserved.
          </div>
          <div className="flex items-center gap-8 text-sm">
            <Link
              href="/login"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign up
            </Link>
            <a
              href="mailto:support@invoicedue.io"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
