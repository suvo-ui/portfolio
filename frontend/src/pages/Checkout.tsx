import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { fadeUp } from "@/lib/motion";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailInquiry = async () => {
    try {
      setIsSendingEmail(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            type: "cart_purchase",

            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,

            items,

            total,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      alert("Purchase inquiry submitted successfully.");

      clearCart();

      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    } catch (error) {
      console.error(error);

      alert("Something went wrong.");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Build WhatsApp message with order details
    const orderItemsList = items
      .map(
        (item) =>
          `• ${item.title} (${item.type}) x${item.quantity} - INR ${item.price.toLocaleString()}`,
      )
      .join("\n");

    const whatsappMessage = encodeURIComponent(
      `Hello! I'd like to enquire about the following items:\n\n${orderItemsList}\n\nTotal: INR ${total.toLocaleString()}\n\nMy Contact Information:\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nAddress: ${formData.address}${formData.notes ? `\n\nNotes: ${formData.notes}` : ""}`,
    );

    const whatsappLink = `https://wa.me/8100135695?text=${whatsappMessage}`;
    window.open(whatsappLink, "_blank");

    clearCart();
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32 lg:px-8">
          <h1 className="mobile-page-title text-foreground sm:text-4xl">
            Your cart is empty
          </h1>
          <p className="mobile-body-copy mt-4 text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-6xl"
        >
          <div className="max-w-2xl">
            <p className="mobile-eyebrow text-primary">Checkout</p>
            <h1 className="mobile-page-title mt-4 text-foreground">
              Review your order.
            </h1>
            <p className="mobile-body-copy mt-4 text-muted-foreground">
              Keep the final step clean, readable, and easy to complete on any
              screen.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
            <Card className="border-border/60 bg-card/55 lg:sticky lg:top-28">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-2 border-b border-border/50 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm capitalize text-muted-foreground">
                          {item.type} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium sm:text-right">
                        INR {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between gap-4 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-right">
                        INR {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/55">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Shipping address"
                      required
                      className="min-h-[140px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special instructions or notes"
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Primary Email Inquiry */}
                    <Button
                      disabled={isSendingEmail}
                      type="button"
                      onClick={handleEmailInquiry}
                      size="lg"
                      className="
      h-14
      rounded-xl
      border border-primary/20
      bg-gradient-to-b
      from-primary
      to-yellow-600
      font-semibold
      text-black
      shadow-[0_12px_40px_rgba(255,180,0,0.28)]
      transition-all duration-300
      hover:scale-[1.01]
      hover:from-yellow-300
      hover:to-primary
      hover:shadow-[0_16px_55px_rgba(255,180,0,0.38)]
      active:scale-[0.98]
    "
                    >
                      {isSendingEmail ? "Sending..." : "Enquire on Email"}
                    </Button>

                    {/* Secondary WhatsApp */}
                    <Button
                      type="submit"
                      variant="outline"
                      size="lg"
                      className="
      h-14
      rounded-xl
      border border-emerald-500/30
      bg-emerald-500/10
      font-medium
      text-emerald-400
      backdrop-blur-xl
      transition-all duration-300
      hover:scale-[1.01]
      hover:border-emerald-400/50
      hover:bg-emerald-500/15
      hover:text-emerald-300
      active:scale-[0.98]
    "
                    >
                      Enquire on WhatsApp
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
