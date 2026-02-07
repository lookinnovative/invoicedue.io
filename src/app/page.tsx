import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Avatar stack component for social proof
function AvatarStack({ count = 5 }: { count?: number }) {
  // Using initials as placeholder avatars with varied colors
  const avatars = [
    { initials: 'JD', bg: 'bg-blue-500' },
    { initials: 'SK', bg: 'bg-green-500' },
    { initials: 'MR', bg: 'bg-purple-500' },
    { initials: 'AL', bg: 'bg-orange-500' },
    { initials: 'TC', bg: 'bg-pink-500' },
  ].slice(0, count);

  return (
    <div className="flex -space-x-3">
      {avatars.map((avatar, i) => (
        <div
          key={i}
          className={`w-10 h-10 rounded-full ${avatar.bg} border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
        >
          {avatar.initials}
        </div>
      ))}
    </div>
  );
}

// Pricing card component
function PricingCard({
  name,
  price,
  invoices,
  description,
  popular = false,
  isContact = false,
}: {
  name: string;
  price: string;
  invoices: string;
  description: string;
  popular?: boolean;
  isContact?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border p-6 ${
        popular
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border bg-card'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Most popular
          </span>
        </div>
      )}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <div className="mt-4">
          {isContact ? (
            <span className="text-2xl font-bold text-foreground">Contact us</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-foreground">{price}</span>
              <span className="text-muted-foreground"> / month</span>
            </>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{invoices}</p>
        <p className="mt-4 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          {isContact ? (
            <Button variant="outline" className="w-full" asChild>
              <Link href="mailto:sales@invoicedue.io">Get in touch</Link>
            </Button>
          ) : (
            <Button
              className={`w-full ${popular ? '' : 'bg-primary'}`}
              asChild
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// FAQ item component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-border py-6">
      <h3 className="text-base font-medium text-foreground">{question}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            InvoiceDue
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button size="sm" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Get paid faster without chasing invoices
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            InvoiceDue automatically follows up on overdue invoices with
            friendly calls and payment links — so you can focus on your
            business, not collections.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6">
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/signup">
                Start free 7-day trial — no credit card required
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <AvatarStack count={5} />
              <p className="text-sm text-muted-foreground">
                Trusted by finance teams
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to getting paid on time
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">
                Upload your invoices
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Import your overdue invoices with a simple CSV upload. Takes
                less than a minute.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">
                We contact your customers
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Friendly, professional calls are placed automatically. Payment
                links are sent via text.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">
                You get paid
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Customers pay through your Stripe link. You see results in your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <AvatarStack count={5} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Built for finance teams and AR managers
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            InvoiceDue is used by accounts receivable teams who want to reduce
            overdue invoices without hiring more staff or spending hours on the
            phone.
          </p>
        </div>
      </section>

      {/* Who It's For / Not For */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Is InvoiceDue right for you?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Who it's for */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="text-green-500">✓</span> InvoiceDue is for
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    B2B companies with Net-30, Net-45, or Net-60 payment terms
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    Finance teams tired of manually chasing overdue invoices
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    Service businesses, agencies, and professional services
                    firms
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    AR managers who want visibility into follow-up activity
                  </span>
                </li>
              </ul>
            </div>
            {/* Who it's not for */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="text-red-500">✗</span> InvoiceDue is not for
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    Consumer billing (B2C subscriptions, memberships)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    SaaS companies that shut off access for non-payment
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    Businesses needing debt collection or legal enforcement
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    High-volume transaction processing (1000s of invoices/day)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Simple, predictable pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <PricingCard
              name="Starter"
              price="$49"
              invoices="Up to 25 invoices / month"
              description="Perfect for small businesses just getting started with AR automation."
            />
            <PricingCard
              name="Growth"
              price="$149"
              invoices="Up to 100 invoices / month"
              description="For growing teams with regular invoicing needs."
              popular
            />
            <PricingCard
              name="Scale"
              price="$399"
              invoices="Up to 500 invoices / month"
              description="Built for finance departments with high invoice volume."
            />
            <PricingCard
              name="Enterprise"
              price=""
              invoices="Custom volume"
              description="Custom integrations, dedicated support, and volume pricing."
              isContact
            />
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include: Unlimited calls • Payment link delivery •
              Dashboard access • Email support
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div>
            <FAQItem
              question="What happens during the free trial?"
              answer="You get full access to InvoiceDue for 7 days. Upload invoices, configure your follow-up policy, and see calls placed on your behalf. No credit card required to start."
            />
            <FAQItem
              question="Do you take payments on my behalf?"
              answer="No. We send your customers a link to your Stripe payment page. You maintain full control over payment processing and receive funds directly in your Stripe account."
            />
            <FAQItem
              question="What happens if a customer calls back?"
              answer="Customers are prompted to use the payment link we send. InvoiceDue does not handle inbound calls — this keeps things simple and ensures your team stays in control of customer relationships."
            />
            <FAQItem
              question="Can I pause or stop outreach?"
              answer="Yes. You have full control over your follow-up policy. Pause individual invoices, adjust call schedules, or turn off outreach entirely at any time from your dashboard."
            />
            <FAQItem
              question="Is this secure?"
              answer="Yes. InvoiceDue uses bank-level encryption for all data. We never store payment card information. Your customer data is isolated and only accessible by your account."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to get paid faster?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join finance teams who are reducing overdue invoices without the
            manual work.
          </p>
          <div className="mt-8">
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/signup">
                Start free 7-day trial — no credit card required
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Set up in 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} InvoiceDue. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign up
            </Link>
            <a
              href="mailto:support@invoicedue.io"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
