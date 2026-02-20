import Layout from "@/components/Layout";
import { Mail, MessageCircle, Phone } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Contact Kenfuse
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Reach our team for platform support, partnerships, product questions, and general business inquiries.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              For faster response, use WhatsApp or call during business hours. For official requests, use email.
            </p>

            <div className="mt-10 grid gap-5">
              <article className="bg-card border border-border rounded-xl p-6 shadow-card flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Business Email (Main)</p>
                  <a href="mailto:info@kenfuse.com" className="text-accent hover:underline text-lg font-medium">
                    info@kenfuse.com
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Use for corporate, legal, and primary business communication.</p>
                </div>
              </article>

              <article className="bg-card border border-border rounded-xl p-6 shadow-card flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Business Email (Webpage)</p>
                  <a href="mailto:peace@kenfuse.com" className="text-accent hover:underline text-lg font-medium">
                    peace@kenfuse.com
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Use for website support, feedback, and user assistance.</p>
                </div>
              </article>

              <article className="bg-card border border-border rounded-xl p-6 shadow-card flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Call</p>
                  <a href="tel:0115715716" className="text-accent hover:underline text-lg font-medium">
                    0115 715716
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Direct line for urgent support and service coordination.</p>
                </div>
              </article>

              <article className="bg-card border border-border rounded-xl p-6 shadow-card flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366]">
                  <MessageCircle size={18} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <a
                    href="https://wa.me/254115715716"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#25D366] hover:underline text-lg font-medium"
                  >
                    Chat on WhatsApp
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Quick updates and easy communication with our support team.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
