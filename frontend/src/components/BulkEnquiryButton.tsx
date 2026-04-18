import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { BRAND_WHATSAPP_NUMBER } from "@/lib/brand";
import { createQuoteRequestApi } from "@/lib/api";
import { useProducts } from "@/hooks/use-products";

const BulkEnquiryButton = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    productId: "",
    customRequirement: "",
    quantity: "",
    notes: ""
  });
  const { data: products = [] } = useProducts();

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === form.productId),
    [form.productId, products]
  );
  const isOther = form.productId === "other";

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const qty = Number(form.quantity);
    const isGrass = selectedProduct?.type === "grass";

    if (form.name.trim().length < 2) {
      nextErrors.name = "Name is required";
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      nextErrors.phone = "Enter valid 10-digit phone";
    }
    if (!form.productId) {
      nextErrors.productId = "Select a product";
    }
    if (isOther && form.customRequirement.trim().length < 2) {
      nextErrors.customRequirement = "Enter custom requirement";
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      nextErrors.quantity = "Enter a valid quantity";
    } else if (isGrass && qty < 500) {
      nextErrors.quantity = "Minimum quantity for grass products is 500";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const qty = Number(form.quantity);
      const productName = isOther ? form.customRequirement.trim() : selectedProduct?.name || "";
      await createQuoteRequestApi({
        items: [
          isOther
            ? { productName, quantity: qty, note: form.notes.trim() || undefined }
            : { productId: selectedProduct?.id, quantity: qty, note: form.notes.trim() || undefined }
        ],
        contactName: form.name.trim(),
        phone: form.phone,
        message: form.notes.trim() || undefined
      });
      toast.success("Quote request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quote request failed");
    } finally {
      setIsSubmitting(false);
    }

    const msg = encodeURIComponent(
      `*Bulk Order Enquiry*\n\nName: ${form.name}\nPhone: ${form.phone}\nProduct: ${isOther ? form.customRequirement : selectedProduct?.name}\nQuantity: ${form.quantity}${form.notes ? `\nNotes: ${form.notes}` : ""}`
    );
    window.open(`https://wa.me/${BRAND_WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    toast.success("Opening WhatsApp...");
    setOpen(false);
    setForm({ name: "", phone: "", productId: "", customRequirement: "", quantity: "", notes: "" });
    setErrors({});
  };

  return (
    <>
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-50 px-4 h-11 sm:h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 text-sm font-semibold hover:scale-105 transition-transform"
      >
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Bulk Order</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Bulk Order Enquiry</DialogTitle>
            <DialogDescription>Share your quantity and delivery needs for a custom quote.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="be-name">Your Name *</Label>
              <Input id="be-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} maxLength={100} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="be-phone">Phone Number *</Label>
              <Input
                id="be-phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                inputMode="numeric"
                maxLength={10}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="be-product">Product *</Label>
              <Select value={form.productId} onValueChange={(value) => setForm((p) => ({ ...p, productId: value }))}>
                <SelectTrigger id="be-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-xs text-destructive mt-1">{errors.productId}</p>}
            </div>

            {isOther ? (
              <div>
                <Label htmlFor="be-custom">Custom Requirement *</Label>
                <Input id="be-custom" value={form.customRequirement} onChange={(e) => setForm((p) => ({ ...p, customRequirement: e.target.value }))} />
                {errors.customRequirement && <p className="text-xs text-destructive mt-1">{errors.customRequirement}</p>}
              </div>
            ) : null}

            <div>
              <Label htmlFor="be-qty">Quantity *</Label>
              <Input
                id="be-qty"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                inputMode="numeric"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {selectedProduct?.type === "grass" ? "Minimum 500 for grass products." : "No minimum for pets and birds."}
              </p>
              {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <Label htmlFor="be-notes">Additional Notes</Label>
              <Textarea id="be-notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} maxLength={500} />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Enquiry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkEnquiryButton;
