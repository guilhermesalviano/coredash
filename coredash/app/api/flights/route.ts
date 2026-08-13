import { NextRequest, NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";
import { formatResponse } from "@/lib/api-response";
import { FlightCrawled } from "@/entities/FlightCrawled";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabaseConnection();
    const flightCrawledRepository = db.getRepository(FlightCrawled);
    const getMinDate = await flightCrawledRepository
      .createQueryBuilder("f")
      .select("max(f.searchDate)", "date")
      .getRawOne();

    const flights = await flightCrawledRepository
      .createQueryBuilder("flight")
      .select("flight.airline", "airline")
      .addSelect("flight.origin", "origin")
      .addSelect("flight.destination", "destination")
      .addSelect("flight.flightDate", "flightDate")
      .addSelect("flight.price", "price")
      .addSelect("flight.searchDate", "searchDate")
      // .where((qb) => {
      //   const subQuery = qb
      //   .subQuery()
      //   .select(`MAX(CAST(s.price AS INT))`, "maxPrice")
      //   .from("flight_crawled", "s")
      //     .where("s.flightDate = flight.flightDate")
      //     .andWhere("s.origin <> flight.origin")
      //     .andWhere("s.destination <> flight.destination")
      //     .andWhere("s.price <> ''")
      //     .getQuery();

      //   return `CAST(flight.price AS INT) < (${subQuery})`;
      // })
      .andWhere("flight.price <> ''")
      .andWhere("flight.searchDate LIKE :date", { date: `${format(getMinDate.date, "yyyy-MM-dd")}%` })
      .orderBy("flight.price", "ASC")
      .getRawMany();
    
    if (!flights) {
      return formatResponse(req, { message: "No flights data retrieved", data: null }, { status: 200 })
    }

    const flightsResult = flights.map((flight) => ({
      route: `${flight.origin} → ${flight.destination}`,
      airline: flight.airline,
      date: flight.flightDate,
      price: flight.price,
      trend: "▼",
    })).slice(0, 5);

    return formatResponse(req, { message: "Flights data retrieved successfully", data: flightsResult }, { status: 200 })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to retrieve flights data" }, { status: 500 });
  }
}