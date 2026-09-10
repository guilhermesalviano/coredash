"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Card from "../card";
import SectionTitle from "../sectionTitle";
import { useVisibilityPolling } from "@/hooks/use-visibility-polling";
import { fetchJson } from "@/lib/api-client";
import type {
  WishlistConfigurationAPIResponse,
  WishlistPriceDropAPIResponse,
  WishlistUpdateStatusAPIResponse,
} from "@/types/wishlist-api";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function updateStatusLabel(status: WishlistUpdateStatusAPIResponse): string {
  if (!status.lastUpdatedAt) return "Desatualizado · nenhuma atualização registrada";

  const lastUpdatedAt = new Date(status.lastUpdatedAt);
  const time = lastUpdatedAt.toLocaleTimeString("pt-BR", {
    timeZone: status.timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  if (status.updatedToday) return `Atualizado hoje às ${time}`;

  const date = lastUpdatedAt.toLocaleDateString("pt-BR", {
    timeZone: status.timezone,
    day: "2-digit",
    month: "2-digit",
  });
  return `Desatualizado · última atualização em ${date} às ${time}`;
}

export default function WishlistDropsCard() {
  const [drops, setDrops] = useState<WishlistPriceDropAPIResponse[] | null>(null);
  const [updateStatus, setUpdateStatus] = useState<WishlistUpdateStatusAPIResponse | null>(null);
  const [configValue, setConfigValue] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadDrops = useCallback(() => {
    fetchJson<WishlistPriceDropAPIResponse[]>("/api/wishlist/drops")
      .then(setDrops)
      .catch(() => setDrops([]));
    fetchJson<WishlistUpdateStatusAPIResponse>("/api/wishlist/status")
      .then(setUpdateStatus)
      .catch(() => setUpdateStatus(null));
  }, []);

  useVisibilityPolling(loadDrops, REFRESH_INTERVAL_MS);

  useEffect(() => {
    fetchJson<WishlistConfigurationAPIResponse>("/api/wishlist/config")
      .then((config) => setConfigValue(config.wishlistId ?? ""))
      .catch(() => undefined);
  }, []);

  const saveConfig = async () => {
    setSavingConfig(true);
    setConfigError(null);
    try {
      const config = await fetchJson<WishlistConfigurationAPIResponse>("/api/wishlist/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: configValue }),
      });
      setConfigValue(config.wishlistId ?? "");
      setConfigOpen(false);
      loadDrops();
    } catch (error: unknown) {
      setConfigError(error instanceof Error ? error.message : "Não foi possível salvar a wishlist.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <Card>
      <div className="wishlist-card-header">
        <SectionTitle>📉 Maiores Quedas de Preço</SectionTitle>
        <button className="wishlist-config-button" type="button" onClick={() => setConfigOpen(true)}>
          ⚙️ Configurar
        </button>
      </div>
      {updateStatus && (
        <div className={`wishlist-status ${updateStatus.updatedToday ? "is-fresh" : "is-stale"}`} role="status">
          <span className="wishlist-status-dot" aria-hidden="true" />
          {updateStatusLabel(updateStatus)}
        </div>
      )}
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

      {configOpen && (
        <div className="wishlist-modal-backdrop" role="presentation" onClick={() => setConfigOpen(false)}>
          <div
            className="wishlist-config-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-config-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="wishlist-config-modal-header">
              <h3 id="wishlist-config-title">Configurar wishlist</h3>
              <button type="button" onClick={() => setConfigOpen(false)} aria-label="Fechar configuração">✕</button>
            </div>
            <label className="wishlist-config-label" htmlFor="wishlist-config-value">
              ID ou URL completa da wishlist Amazon Brasil
            </label>
            <input
              id="wishlist-config-value"
              className="wishlist-config-input"
              value={configValue}
              onChange={(event) => setConfigValue(event.target.value)}
              placeholder="https://www.amazon.com.br/hz/wishlist/ls/..."
              autoFocus
            />
            <p className="wishlist-config-help">Você pode colar a URL completa ou apenas o ID. Deixe vazio para remover a configuração.</p>
            {configError && <p className="wishlist-config-error">{configError}</p>}
            <div className="wishlist-config-actions">
              <button type="button" className="wishlist-config-cancel" onClick={() => setConfigOpen(false)}>Cancelar</button>
              <button type="button" className="wishlist-config-save" onClick={saveConfig} disabled={savingConfig}>
                {savingConfig ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
