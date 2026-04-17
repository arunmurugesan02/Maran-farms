import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_NAME } from '@/lib/brand';

const WHATSAPP_NUMBER = '919876543210'; // Update with real farm number
const WHATSAPP_MSG = encodeURIComponent(`Hi ${BRAND_NAME}! I'd like to know more about your products.`);

const WhatsAppButton = () => (
  <motion.a
    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 1, type: 'spring' }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center group"
    aria-label="Chat on WhatsApp"
  >
    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
    <MessageCircle className="h-7 w-7 text-white relative z-10 fill-white" strokeWidth={1.5} />
    <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      Chat with us
    </span>
  </motion.a>
);

export default WhatsAppButton;
