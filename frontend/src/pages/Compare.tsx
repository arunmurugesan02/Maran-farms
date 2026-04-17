import { Link } from 'react-router-dom';
import { Check, Trophy, Sprout, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const napierVarieties = [
  { name: 'Super Napier', price: 1.00, yield: 'Very High', growth: '60 days', height: '12-15 ft', protein: '14-18%', drought: 'Good', best: 'Dairy cattle', popular: true, id: '1' },
  { name: 'Red Napier', price: 1.30, yield: 'High', growth: '70 days', height: '10-12 ft', protein: '12-16%', drought: 'Excellent', best: 'All livestock', popular: false, id: '2' },
  { name: 'Makka Chola', price: 1.80, yield: 'Very High', growth: '65 days', height: '14-16 ft', protein: '16-20%', drought: 'Good', best: 'Premium dairy', popular: true, id: '3' },
  { name: 'Kuttai Napier', price: 1.80, yield: 'Medium', growth: '55 days', height: '6-8 ft', protein: '14-16%', drought: 'Excellent', best: 'Small farms', popular: false, id: '4' },
  { name: 'Sustra Napier', price: 2.00, yield: 'Very High', growth: '70 days', height: '13-15 ft', protein: '15-18%', drought: 'Excellent', best: 'Drought areas', popular: false, id: '5' },
  { name: 'BH-18', price: 1.80, yield: 'High', growth: '65 days', height: '11-13 ft', protein: '14-17%', drought: 'Good', best: 'Year-round', popular: false, id: '6' },
  { name: 'Karumbu Napier', price: 1.80, yield: 'High', growth: '70 days', height: '12-14 ft', protein: '13-15%', drought: 'Medium', best: 'Sweet fodder', popular: false, id: '7' },
  { name: 'Jinjwa', price: 0.60, yield: 'Medium', growth: '50 days', height: '8-10 ft', protein: '10-12%', drought: 'Medium', best: 'Budget option', popular: false, id: '8' },
];

const Compare = () => (
  <div className="container py-12">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold mb-4">
        <Sprout className="h-3.5 w-3.5" /> NAPIER GUIDE
      </div>
      <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">Compare Napier Varieties</h1>
      <p className="text-muted-foreground">Find the perfect grass variety for your farm. Side-by-side comparison of yield, growth, and price.</p>
    </motion.div>

    {/* Mobile cards */}
    <div className="md:hidden space-y-4">
      {napierVarieties.map((v, i) => (
        <motion.div
          key={v.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className={`bg-card rounded-2xl border p-5 ${v.popular ? 'border-primary/40 ring-2 ring-primary/10' : 'border-border/50'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              {v.name}
              {v.popular && <Trophy className="h-4 w-4 text-farm-gold fill-farm-gold" />}
            </h3>
            <p className="text-2xl font-bold text-primary">₹{v.price}<span className="text-xs text-muted-foreground font-normal">/stick</span></p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Yield', v.yield], ['Growth', v.growth], ['Height', v.height],
              ['Protein', v.protein], ['Drought', v.drought], ['Best for', v.best],
            ].map(([k, val]) => (
              <div key={k} className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">{k}</p>
                <p className="font-semibold text-foreground">{val}</p>
              </div>
            ))}
          </div>
          <Link to={`/product/${v.id}`}>
            <Button size="sm" className="w-full mt-4 rounded-lg">View & Buy <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </Link>
        </motion.div>
      ))}
    </div>

    {/* Desktop table */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {['Variety', 'Price', 'Yield', 'Growth', 'Height', 'Protein', 'Drought', 'Best For', ''].map(h => (
                <th key={h} className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {napierVarieties.map((v, i) => (
              <tr key={v.name} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${v.popular ? 'bg-accent/30' : ''}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-foreground">{v.name}</span>
                    {v.popular && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-farm-gold/20 text-[10px] font-bold text-farm-gold">
                        <Trophy className="h-2.5 w-2.5 fill-farm-gold" /> POPULAR
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-primary">₹{v.price}</td>
                <td className="px-4 py-4 text-sm text-foreground">{v.yield}</td>
                <td className="px-4 py-4 text-sm text-foreground">{v.growth}</td>
                <td className="px-4 py-4 text-sm text-foreground">{v.height}</td>
                <td className="px-4 py-4 text-sm text-foreground">{v.protein}</td>
                <td className="px-4 py-4 text-sm text-foreground">{v.drought}</td>
                <td className="px-4 py-4 text-sm text-muted-foreground">{v.best}</td>
                <td className="px-4 py-4">
                  <Link to={`/product/${v.id}`}>
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs">Buy</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    {/* Quantity calculator */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-10 max-w-2xl mx-auto bg-accent/40 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground mb-2">Planting Quick Guide</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• <span className="font-semibold text-foreground">1 acre</span> needs ~4000-5000 sticks (standard 2x2 ft spacing)</li>
            <li>• <span className="font-semibold text-foreground">1 hectare</span> needs ~10000-12500 sticks</li>
            <li>• Best planting season: June-July (monsoon) or October-November</li>
            <li>• First harvest in 60-75 days, recurring every 35-45 days</li>
          </ul>
        </div>
      </div>
    </motion.div>
  </div>
);

export default Compare;
