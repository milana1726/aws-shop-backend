export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const products: Product[] = [
  {
    id: "1",
    title: "Phalaenopsis Golden Beauty",
    price: 45,
    description:
      "Golden Beauty Phalaenopsis with warm yellow flowers and long blooming period.",
  },
  {
    id: "2",
    title: "Dendrobium Nobile",
    price: 60,
    description:
      "Dendrobium Nobile orchid with delicate fragrant flowers on elegant canes.",
  },
  {
    id: "3",
    title: "Cattleya Labiata",
    price: 70,
    description:
      "Classic Cattleya Labiata orchid famous for large vivid blooms and strong fragrance.",
  },
];
