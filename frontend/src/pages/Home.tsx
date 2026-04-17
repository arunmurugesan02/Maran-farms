import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Leaf, Truck, Shield, Heart, Sprout, ArrowRight, Star, Play, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/use-products';

const stats = [
  { value: '5000+', label: 'Pieces Sold' },
  { value: '200+', label: 'Happy Customers' },
  { value: '6+', label: 'Product Varieties' },
  { value: '4.9', label: 'Rating', icon: Star },
];

const features = [
  { icon: Sprout, title: 'Premium Quality', desc: '100% natural, chemical-free farming', color: 'bg-accent' },
  { icon: Heart, title: 'Healthy Animals', desc: 'Vaccinated & well-cared pets', color: 'bg-destructive/10' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Doorstep delivery in 2-4 days', color: 'bg-secondary' },
  { icon: Shield, title: 'Secure Payment', desc: 'Razorpay powered transactions', color: 'bg-farm-gold/20' },
];

const testimonials = [
  { name: 'Murugan S', location: 'Dindigul', text: 'Ordered 2000 Super Napier sticks for my dairy farm. Sprouting was above 90%, delivery reached in 3 days. Will buy again.', rating: 5 },
  { name: 'Lakshmi R', location: 'Salem', text: 'Bought a rabbit pair for home. Both were healthy and active, no issues after 2 months. Packing was also safe.', rating: 4 },
  { name: 'Senthil K', location: 'Erode', text: 'Tried Makka Chola napier — growth is good in my land. Price is fair compared to local sellers. Bulk order pannittu vanthen.', rating: 5 },
];

const Home = () => {
  const { data: products = [] } = useProducts();
  const featured = products.slice(0, 4);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80"
            alt="Farm landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-6"
            >
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary-foreground">Farm Fresh Products</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-display text-background mb-5 leading-[1.1]">
              Quality Grass.{' '}
              <span className="text-primary">Healthy</span>{' '}
              Animals.
            </h1>
            <p className="text-background/70 text-lg mb-8 max-w-md leading-relaxed">
              From our farm to your doorstep — premium Super Napier grass and adorable, well-cared pets.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="rounded-xl h-12 px-8 font-semibold text-base gap-2 shine">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/shop?category=animals">
                <Button size="lg" variant="default" className="border rounded-xl h-12 px-8 font-semibold text-base border-background/30">
                  Explore Animals
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 hidden md:block"
        >
          <div className="glass-card rounded-2xl p-5 grid grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  {s.value}
                  {s.icon && <s.icon className="h-4 w-4 text-farm-gold fill-farm-gold" />}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border border-border/50 hover-lift cursor-default"
            >
              <div className={`h-12 w-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-primary mb-1">EXPLORE</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground">Shop by Category</h2>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { name: 'Fresh Grass', desc: 'Super Napier, Fodder & Oat — from ₹1.25/pc', img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800', link: '/shop?category=grass', emoji: '🌿' },
            { name: 'Healthy Animals', desc: 'Rabbits, Pigeons & Hamsters — vaccinated', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800', link: '/shop?category=animals', emoji: '🐾' },
          ].map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Link to={cat.link} className="group block relative rounded-2xl overflow-hidden h-64 md:h-72">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-3xl mb-2 block">{cat.emoji}</span>
                  <h3 className="text-2xl font-display text-background mb-1">{cat.name}</h3>
                  <p className="text-sm text-background/70 mb-4">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Shop Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-primary mb-1">TOP PICKS</p>
              <h2 className="text-3xl md:text-4xl font-display text-foreground">Featured Products</h2>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-1">TESTIMONIALS</p>
          <h2 className="text-3xl md:text-4xl font-display text-foreground">What Customers Say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border/50 p-6 hover-lift"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-farm-gold fill-farm-gold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full farm-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="farm-gradient rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary-foreground/30 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary-foreground/20 translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display text-primary-foreground mb-4">
              Ready to Start Farming?
            </h2>
            <p className="text-primary-foreground/70 max-w-md mx-auto mb-8">
              Browse our collection of premium grass and healthy animals. Free delivery on orders above ₹500.
            </p>
            <Link to="/shop">
              <Button size="lg" variant="secondary" className="rounded-xl h-12 px-8 font-semibold text-base">
                Explore Products <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
