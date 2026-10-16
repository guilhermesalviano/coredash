"use client";

import { useEffect, useState } from "react";
import SectionTitle from "../sectionTitle";
import Card from "../card";
import { useStatus } from "@/contexts/statusContext";

export default function FlightsCard() {
  const [flights, setFlights] = useState<any>(null);
  const { reportStatus } = useStatus();

  useEffect(() => {
    fetch("/api/flights")
      .then((res) => {
        if (!res.ok) throw new Error(`Erro do servidor: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setFlights(data.data);
        reportStatus("flights", "success");
      })
      .catch(() => {
        // setflights({error: "failed"})
        reportStatus("flights", "error");
      });
  }, []);

  return (
    <Card>
      <SectionTitle>✈️ Passagens Monitoradas</SectionTitle>
      <div className="flights-list">
        {flights?.map((f: any, i: any) => (
          <div key={i} className="flight-row">
            <div>
              <div className="flight-route">{f.route}</div>
              <div className="flight-meta">{f.airline} · {f.date}</div>
            </div>
            <div className="flight-price flex flex-col justify-center items-center">
              <div className="flight-title">
                price meta
              </div>
              <div className="flight-value flex gap-2">
                -
              </div>
            </div>
            <div className="flight-price flex flex-col justify-center items-center">
              <div className="flight-title">
                price
              </div>
              <div className="flight-value flex gap-2">
                R$ {f.price}
                <span style={{ opacity: 0.5 }}>{f.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
