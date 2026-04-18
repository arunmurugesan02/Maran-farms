import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Truck, ShieldCheck, Award, ArrowRight, Star, ChevronRight, PhoneCall } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { motion } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { BRAND_NAME } from "@/lib/brand";

const trustPoints = [
  { icon: Award, label: "Quality Checked", value: "Farm-screened batches" },
  { icon: Truck, label: "Fast Dispatch", value: "Daily shipping support" },
  { icon: ShieldCheck, label: "Secure Payments", value: "Razorpay trusted gateway" }
];

const metrics = [
  { label: "Happy Customers", value: "200+" },
  { label: "Products Delivered", value: "5000+" },
  { label: "Top Rated", value: "4.9/5" }
];

const Home = () => {
  const { data: products = [], isLoading } = useProducts();
  const featured = products.slice(0, 4);

  return (
    <div className="overflow-hidden">
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80"
            alt="Maran Farms"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/65 to-foreground/20" />
        </div>

        <div className="container relative z-10 py-16 md:py-24 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground/90 border border-primary-foreground/30 rounded-full px-4 py-2">
              <Leaf className="h-3.5 w-3.5" />
              Trusted Farm Supply
            </p>
            <h1 className="mt-5 text-4xl md:text-6xl font-display text-background leading-[1.08]">
              Professional Grass and Animal Supply for Reliable Farming
            </h1>
            <p className="mt-5 text-background/80 max-w-xl text-base md:text-lg">
              {BRAND_NAME} delivers healthy stock and premium fodder with clear pricing, consistent quality and responsive support.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="rounded-xl h-12 px-7 font-semibold">
                  Shop Products <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline" className="rounded-xl h-12 px-7 bg-background/5 border-background/35 text-background hover:bg-background/15">
                  How Ordering Works
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-3 mt-10 md:mt-14 max-w-3xl">
            {metrics.map((metric) => (
              <div key={metric.label} className="glass-card rounded-xl p-4">
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid md:grid-cols-3 gap-4">
          {trustPoints.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="h-10 w-10 rounded-lg bg-accent text-primary flex items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{item.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-14 md:pb-20">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-sm font-semibold text-primary mb-1">Featured Products</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground">Top Picks This Week</h2>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-fr">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
        </div>
      </section>

      <section className="container pb-16 md:pb-20">
        <div className="farm-gradient rounded-3xl p-8 md:p-12 border border-primary/30">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-primary-foreground/80 text-sm font-semibold tracking-wide">Need Bulk Pricing?</p>
              <h3 className="text-2xl md:text-3xl font-display text-primary-foreground mt-1">Talk to Our Team for Farm-Scale Orders</h3>
              <p className="text-primary-foreground/75 mt-2 max-w-xl text-sm">
                Share your quantity and location. We will help you with best pricing and delivery planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop">
                <Button variant="secondary" className="rounded-xl h-11 px-6 font-semibold">
                  Start Order
                </Button>
              </Link>
              <a href="tel:+919600267271">
                <Button variant="outline" className="rounded-xl h-11 px-6 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-14">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display text-foreground">Customer Feedback</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Buyers trust us for healthy animals, better sprouting rates, and transparent support.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              "Delivery was on time and the grass quality was excellent.",
              "Packaging and handling were professional, animals arrived healthy.",
              "Good support for bulk purchase planning and quick response."
            ].map((text, idx) => (
              <div key={idx} className="bg-card border border-border/60 rounded-2xl p-5">
                <div className="flex gap-1 text-farm-gold mb-3">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
