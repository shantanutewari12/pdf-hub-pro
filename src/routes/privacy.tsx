import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PDF Master" },
      { name: "description", content: "How PDF Master handles your files and data." },
    ],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose prose-emerald">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider">Legal</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">Last updated: today</p>

          <div className="mt-8 space-y-6 text-foreground/90 leading-relaxed">
            <Section title="Your files belong to you">
              We process your documents only to perform the action you requested. We never read,
              share, or sell your files. All uploads are encrypted in transit with 256-bit SSL.
            </Section>
            <Section title="Files auto-delete">
              All processed files are permanently deleted from our servers within 30 minutes of
              processing — usually much sooner. We retain no copies.
            </Section>
            <Section title="Account data">
              When you sign up, we store your email and authentication credentials. We use this only
              to provide the service and never share it with third parties.
            </Section>
            <Section title="Cookies">
              We use essential cookies for authentication and a privacy-respecting analytics service
              to understand which features matter most. No advertising cookies, ever.
            </Section>
            <Section title="Contact">
              Questions about privacy? Email us at hello@pdfmaster.app.
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
