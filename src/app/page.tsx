import Link from 'next/link';
import Image from 'next/image';

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
            Get paid faster without chasing invoices
          </h1>
          <p className="mt-6 text-[17px] md:text-[18px] text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            InvoiceDue automatically follows up on overdue invoices with
            friendly calls and payment links — so you can focus on your
            business, not collections.
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

          {/* Social Proof - Single Avatar Testimonial Card */}
          <div className="mt-16 flex justify-center">
            <div className="bg-slate-50 rounded-xl px-6 py-5 flex items-center gap-4 max-w-lg shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face"
                  alt="Sarah R."
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-[17px] text-slate-700 font-medium">
                  "Reduced our overdue invoices by 40% in the first month."
                </p>
                <p className="text-[15px] text-slate-500 mt-1 font-medium">
                  Sarah R., Finance Director
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Is InvoiceDue Right for You? */}
      <section className="py-16 px-6 bg-slate-50/70">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[34px] md:text-[38px] font-bold text-slate-900 text-center mb-12">
            Is InvoiceDue right for you?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Who it's for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[20px] font-bold text-slate-900 flex items-center gap-2">
                <span className="text-green-600">✓</span> Built for
              </h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>B2B with Net-30 or Net-60 terms</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>Finance teams tired of manual follow-up</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>Service businesses and professional firms</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>AR managers wanting outreach visibility</span>
                </li>
              </ul>
            </div>
            {/* Who it's not for */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[20px] font-bold text-slate-900 flex items-center gap-2">
                <span className="text-slate-400">✗</span> Not designed for
              </h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>High-frequency subscription auto-billing</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Platforms that shut off access for non-payment</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Debt collection or legal enforcement</span>
                </li>
                <li className="flex items-start gap-3 text-[17px] text-slate-700 font-medium">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Ultra-high volume (1000s of invoices/day)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[34px] md:text-[38px] font-bold text-slate-900 text-center mb-3">
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
          <h2 className="text-[34px] md:text-[38px] font-bold text-white">
            Ready to get paid faster?
          </h2>
          <p className="mt-4 text-[17px] text-white/80 font-medium">
            Join finance teams who are reducing overdue invoices without the
            manual work.
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
