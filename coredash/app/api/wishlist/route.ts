import { NextRequest, NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";
import { formatResponse } from "@/lib/api-response";
import { format } from "date-fns";
import { WishlistAmazon } from "@/entities/WishlistAmazon";
import { WishlistInternalAPIResponse } from "@/types/wishlist-api";
import { createMemoryCache } from "@/utils/in-memory-cache";

const now = new Date();

let targetTime = new Date(now);
targetTime.setHours(8, 0, 0, 0);

if (now > targetTime) {
  targetTime.setDate(targetTime.getDate() + 1);
}

const diffInMs = targetTime.getTime() - now.getTime();
const secondsToNext8AM = Math.floor(diffInMs / 1000);

const wishlistCache = createMemoryCache<WishlistInternalAPIResponse[]>(secondsToNext8AM);

export async function GET(req: NextRequest) {
  try {
    const cached = wishlistCache.get("default");
    if (cached) {
      return formatResponse(req, { message: "Wishlist data from cache successfully", data: cached });
    }

    const today = new Date();

    const db = await getDatabaseConnection();
    const wishlistRepository = db.getRepository(WishlistAmazon);

    const cleanPriceSql = (alias: string) => {
      return `CAST(REPLACE(REGEXP_REPLACE(${alias}.price, '[^0-9,]', ''), ',', '.') AS DECIMAL(10,2))`;
    };

    const minPricesPerBook = await wishlistRepository
      .createQueryBuilder("w")
      .select("w.title", "title")
      .addSelect("w.price", "price")
      .addSelect("w.link", "link")
      .where((qb) => {
        const subQuery = qb
        .subQuery()
        .select(`MAX(${cleanPriceSql("s")})`, "maxPrice")
        .from("wishlist_amazon", "s")
          .where("s.title = w.title")
          .andWhere("s.price <> ''")
          .getQuery();

        return `${cleanPriceSql("w")} < (${subQuery})`;
      })
      .andWhere("w.searchDate LIKE :date", { date: `${format(today, "yyyy-MM-dd")}%` })
      .andWhere("w.price <> ''")
      .orderBy(cleanPriceSql("w"), "ASC")
      .getRawMany();
    
    const minPricesPerBookOrdered = minPricesPerBook.sort((a, b) => {
      const parsePrice = (val: string) => {
        const cleanVal = val.replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(cleanVal) || 0;
      };

      return parsePrice(a.price) - parsePrice(b.price);
    });

    const wishlistData: WishlistInternalAPIResponse[] = minPricesPerBookOrdered.map(item => ({
      name: item.title,
      price: item.price,
      link: item.link,
      store: "Amazon",
      alert: true,
    }));

    wishlistCache.set("default", wishlistData);

    return formatResponse(req, { message: "Products data retrieved successfully", data: wishlistData }, { status: 200 })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to retrieve products data" }, { status: 500 });
  }
}