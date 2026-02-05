// Standardizing Region to match User Country
export type Role = "ADMIN" | "MANAGER" | "MEMBER";
export type Region = "INDIA" | "USA";

export interface User {
  id: string;
  name: string;
  role: Role;
  country: Region | "ALL"; // Changed to match Region
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Restaurant {
  id: string;
  name: string;
  region: Region;
  menu: MenuItem[];
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  region: Region;
  items: MenuItem[];
  total: number;
  status: "pending" | "placed" | "cancelled";
  paymentMethod: string;
}
