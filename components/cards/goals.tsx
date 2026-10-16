"use client";

import { useEffect, useState } from "react";
import SectionTitle from "../sectionTitle";
import Card from "../card";

export default function GoalsCard() {
  const [goals, setGoals] = useState<any>(null);

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((data) => setGoals(data.data));
  }, []);

  return (
    <Card>
      <SectionTitle>🎯 Metas</SectionTitle>
      <div className="goals-list">
        {goals?.map((g: any) => {
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <div key={g.id} className="goal-item">
              <div className="goal-header">
                <span className="goal-label">{g.label}</span>
                <span className="goal-pct" style={{ color: g.color }}>{pct}%</span>
              </div>
              <div className="goal-bar-bg">
                <div
                  className="goal-bar-fill"
                  style={{ width: `${pct}%`, background: g.color }}
                />
              </div>
              <div className="goal-values">
                <span>
                  {g.unit ? g.current : `R$ ${g.current.toLocaleString("pt-BR")}`}
                  {g.unit ? ` ${g.unit}` : ""}
                </span>
                <span style={{ opacity: 0.4 }}>
                  {g.unit ? g.target : `R$ ${g.target.toLocaleString("pt-BR")}`}
                  {g.unit ? ` ${g.unit}` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}