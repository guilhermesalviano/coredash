import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const mockProducts = [
      { name: 'iPhone 16 Pro 256GB', price: "R$ 9.499", store: "Apple Store", alert: true },
      { name: "Sony WH-1000XM5", price: "R$ 1.899", store: "Amazon", alert: false },
      { name: "MacBook Air M3", price: "R$ 12.799", store: "Kabum", alert: true },
    ];
    
    return formatResponse(req, { message: "Products data retrieved successfully", data: mockProducts }, { status: 200 })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to retrieve products data" }, { status: 500 });
  }
}