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
      className={`relative rounded-xl border p-6 flex flex-col h-full ${
        popular
          ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary'
          : 'border-slate-200 bg-white'
      }`}
    >
      {popular && (
        <div className="mb-4">
          <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            Most popular
          </span>
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-[22px] md:text-[24px] font-bold text-slate-900">
          {name}
        </h3>
        <div className="mt-4">
          {isContact ? (
            <span className="text-[38px] md:text-[42px] font-bold text-slate-900">
              Contact us
            </span>
          ) : (
            <>
              <span className="text-[38px] md:text-[42px] font-bold text-slate-900">
                {price}
              </span>
              <span className="text-slate-500 text-base font-medium"> / month</span>
            </>
          )}
        </div>
        <p className="mt-3 text-[17px] text-slate-600 font-medium">{positioning}</p>
        <ul className="mt-5 space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-[17px] text-slate-700 font-medium">
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
            className="block w-full text-center py-4 px-6 rounded-lg border-2 border-primary text-primary text-[17px] font-bold hover:bg-primary/5 transition-colors"
          >
            Get in touch
          </Link>
        ) : (
          <Link
            href="/signup"
            className="block w-full text-center py-4 px-6 rounded-lg text-[17px] font-bold transition-colors bg-primary text-white hover:bg-primary/90"
          >
            Start your free trial
          </Link>
        )}
      </div>
    </div>
  );
}

// How it works step card
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 flex flex-col h-full">
      <div className="text-[42px] font-bold text-primary mb-4">{number}</div>
      <h3 className="text-[20px] font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-[17px] text-slate-600 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            InvoiceDue
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[17px] text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-[17px] bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-[48px] md:text-[60px] lg:text-[64px] font-bold text-slate-900 leading-[1.1] tracking-tight">
            Are you still chasing invoices?
          </h1>
          <p className="mt-6 text-[17px] md:text-[18px] text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Your customers are busy. Following up takes time.
            InvoiceDue handles overdue invoice follow-ups with friendly calls and payment links.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-block bg-primary text-white text-[17px] md:text-[18px] font-bold px-10 py-4 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Start free trial
            </Link>
            <p className="mt-4 text-[15px] text-slate-500 font-medium">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Neutral Credibility Line */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[18px] text-slate-500 font-medium">
            Built to resolve outstanding invoices professionally and consistently.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[36px] md:text-[40px] font-bold text-slate-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-center text-[17px] text-slate-600 mb-12 font-medium">
            Three simple steps to resolve overdue invoices
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              number="1"
              title="Upload your invoices"
              description="Add your overdue invoices in minutes. Upload a CSV or connect your workflow. No system changes. No setup calls."
            />
            <StepCard
              number="2"
              title="We follow up professionally"
              description="InvoiceDue handles outreach for you. Friendly, consistent calls and payment links — sent automatically, on your schedule."
            />
            <StepCard
              number="3"
              title="You get paid"
              description="Customers pay. You stay focused. Payments go directly to you, with activity and results visible in your dashboard."
            />
          </div>
        </div>
      </section>

      {/* Is InvoiceDue Right for You? */}
      <section className="py-16 px-6 bg-slate-50/70">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[36px] md:text-[40px] font-bold text-slate-900 text-center mb-12">
            Is InvoiceDue right for you?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Who it's for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
              <h3 className="text-[22px] font-bold text-slate-900 flex items-center gap-2 mb-6">
                <span className="text-green-600">✓</span> Built for
              </h3>
              <ul className="space-y-4">
                <li className="text-[17px] text-slate-700 font-medium">
                  B2B customers on Net-30 or Net-60 terms
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  Finance teams tired of manual invoice follow-ups
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  Service businesses and professional firms
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  AR managers wanting outreach visibility
                </li>
              </ul>
            </div>
            {/* Who it's not for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
              <h3 className="text-[22px] font-bold text-slate-900 flex items-center gap-2 mb-6">
                <span className="text-slate-400">✕</span> Not a fit if you
              </h3>
              <ul className="space-y-4">
                <li className="text-[17px] text-slate-700 font-medium">
                  Consumer subscriptions or membership billing (for now)
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  Debt collection or legal enforcement workflows
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  Ultra-high-volume processing (thousands per day)
                </li>
                <li className="text-[17px] text-slate-700 font-medium">
                  One-off reminders without ongoing AR needs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[36px] md:text-[40px] font-bold text-slate-900 text-center mb-3">
            Simple, predictable pricing
          </h2>
          <p className="text-center text-[17px] text-slate-600 mb-12 font-medium">
            7-day free trial on all plans. No credit card required.
          </p>
          <div className="grid md:grid-cols-4 gap-5 items-stretch">
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
      <section className="py-16 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[36px] md:text-[40px] font-bold text-white">
            Ready to get paid faster?
          </h2>
          <p className="mt-4 text-[17px] text-white/80 font-medium">
            Join finance teams who are reducing overdue invoices without the manual work.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block bg-white text-primary text-[17px] md:text-[18px] font-bold px-10 py-4 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Start free trial
            </Link>
            <p className="mt-4 text-[15px] text-white/70 font-medium">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-primary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[15px] text-white/80 font-medium">
            © {new Date().getFullYear()} InvoiceDue. All rights reserved.
          </div>
          <div className="flex items-center gap-8 text-[15px]">
            <Link
              href="/login"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Sign up
            </Link>
            <a
              href="mailto:support@invoicedue.io"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
