export interface Product {
  id: string;
  name: string;
  type: 'grass' | 'animal';
  price: number;
  unit: string;
  stock: number;
  minQty: number;
  deliveryType: 'delivery' | 'pickup' | 'both';
  description: string;
  images: string[];
  videos: string[];
  age?: string;
  health?: string;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  deliveryType: string;
  createdAt: string;
  deliveryDetails?: {
    fullName: string;
    phone: string;
    address: string;
    pincode: string;
  };
}
