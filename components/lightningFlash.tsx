import { useEffect, useState } from "react";

export const LightningFlash: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 8000;
      setTimeout(() => {
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            setVisible(true);
            setTimeout(() => { setVisible(false); schedule(); }, 120);
          }, 180);
        }, 100);
      }, delay);
    };
    schedule();
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-75"
      style={{ background: "rgba(240,240,200,0.035)", opacity: visible ? 1 : 0 }}
    />
  );
};