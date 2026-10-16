import Card from "../card";
import type { StockInternalAPIResponse } from "@/types/stock-api";

export default function StocksCard({ data }: { data: StockInternalAPIResponse[] }) {
  return (
    <Card>
      <h2 className="section-title">📊 Ativos Hoje</h2>
      <div className="stocks-list">
        <div className="stock-row">
          <span className="w-10 text-sm">Ticker</span>
          <span className="w-18 text-center text-sm">Price</span>
          <span className="w-26 text-center text-sm">Price Change</span>
          <span className="w-18 text-center text-sm">Percent</span>
        </div>
        {data.map((stock) => (
          <div key={stock.ticker} className="stock-row">
            <span className="stock-ticker">{stock.ticker}</span>
            <span className="stock-price">{`R$ ${stock.price.toFixed(2)}`}</span>
            <span className="stock-price">{`R$ ${stock.change.toFixed(2)}`}</span>
            <span className={`stock-change ${stock.change >= 0 ? "pos" : "neg"}`}>
              {stock.change >= 0 ? "+" : ""}{stock.pct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
