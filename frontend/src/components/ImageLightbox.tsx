import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ImageLightbox = ({ images, currentIndex, open, onClose, onNavigate }: ImageLightboxProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, currentIndex, images.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-background/10 hover:bg-background/20 text-background flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
              className="absolute left-4 md:left-8 h-12 w-12 rounded-full bg-background/10 hover:bg-background/20 text-background flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
              className="absolute right-4 md:right-8 h-12 w-12 rounded-full bg-background/10 hover:bg-background/20 text-background flex items-center justify-center transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-background/10 text-background text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
