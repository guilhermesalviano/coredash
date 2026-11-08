"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import SetupForm from "@/components/setupForm";
import { trapFocus } from "@/components/settings";
import styles from "@/components/settings.module.css";

export default function CalendarSetupModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      previousFocus?.focus({ preventScroll: true });
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog ref={dialog} className={styles.overlay} aria-labelledby="calendar-setup-title" onKeyDown={trapFocus}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`${styles.modal} ${styles.compactModal}`}>
        <header className={styles.header}>
          <div className={styles.headerIcon}><CalendarDays size={21} aria-hidden="true" /></div>
          <div><h1 id="calendar-setup-title">Ativar calendário</h1><p>Conecte o Google Calendar ao seu painel.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar configuração do calendário" className={styles.closeButton}><X size={19} /></button>
        </header>
        <div className={styles.compactBody}>
          <SetupForm presentation="panel" groups={["calendar"]} onSaved={onSaved} />
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
