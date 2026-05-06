import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowUpRight,
  Instagram,
  Mail,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

const inquiryTypes = [
  {
    value: "inquiry",
    label: "General Inquiry",
    copy: "Start here for collector questions, introductions, or anything that needs a direct conversation.",
    subjectPlaceholder: "What would you like to talk about?",
    messagePlaceholder:
      "Tell me what caught your eye, what you need, and what would make the reply most useful.",
  },
  {
    value: "commission",
    label: "Commission Request",
    copy: "Best for custom work shaped around mood, scale, placement, deadline, and budget.",
    subjectPlaceholder: "Commission idea, size, or visual direction",
    messagePlaceholder:
      "Share the mood, dimensions, timeline, budget range, and any references or emotions you want the piece to carry.",
  },
  {
    value: "purchase",
    label: "Purchase Inquiry",
    copy: "Use this for pricing, availability, reservations, or questions about a specific piece.",
    subjectPlaceholder: "Artwork title or piece you are asking about",
    messagePlaceholder:
      "Mention the artwork and anything you want to know about availability, pricing, framing, or shipping.",
  },
  {
    value: "collaboration",
    label: "Collaboration",
    copy: "For projects, events, brand work, workshops, or any creative exchange worth exploring.",
    subjectPlaceholder: "Project name or collaboration idea",
    messagePlaceholder:
      "Describe the project, timeline, deliverables, and why the collaboration feels like a strong fit.",
  },
] as const;

type ContactLink = {
  title: string;
  value: string;
  href?: string;
  copy: string;
  icon: typeof Mail;
};

const contactLinks: ContactLink[] = [
  {
    title: "Email",
    value: "paperslayer99@gmail.com",
    href: "mailto:paperslayer99@gmail.com",
    copy: "The best place for detailed notes, references, and commission briefs.",
    icon: Mail,
  },
  {
    title: "Studio",
    value: "Sheoraphuli, West Bengal, India",
    copy: "Original works, commissions, and learning all come out of the same studio base.",
    icon: MapPin,
  },
  {
    title: "Instagram",
    value: "@paper_slayer99",
    href: "https://www.instagram.com/paper_slayer99/",
    copy: "A quicker way to connect before we move into details.",
    icon: Instagram,
  },
];

const premiumNotes = [
  "Reply window is usually within 24-48 hours.",
  "For commissions, mood, size, and budget help a lot.",
  "Collector and collaboration inquiries are both welcome.",
];

const Contact = () => {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "inquiry",
  });

  const selectedInquiry =
    inquiryTypes.find((inquiry) => inquiry.value === formData.type) ??
    inquiryTypes[0];

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to send message");
      }

      toast({
        title: "Message Sent",
        description:
          "Your message has been sent successfully. A reply will follow soon.",
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "inquiry",
      });
    } catch (error) {
      console.error("CONTACT FORM ERROR:", error);

      toast({
        variant: "destructive",
        title: "Message Failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while sending your message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden bg-background pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,hsl(var(--primary)/0.14),transparent_22%),radial-gradient(circle_at_86%_12%,hsl(var(--accent)/0.08),transparent_24%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(hsl(var(--foreground)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.12)_1px,transparent_1px)] [background-size:120px_120px]" />
        </div>

        <section className="relative py-8 sm:py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mobile-eyebrow text-primary sm:text-sm">
                Get in Touch
              </p>

              <h1 className="mobile-page-title mt-4 text-foreground">
                Let&apos;s create
                <span className="block text-gradient">together.</span>
              </h1>

              <p className="mobile-intro-copy mt-5 max-w-2xl text-muted-foreground">
                Whether you are interested in acquiring a piece, commissioning
                custom work, or starting a collaboration, this page should feel
                clear and easy to act on from the first screen.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10">
              <div className="grid grid-cols-1 gap-6">
                <div className="app-surface relative border-primary/18 bg-[linear-gradient(160deg,hsl(var(--card)/0.92),hsl(var(--background)/0.86))] p-4 sm:p-7">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

                  <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-4 py-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="mobile-label text-primary">
                      Studio Notes
                    </span>
                  </div>

                  <p className="mt-5 max-w-md font-display text-xl leading-[1.12] text-foreground sm:text-3xl">
                    The strongest messages usually begin with the mood, the
                    scale, and what you want the work to do in the room.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                    {premiumNotes.map((note) => (
                      <div
                        key={note}
                        className="rounded-[1.25rem] border border-border/50 bg-background/35 px-4 py-4 text-sm leading-relaxed text-muted-foreground"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-1">
                  {contactLinks.map((item) => {
                    const Icon = item.icon;

                    if (item.href) {
                      return (
                        <a
                          key={item.title}
                          href={item.href}
                          target={
                            item.href.startsWith("http") ? "_blank" : undefined
                          }
                          rel={
                            item.href.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="app-surface group flex min-h-12 flex-col gap-4 border border-border/55 bg-card/55 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-card/70 sm:flex-row sm:items-start"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/20 bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm uppercase tracking-[0.24em] text-muted-foreground">
                              {item.title}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <p className="break-all text-foreground transition-colors group-hover:text-primary">
                                {item.value}
                              </p>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {item.copy}
                            </p>
                          </div>
                        </a>
                      );
                    }

                    return (
                      <div
                        key={item.title}
                        className="app-surface flex min-h-12 flex-col gap-4 border border-border/55 bg-card/55 p-5 sm:flex-row sm:items-start"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/20 bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-sm uppercase tracking-[0.24em] text-muted-foreground">
                            {item.title}
                          </p>
                          <p className="mt-2 text-foreground">{item.value}</p>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {item.copy}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 translate-x-3 translate-y-3 border border-primary/16 bg-primary/5" />

                <div className="relative overflow-hidden border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.94),hsl(var(--background)/0.92))] p-4 shadow-[0_28px_90px_hsl(0_0%_0%/0.3)] backdrop-blur-xl sm:p-6 lg:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_28%)]" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

                  <div className="relative">
                    <div className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-start sm:justify-between sm:pb-5">
                      <div>
                        <p className="mobile-eyebrow text-primary">
                          {selectedInquiry.label}
                        </p>
                        <h2 className="mobile-section-title mt-3 text-foreground sm:text-4xl">
                          Start a conversation.
                        </h2>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center border border-primary/25 bg-primary/10">
                        <Send className="h-4 w-4 text-primary" />
                      </div>
                    </div>

                    <p className="mobile-body-copy mt-5 text-muted-foreground">
                      {selectedInquiry.copy}
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      className="mt-6 space-y-4 sm:space-y-5"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <Label className="font-display text-sm uppercase tracking-[0.24em] text-foreground/80">
                            Inquiry Type
                          </Label>

                          <span className="font-display text-[11px] uppercase tracking-[0.22em] text-primary">
                            {selectedInquiry.label}
                          </span>
                        </div>

                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-14 rounded-none border-primary/18 bg-[linear-gradient(180deg,hsl(var(--background)/0.78),hsl(var(--card)/0.7))] px-4 text-sm text-foreground shadow-[0_14px_36px_hsl(0_0%_0%/0.14)] ring-offset-0 focus:ring-1 focus:ring-primary focus:ring-offset-0 [&_svg]:text-primary [&_svg]:opacity-100">
                            <SelectValue placeholder="Choose an inquiry type" />
                          </SelectTrigger>

                          <SelectContent className="rounded-none border-primary/18 bg-[linear-gradient(180deg,hsl(var(--popover))_0%,hsl(var(--card))_100%)] p-2 shadow-[0_22px_70px_hsl(0_0%_0%/0.4)]">
                            {inquiryTypes.map((inquiry) => (
                              <SelectItem
                                key={inquiry.value}
                                value={inquiry.value}
                                className="rounded-none px-8 py-3 text-sm text-foreground focus:bg-primary/12 focus:text-foreground data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
                              >
                                {inquiry.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="font-display text-sm uppercase tracking-[0.24em] text-foreground/80"
                          >
                            Name
                          </Label>

                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="h-12 border-border/60 bg-background/55 px-4 focus-visible:ring-primary focus-visible:ring-offset-0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="font-display text-sm uppercase tracking-[0.24em] text-foreground/80"
                          >
                            Email
                          </Label>

                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="h-12 border-border/60 bg-background/55 px-4 focus-visible:ring-primary focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="subject"
                          className="font-display text-sm uppercase tracking-[0.24em] text-foreground/80"
                        >
                          Subject
                        </Label>

                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder={selectedInquiry.subjectPlaceholder}
                          className="h-12 border-border/60 bg-background/55 px-4 focus-visible:ring-primary focus-visible:ring-offset-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="message"
                          className="font-display text-sm uppercase tracking-[0.24em] text-foreground/80"
                        >
                          Message
                        </Label>

                        <Textarea
                          id="message"
                          name="message"
                          required
                          value={formData.message}
                          onChange={handleChange}
                          placeholder={selectedInquiry.messagePlaceholder}
                          rows={7}
                          className="min-h-[180px] resize-none border-border/60 bg-background/55 px-4 py-3 focus-visible:ring-primary focus-visible:ring-offset-0"
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="gold"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.2)]"
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Contact;
