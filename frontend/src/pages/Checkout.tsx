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

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            <p className="mobile-eyebrow text-primary">
              Checkout
            </p>
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

                  <Button type="submit" className="w-full" size="lg">
                    Enquire on WhatsApp
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
