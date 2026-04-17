import { connectDb } from "../config/db.js";
import { Product } from "../models/Product.js";

const products = [
  {
    legacyId: "1",
    name: "Makka Chola Napier",
    category: "Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "High-yield Makka Chola Napier grass grown naturally in Tamil Nadu, ideal for cattle feed.",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "2",
    name: "Red Napier",
    category: "Napier",
    type: "grass",
    price: 1.3,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Red Napier grass variety suitable for livestock feeding with good nutritional value.",
    images: ["https://images.unsplash.com/photo-1464226184884-fa280b87c399"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "3",
    name: "Super Napier",
    category: "Napier",
    type: "grass",
    price: 1,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Super Napier grass known for fast growth and high biomass yield.",
    images: ["https://images.unsplash.com/photo-1471193945509-9ad0617afabf"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "4",
    name: "Kuttai Napier",
    category: "Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Kuttai Napier grass variety grown in natural farm conditions in Tamil Nadu.",
    images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "5",
    name: "Sustra Napier",
    category: "Napier",
    type: "grass",
    price: 2,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Premium Sustra Napier grass variety with excellent yield and quality.",
    images: ["https://images.unsplash.com/photo-1492496913980-501348b61469"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "6",
    name: "BH-18 Napier",
    category: "Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "BH-18 Napier variety suitable for high-density livestock farming.",
    images: ["https://images.unsplash.com/photo-1470770841072-f978cf4d019e"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "7",
    name: "Jinjwa Napier",
    category: "Napier",
    type: "grass",
    price: 0.6,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Affordable Jinjwa Napier grass variety for cattle feeding.",
    images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "8",
    name: "Mulberry Plant",
    category: "Plants",
    type: "grass",
    price: 5,
    unit: "piece",
    stock: 1000,
    deliveryType: "delivery",
    description: "Healthy mulberry plants suitable for sericulture and farming.",
    images: ["https://images.unsplash.com/photo-1589927986089-35812388d1f4"],
    minQty: 10,
    videos: []
  },
  {
    legacyId: "9",
    name: "Mulberry Stick",
    category: "Plants",
    type: "grass",
    price: 2.5,
    unit: "piece",
    stock: 2000,
    deliveryType: "delivery",
    description: "Mulberry sticks for plantation, grown naturally in Tamil Nadu farms.",
    images: ["https://images.unsplash.com/photo-1598514982841-9a5b7cbb1e0c"],
    minQty: 10,
    videos: []
  },
  {
    legacyId: "10",
    name: "Ceteriya Plant",
    category: "Plants",
    type: "grass",
    price: 2,
    unit: "piece",
    stock: 1500,
    deliveryType: "delivery",
    description: "Ceteriya plants suitable for agricultural and fodder purposes.",
    images: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6"],
    minQty: 10,
    videos: []
  },
  {
    legacyId: "11",
    name: "Karumbu Napier",
    category: "Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    deliveryType: "delivery",
    description: "Karumbu Napier grass variety with high nutritional value for cattle.",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef"],
    minQty: 500,
    videos: []
  },
  {
    legacyId: "12",
    name: "Country Chicks (45 Days)",
    category: "Birds",
    type: "animal",
    price: 250,
    unit: "piece",
    stock: 200,
    deliveryType: "pickup",
    description: "Healthy 45-day-old country chicks raised in natural farm conditions.",
    images: ["https://images.unsplash.com/photo-1604908176997-4318f2a1c6c5"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "13",
    name: "Country Chicks (2 Months)",
    category: "Birds",
    type: "animal",
    price: 300,
    unit: "piece",
    stock: 200,
    deliveryType: "pickup",
    description: "2-month-old country chicks ready for farming.",
    images: ["https://images.unsplash.com/photo-1589927986089-35812388d1f4"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "14",
    name: "Finches",
    category: "Birds",
    type: "animal",
    price: 700,
    unit: "pair",
    stock: 50,
    deliveryType: "pickup",
    description: "Colorful finches suitable for home breeding and pet care.",
    images: ["https://images.unsplash.com/photo-1501706362039-c6e08c1f8c1f"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "15",
    name: "Lovebirds",
    category: "Birds",
    type: "animal",
    price: 700,
    unit: "pair",
    stock: 50,
    deliveryType: "pickup",
    description: "Healthy lovebirds perfect for pet lovers.",
    images: ["https://images.unsplash.com/photo-1546182990-dffeafbe841d"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "16",
    name: "Hamster",
    category: "Pets",
    type: "animal",
    price: 800,
    unit: "pair",
    stock: 40,
    deliveryType: "pickup",
    description: "Cute hamsters suitable for indoor pets.",
    images: ["https://images.unsplash.com/photo-1595433562696-5d9c3c8c2a6f"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "17",
    name: "Kollimalai Siruvedai (2 Months)",
    category: "Birds",
    type: "animal",
    price: 600,
    unit: "pair",
    stock: 60,
    deliveryType: "pickup",
    description: "Kollimalai native breed birds, 2 months old.",
    images: ["https://images.unsplash.com/photo-1501706362039-c6e08c1f8c1f"],
    minQty: 1,
    videos: []
  },
  {
    legacyId: "18",
    name: "Rabbit",
    category: "Pets",
    type: "animal",
    price: 800,
    unit: "pair",
    stock: 30,
    deliveryType: "pickup",
    description: "Healthy rabbits suitable for farming and pets.",
    images: ["https://images.unsplash.com/photo-1548767797-d8c844163c4c"],
    minQty: 1,
    videos: []
  }
];

async function seed() {
  try {
    await connectDb();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed", error);
    process.exit(1);
  }
}

seed();
