import { DB, AMAZON_WISHLIST } from "@/config/config";
import type { WishlistConfiguration } from "@/features/wishlist/types";
import type { DataSource } from "typeorm";

const AMAZON_BRAZIL_HOSTS = new Set(["amazon.com.br", "www.amazon.com.br"]);
const CONFIG_TABLE = "wishlist_amazon_config";
const AMAZON_WISHLIST_URL = "https://www.amazon.com.br/hz/wishlist/ls/";

function createTableSql(): string {
  if (DB.driver === "sqlite") {
    return `CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (
      id INTEGER PRIMARY KEY,
      wishlist_id VARCHAR(255) NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;
  }

  return `CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (
    id INT NOT NULL PRIMARY KEY,
    wishlist_id VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`;
}

async function ensureConfigTable(): Promise<DataSource> {
  const { getDatabaseConnection } = await import("@/lib/db");
  const database = await getDatabaseConnection();
  await database.query(createTableSql());
  return database;
}

function wishlistUrl(wishlistId: string | null): string | null {
  return wishlistId ? `${AMAZON_WISHLIST_URL}${encodeURIComponent(wishlistId)}` : null;
}

export function extractWishlistId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  if (!/^https?:\/\//i.test(input)) {
    return /^[A-Za-z0-9_-]+$/.test(input) ? input : null;
  }

  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || !AMAZON_BRAZIL_HOSTS.has(url.hostname.toLowerCase())) return null;
    const match = url.pathname.match(/^\/hz\/wishlist\/ls\/([^/]+)\/?$/i);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function getWishlistConfiguration(): Promise<WishlistConfiguration> {
  const database = await ensureConfigTable();
  const rows = (await database.query(
    `SELECT wishlist_id FROM ${CONFIG_TABLE} WHERE id = 1 LIMIT 1`,
  )) as Array<{ wishlist_id?: string | null }>;
  const databaseId = rows[0]?.wishlist_id?.trim() || null;
  const wishlistId = databaseId ?? (AMAZON_WISHLIST.id || null);
  const source = databaseId ? "database" : wishlistId ? "environment" : null;

  return { wishlistId, source, url: wishlistUrl(wishlistId) };
}

export async function saveWishlistConfiguration(wishlistId: string | null): Promise<WishlistConfiguration> {
  const database = await ensureConfigTable();

  if (!wishlistId) {
    await database.query(`DELETE FROM ${CONFIG_TABLE} WHERE id = 1`);
  } else if (DB.driver === "sqlite") {
    await database.query(
      `INSERT INTO ${CONFIG_TABLE} (id, wishlist_id) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET wishlist_id = excluded.wishlist_id, updated_at = CURRENT_TIMESTAMP`,
      [wishlistId],
    );
  } else {
    await database.query(
      `INSERT INTO ${CONFIG_TABLE} (id, wishlist_id) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE wishlist_id = VALUES(wishlist_id), updated_at = CURRENT_TIMESTAMP`,
      [wishlistId],
    );
  }

  return getWishlistConfiguration();
}
