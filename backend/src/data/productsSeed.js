import { connectDb } from "../config/db.js";
import { Product } from "../models/Product.js";

const products = [
  {
    legacyId: "1",
    name: "Super Napier",
    type: "grass",
    price: 1,
    unit: "stick",
    stock: 10000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Classic Super Napier grass with high yield and fast growth.",
    images: [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"
    ],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "2",
    name: "Red Napier",
    type: "grass",
    price: 1.3,
    unit: "stick",
    stock: 8000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Red stemmed Napier variety, protein rich and palatable.",
    images: ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "3",
    name: "Makka Chola Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Premium hybrid Napier with excellent sweetness and nutrition.",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "4",
    name: "Kuttai Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Compact dwarf Napier suited for small farms.",
    images: ["https://images.unsplash.com/photo-1501004318855-c73c694ade4b?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "5",
    name: "Sustra Napier",
    type: "grass",
    price: 2,
    unit: "stick",
    stock: 4000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Drought resistant superior Napier with high biomass.",
    images: ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "6",
    name: "BH-18",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    minQty: 500,
    deliveryType: "delivery",
    description: "High performance variety with excellent regrowth.",
    images: ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "7",
    name: "Karumbu Napier",
    type: "grass",
    price: 1.8,
    unit: "stick",
    stock: 5000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Sweet-stem Napier loved by cattle.",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"],
    videos: [],
    category: "Napier"
  },
  {
    legacyId: "8",
    name: "Jinjwa",
    type: "grass",
    price: 0.6,
    unit: "stick",
    stock: 15000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Budget friendly fast-growing fodder option.",
    images: ["https://images.unsplash.com/photo-1501004318855-c73c694ade4b?w=600"],
    videos: [],
    category: "Grass"
  },
  {
    legacyId: "9",
    name: "Mulberry Plant",
    type: "grass",
    price: 5,
    unit: "piece",
    stock: 3000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Live mulberry plants for feed and cultivation.",
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600"],
    videos: [],
    category: "Plants"
  },
  {
    legacyId: "10",
    name: "Mulberry Stick",
    type: "grass",
    price: 2.5,
    unit: "stick",
    stock: 5000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Mulberry sticks for easy propagation.",
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600"],
    videos: [],
    category: "Plants"
  },
  {
    legacyId: "11",
    name: "Ceteriya Plant",
    type: "grass",
    price: 2,
    unit: "piece",
    stock: 3000,
    minQty: 500,
    deliveryType: "delivery",
    description: "Nutritious fodder plant with good protein content.",
    images: ["https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600"],
    videos: [],
    category: "Plants"
  },
  {
    legacyId: "12",
    name: "Chicks (45 Days Old)",
    type: "animal",
    price: 250,
    unit: "piece",
    stock: 50,
    minQty: 1,
    deliveryType: "pickup",
    description: "Vaccinated 45 day old chicks.",
    images: ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
    videos: [],
    age: "45 days",
    health: "Vaccinated, Healthy",
    category: "Birds"
  },
  {
    legacyId: "13",
    name: "Chicks (2 Months Old)",
    type: "animal",
    price: 300,
    unit: "piece",
    stock: 40,
    minQty: 1,
    deliveryType: "pickup",
    description: "2 month old healthy chicks.",
    images: ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
    videos: [],
    age: "2 months",
    health: "Vaccinated, Healthy",
    category: "Birds"
  },
  {
    legacyId: "14",
    name: "Finches",
    type: "animal",
    price: 700,
    unit: "pair",
    stock: 20,
    minQty: 1,
    deliveryType: "pickup",
    description: "Colorful finches sold as pairs.",
    images: ["https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=600"],
    videos: [],
    age: "Adult",
    health: "Healthy, Active",
    category: "Birds"
  },
  {
    legacyId: "15",
    name: "Lovebirds",
    type: "animal",
    price: 700,
    unit: "pair",
    stock: 15,
    minQty: 1,
    deliveryType: "pickup",
    description: "Healthy lovebirds sold as pairs.",
    images: ["https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600"],
    videos: [],
    age: "Adult",
    health: "Healthy, Active",
    category: "Birds"
  },
  {
    legacyId: "16",
    name: "Hamster",
    type: "animal",
    price: 800,
    unit: "pair",
    stock: 15,
    minQty: 1,
    deliveryType: "pickup",
    description: "Friendly and healthy hamsters.",
    images: [
      "https://images.unsplash.com/photo-1425082661507-6e603aefbbe0?w=600",
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600"
    ],
    videos: [],
    age: "1-3 months",
    health: "Healthy",
    category: "Pets"
  },
  {
    legacyId: "17",
    name: "Kollimalai Siruvedai",
    type: "animal",
    price: 600,
    unit: "pair",
    stock: 10,
    minQty: 1,
    deliveryType: "pickup",
    description: "Hardy native quail breed.",
    images: ["https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=600"],
    videos: [],
    age: "2 months",
    health: "Healthy, Active",
    category: "Birds"
  },
  {
    legacyId: "18",
    name: "Rabbit",
    type: "animal",
    price: 800,
    unit: "pair",
    stock: 20,
    minQty: 1,
    deliveryType: "pickup",
    description: "Vaccinated rabbits sold as pairs.",
    images: [
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600",
      "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=600"
    ],
    videos: [],
    age: "2-4 months",
    health: "Vaccinated, Healthy",
    category: "Pets"
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
