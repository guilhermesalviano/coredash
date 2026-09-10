"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Card from "../card";
import SectionTitle from "../sectionTitle";
import { fetchJson } from "@/lib/api-client";
import type { WishlistPriceDropAPIResponse } from "@/types/wishlist-api";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function WishlistDropsCard() {
  const [drops, setDrops] = useState<WishlistPriceDropAPIResponse[] | null>(null);

  useEffect(() => {
    fetchJson<WishlistPriceDropAPIResponse[]>("/api/wishlist/drops")
      .then(setDrops)
      .catch(() => setDrops([]));
  }, []);

  return (
    <Card>
      <SectionTitle>📉 Maiores Quedas de Preço</SectionTitle>
      <div className="products-list">
        {drops?.length ? drops.map((drop) => (
          <Link key={`${drop.name}-${drop.link}`} href={drop.link} target="_blank" rel="noreferrer">
            <div className="product-row">
              <div>
                <div className="product-name">{drop.name}</div>
                <div className="product-store">Amazon · -{drop.percentage.toFixed(1)}%</div>
              </div>
              <div className="product-right">
                <div className="product-price">{drop.currentPrice}</div>
                <div className="product-drop">- {currencyFormatter.format(drop.savings)}</div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="product-empty">
            {drops ? "Nenhuma queda de preço encontrada." : "Carregando quedas de preço..."}
          </div>
        )}
      </div>
    </Card>
  );
}
