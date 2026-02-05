import { Restaurant } from "@/types";

export const RESTAURANTS: Restaurant[] = [
  {
    id: "res-1",
    name: "Spice Garden",
    region: "INDIA",
    menu: [
      { id: "m1", name: "Paneer Tikka", price: 240, category: "Starters" },
      { id: "m2", name: "Butter Chicken", price: 320, category: "Main Course" },
      { id: "m3", name: "Garlic Naan", price: 40, category: "Bread" },
      { id: "m3-b", name: "Lassi", price: 60, category: "Beverages" },
    ],
  },
  {
    id: "res-2",
    name: "Dosa Plaza",
    region: "INDIA",
    menu: [
      { id: "m4", name: "Masala Dosa", price: 120, category: "Main Course" },
      { id: "m5", name: "Idli Sambhar", price: 80, category: "Main Course" },
      { id: "m6", name: "Filter Coffee", price: 30, category: "Beverages" },
    ],
  },
  {
    id: "res-5",
    name: "Royal Biryani House",
    region: "INDIA",
    menu: [
      {
        id: "m13",
        name: "Hyderabadi Dum Biryani",
        price: 280,
        category: "Main Course",
      },
      {
        id: "m14",
        name: "Mutton Biryani",
        price: 350,
        category: "Main Course",
      },
      { id: "m15", name: "Double Ka Meetha", price: 90, category: "Dessert" },
    ],
  },
  {
    id: "res-6",
    name: "Chaat & Chai",
    region: "INDIA",
    menu: [
      { id: "m16", name: "Samosa (2pcs)", price: 40, category: "Snacks" },
      { id: "m17", name: "Pav Bhaji", price: 110, category: "Main Course" },
      { id: "m18", name: "Masala Chai", price: 20, category: "Beverages" },
    ],
  },
  {
    id: "res-3",
    name: "Liberty Burger",
    region: "USA",
    menu: [
      {
        id: "m7",
        name: "Texas BBQ Burger",
        price: 15,
        category: "Main Course",
      },
      { id: "m8", name: "Cajun Fries", price: 5, category: "Sides" },
      { id: "m9", name: "Iced Tea", price: 3, category: "Beverages" },
      { id: "m9-b", name: "Milkshake", price: 6, category: "Beverages" },
    ],
  },
  {
    id: "res-4",
    name: "NYC Pizza Loft",
    region: "USA",
    menu: [
      { id: "m10", name: "Pepperoni Slice", price: 6, category: "Main Course" },
      { id: "m11", name: "Garlic Knots", price: 7, category: "Sides" },
      { id: "m12", name: "Cola", price: 2, category: "Beverages" },
    ],
  },
  {
    id: "res-7",
    name: "Green Leaf Salads",
    region: "USA",
    menu: [
      { id: "m19", name: "Chicken Caesar", price: 13, category: "Main Course" },
      {
        id: "m20",
        name: "Quinoa Power Bowl",
        price: 14,
        category: "Main Course",
      },
      { id: "m21", name: "Berry Smoothie", price: 7, category: "Beverages" },
    ],
  },
  {
    id: "res-8",
    name: "Sushi Zen",
    region: "USA",
    menu: [
      { id: "m22", name: "California Roll", price: 9, category: "Main Course" },
      {
        id: "m23",
        name: "Spicy Tuna Roll",
        price: 11,
        category: "Main Course",
      },
      { id: "m24", name: "Miso Soup", price: 4, category: "Sides" },
    ],
  },
];
