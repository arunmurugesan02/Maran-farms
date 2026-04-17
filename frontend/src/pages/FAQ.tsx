import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Truck, CreditCard, RefreshCw, Package, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_SHORT_NAME, BRAND_WHATSAPP_NUMBER } from '@/lib/brand';

const categories = [
  {
    icon: Package,
    title: 'Orders & Minimum Quantity',
    faqs: [
      { q: 'What is the minimum order quantity?', a: 'For all Napier varieties and plants, the minimum order is 500 sticks/pieces. For animals (rabbits, hamsters, birds), there is no minimum — you can order a single pair.' },
      { q: 'Can I order mixed Napier varieties?', a: 'Yes! You can mix different Napier varieties as long as the total quantity per variety meets the 500-piece minimum.' },
      { q: 'Do you offer bulk pricing?', a: 'Yes, for orders above 5000 sticks we offer special bulk rates. Use the "Bulk Order" button to send us an enquiry on WhatsApp for a custom quote.' },
    ],
  },
  {
    icon: Truck,
    title: 'Delivery & Shipping',
    faqs: [
      { q: 'How long does delivery take?', a: 'Grass and plants are delivered within 2-4 days across Tamil Nadu. For other states, delivery may take 4-7 days depending on location.' },
      { q: 'Do you deliver everywhere in India?', a: 'We primarily serve Tamil Nadu, Kerala, Karnataka, and Andhra Pradesh. For other states, please contact us via WhatsApp to confirm delivery feasibility.' },
      { q: 'Is delivery free?', a: 'Delivery is FREE for all orders above ₹500. For smaller orders, a flat ₹40 delivery charge applies.' },
      { q: 'How are animals delivered?', a: 'Animals (rabbits, birds, hamsters) are pickup-only from our farm in Madurai for safety and comfort. We do not ship live animals via courier.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payment',
    faqs: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (Google Pay, PhonePe, Paytm), all major debit/credit cards, net banking, and Cash on Delivery (selected pincodes).' },
      { q: 'Is online payment secure?', a: 'Yes, all payments are processed via Razorpay with 256-bit SSL encryption. We never store your card details.' },
      { q: 'Do I get an invoice?', a: 'Yes, a digital invoice is sent to your registered email immediately after payment.' },
    ],
  },
  {
    icon: RefreshCw,
    title: 'Returns & Refunds',
    faqs: [
      { q: 'What if my Napier sticks don\'t sprout?', a: 'We guarantee 85%+ sprouting rate. If your sprouting falls below this, send us photos within 15 days and we will replace the affected quantity free of charge.' },
      { q: 'Can I return live animals?', a: 'Animal sales are final due to health and welfare concerns. However, if an animal shows signs of illness within 48 hours of pickup, contact us immediately for veterinary support.' },
      { q: 'How do refunds work?', a: 'Approved refunds are processed within 5-7 business days back to your original payment method.' },
    ],
  },
  {
    icon: Sprout,
    title: 'Growing & Care',
    faqs: [
      { q: 'How many Napier sticks do I need per acre?', a: 'Approximately 4000-5000 sticks per acre with standard 2x2 ft spacing. For higher density planting, you may need up to 8000 sticks per acre.' },
      { q: 'When is the best time to plant Napier?', a: 'Napier can be planted year-round in Tamil Nadu, but the best results come from planting at the start of the monsoon (June-July) or post-monsoon (October-November).' },
      { q: 'How long until first harvest?', a: 'First harvest is typically 60-75 days after planting. Subsequent harvests every 35-45 days for up to 4-5 years.' },
      { q: 'Are your animals vaccinated?', a: 'Yes, all our rabbits and chicks are vaccinated and dewormed. We provide a vaccination card with each animal.' },
    ],
  },
];

const FAQ = () => (
  <div className="container py-12">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold mb-4">
        <HelpCircle className="h-3.5 w-3.5" /> SUPPORT
      </div>
      <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">Frequently Asked Questions</h1>
      <p className="text-muted-foreground">Got questions about our grass, plants, or animals? Find answers below or chat with us on WhatsApp.</p>
    </motion.div>

    <div className="max-w-3xl mx-auto space-y-8">
      {categories.map((cat, ci) => (
        <motion.div
          key={cat.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: ci * 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <cat.icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">{cat.title}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {cat.faqs.map((faq, i) => (
              <AccordionItem key={i} value={`${ci}-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline hover:text-primary">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      ))}
    </div>

    <div className="max-w-2xl mx-auto mt-12 p-8 farm-gradient rounded-2xl text-center">
      <h3 className="text-xl font-display text-primary-foreground mb-2">Still have questions?</h3>
      <p className="text-primary-foreground/80 text-sm mb-5">Our team is just a WhatsApp message away.</p>
      <a
        href={`https://wa.me/${BRAND_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi ${BRAND_SHORT_NAME}, I have a question`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-background text-foreground font-semibold text-sm hover:scale-105 transition-transform"
      >
        Chat on WhatsApp
      </a>
    </div>
  </div>
);

export default FAQ;
