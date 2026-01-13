import { useState } from "react";
import { Mail, MapPin, Instagram, Send } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent",
      description: "Thank you for reaching out. I'll get back to you soon!",
    });

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      type: "inquiry",
    });
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Layout>
      <div className="pt-20 min-h-screen">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                {/* Contact Info */}
                <div className="opacity-0 animate-fade-in-left">
                  <p className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-6">
                    Get in Touch
                  </p>
                  
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] mb-8">
                    Let's Create
                    <br />
                    <span className="text-gradient">Together</span>
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-md">
                    Whether you're interested in acquiring a piece, commissioning custom work, or simply want to say hello—I'd love to hear from you.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-1">
                          Email
                        </p>
                        <a
                          href="mailto:hello@elenavoss.art"
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          hello@elenavoss.art
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-1">
                          Studio
                        </p>
                        <p className="text-foreground">
                          Brooklyn, New York
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Instagram className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-1">
                          Instagram
                        </p>
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          @elenavoss.art
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="opacity-0 animate-fade-in-right [animation-delay:200ms]">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Inquiry Type */}
                    <div className="space-y-2">
                      <Label htmlFor="type" className="font-display text-sm uppercase tracking-widest">
                        Inquiry Type
                      </Label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full h-11 px-4 bg-card border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      >
                        <option value="inquiry">General Inquiry</option>
                        <option value="commission">Commission Request</option>
                        <option value="purchase">Purchase Inquiry</option>
                        <option value="collaboration">Collaboration</option>
                      </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-display text-sm uppercase tracking-widest">
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
                        className="bg-card border-border focus:border-primary"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-display text-sm uppercase tracking-widest">
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
                        className="bg-card border-border focus:border-primary"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="font-display text-sm uppercase tracking-widest">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What's this about?"
                        className="bg-card border-border focus:border-primary"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="font-display text-sm uppercase tracking-widest">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell me about your project, the piece you're interested in, or just say hello..."
                        rows={6}
                        className="bg-card border-border focus:border-primary resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full"
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
        </section>
      </div>
    </Layout>
  );
};

export default Contact;
