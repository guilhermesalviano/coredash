import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const mockGoals = [
      { id: 1, label: "Reserva de Emergência", current: 18000, target: 30000, color: "#6EE7B7" },
      { id: 2, label: "Viagem para Europa", current: 4500, target: 12000, color: "#93C5FD" },
      { id: 3, label: "Curso de inglês", current: 8, target: 12, unit: "meses", color: "#FDE68A" },
    ];
    
    return apiResponse(req, { message: "Goals data retrieved successfully", data: mockGoals }, { status: 200 })
  } catch (error: unknown) {
    console.error(error)
    return apiResponse(req, { error: "Failed to retrieve goals data" }, { status: 500 });
  }
}