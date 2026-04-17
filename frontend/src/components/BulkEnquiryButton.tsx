import { useState } from 'react';
import { Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { BRAND_WHATSAPP_NUMBER } from '@/lib/brand';

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone'),
  product: z.string().min(1, 'Select a product'),
  quantity: z.string().trim().min(1, 'Enter quantity').max(20),
  notes: z.string().trim().max(500).optional(),
});

const BulkEnquiryButton = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', product: '', quantity: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = enquirySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const msg = encodeURIComponent(
      `*Bulk Order Enquiry*\n\nName: ${form.name}\nPhone: ${form.phone}\nProduct: ${form.product}\nQuantity: ${form.quantity}\n${form.notes ? `Notes: ${form.notes}` : ''}`
    );
    window.open(`https://wa.me/${BRAND_WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    toast.success('Opening WhatsApp to send your enquiry...');
    setOpen(false);
    setForm({ name: '', phone: '', product: '', quantity: '', notes: '' });
  };

  return (
    <>
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring' }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 px-4 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 text-sm font-semibold hover:scale-105 transition-transform"
      >
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Bulk Order</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Bulk Order Enquiry</DialogTitle>
            <DialogDescription>
              Looking for 1000+ pieces? Get a custom quote with bulk pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="be-name">Your Name *</Label>
              <Input id="be-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Karthick" maxLength={100} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="be-phone">Phone Number *</Label>
              <Input id="be-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" maxLength={10} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="be-product">Product *</Label>
              <Select value={form.product} onValueChange={v => setForm({ ...form, product: v })}>
                <SelectTrigger id="be-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Napier">Super Napier</SelectItem>
                  <SelectItem value="Red Napier">Red Napier</SelectItem>
                  <SelectItem value="Makka Chola Napier">Makka Chola Napier</SelectItem>
                  <SelectItem value="Kuttai Napier">Kuttai Napier</SelectItem>
                  <SelectItem value="Sustra Napier">Sustra Napier</SelectItem>
                  <SelectItem value="BH-18">BH-18</SelectItem>
                  <SelectItem value="Karumbu Napier">Karumbu Napier</SelectItem>
                  <SelectItem value="Jinjwa">Jinjwa</SelectItem>
                  <SelectItem value="Mulberry Plant/Stick">Mulberry Plant/Stick</SelectItem>
                  <SelectItem value="Ceteriya Plant">Ceteriya Plant</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.product && <p className="text-xs text-destructive mt-1">{errors.product}</p>}
            </div>
            <div>
              <Label htmlFor="be-qty">Quantity Needed *</Label>
              <Input id="be-qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 5000 sticks" maxLength={20} />
              {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="be-notes">Notes (optional)</Label>
              <Textarea id="be-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Delivery location, timeline, etc." rows={3} maxLength={500} />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-semibold">Send Enquiry on WhatsApp</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkEnquiryButton;
