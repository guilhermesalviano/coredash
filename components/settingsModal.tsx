"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  Cctv, Check, ChevronRight, CloudSun, Focus, LayoutGrid, Mail, Moon,
  Newspaper, Palette, CalendarDays, Settings2, SlidersHorizontal,
  Sun, TrendingUp, ListChecks, X, type LucideIcon,
} from "lucide-react";
import storage from "@/lib/storage";
import { CARD_REGISTRY, type CardId, useActiveCards } from "@/hooks/useActiveCards";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useLocale } from "@/contexts/localeContext";
import { LOCALES } from "@/lib/i18n";
import SetupForm from "@/components/setupForm";
import { trapFocus } from "@/lib/trap-focus";
import styles from "./settings.module.css";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "cards", label: "Dashboard cards", icon: LayoutGrid },
  { id: "application", label: "Application", icon: SlidersHorizontal },
] as const;
type SectionId = typeof SECTIONS[number]["id"];
type ThemeMode = "light" | "dark";

const CARD_DETAILS: Record<CardId, { icon: LucideIcon; description: string }> = {
  weather: { icon: CloudSun, description: "The forecast at a glance" },
  calendar: { icon: CalendarDays, description: "What’s coming up next" },
  gmail: { icon: Mail, description: "Stay on top of your inbox" },
  stocks: { icon: TrendingUp, description: "Follow the market" },
  todo: { icon: ListChecks, description: "Your daily reminders" },
  news: { icon: Newspaper, description: "Catch up on the headlines" },
  camera: { icon: Cctv, description: "Keep an eye on your camera" },
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-label={label} aria-checked={checked}
      onClick={onChange} className={styles.toggle}><span /></button>
  );
}

function ThemeSection() {
  const { t } = useLocale();
  const [mode, setMode] = useState<ThemeMode>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const apply = (next: ThemeMode) => {
    setMode(next);
    document.documentElement.setAttribute("data-theme", next);
    storage.set("theme", next);
  };
  return (
    <section className={styles.section} aria-labelledby="theme-heading">
      <div className={styles.sectionHeading}>
        <h3 id="theme-heading">{t("colorTheme")}</h3><p>{t("colorThemeHint")}</p>
      </div>
      <div className={styles.themeGrid}>
        {(["light", "dark"] as const).map((theme) => {
          const Icon = theme === "light" ? Sun : Moon;
          return (
            <button key={theme} type="button" aria-pressed={mode === theme}
              aria-label={theme === "light" ? t("themeLightLabel") : t("themeDarkLabel")}
              onClick={() => apply(theme)} className={styles.themeOption}>
              <div className={styles.themePreview} data-preview={theme} aria-hidden="true">
                <div className={styles.previewTop}><span /><i /><i /><i /></div>
                <div className={styles.previewBody}>
                  <div className={styles.previewSidebar}><i /><i /><i /></div>
                  <div className={styles.previewCards}>
                    <div className={styles.previewChart}>{[35, 60, 45, 80, 65].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
                    <div className={styles.previewSmall}><i /><i /><i /></div>
                    <div className={styles.previewSmall}><i /><i /></div>
                  </div>
                </div>
              </div>
              <div className={styles.themeCaption}>
                <Icon size={17} aria-hidden="true" /><span>{theme === "light" ? t("themeLight") : t("themeDark")}</span>
                <span className={styles.selectionMark}>{mode === theme && <Check size={12} aria-hidden="true" />}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const [section, setSection] = useState<SectionId>("appearance");
  const { isActive, toggle, active } = useActiveCards();
  const { enabled: focusEnabled, setEnabled: setFocusEnabled } = useFocusMode();
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
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
  }, []);

  const navigateTabs = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % SECTIONS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + SECTIONS.length - 1) % SECTIONS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SECTIONS.length - 1;
    else return;
    event.preventDefault();
    setSection(SECTIONS[next].id);
    tabButtons.current[next]?.focus();
  };

  return createPortal(
    <dialog ref={dialog} className={styles.overlay} aria-labelledby="settings-title" onKeyDown={trapFocus}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.headerIcon}><Settings2 size={21} aria-hidden="true" /></div>
          <div><h1 id="settings-title">{t("settings")}</h1><p>{t("settingsSubtitle")}</p></div>
          <button type="button" onClick={onClose} aria-label={t("closeSettings")} className={styles.closeButton}><X size={19} /></button>
        </header>
        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <p className={styles.navLabel}>{t("settingsNav")}</p>
            <div role="tablist" aria-label={t("settingsCategories")} className={styles.tabs}>
              {SECTIONS.map(({ id, icon: Icon }, index) => (
                <button key={id} type="button" role="tab" id={`settings-tab-${id}`}
                  aria-selected={section === id} aria-controls={`settings-panel-${id}`}
                  tabIndex={section === id ? 0 : -1}
                  ref={(element) => { tabButtons.current[index] = element; }}
                  onClick={() => setSection(id)} onKeyDown={(event) => navigateTabs(event, index)} className={styles.tab}>
                  <Icon size={17} aria-hidden="true" /><span>{t(id === "appearance" ? "sectionAppearance" : id === "cards" ? "sectionCards" : "sectionApplication")}</span>
                  <ChevronRight size={14} className={styles.tabArrow} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className={styles.sidebarNote}>
              <span className={styles.brand}>CORE<span>DASH</span></span>
              <p>{t("brandNote")}</p>
            </div>
          </aside>
          <div className={styles.panels}>
            <div role="tabpanel" id="settings-panel-appearance" aria-labelledby="settings-tab-appearance"
              hidden={section !== "appearance"} className={styles.panel} tabIndex={0}>
              <div className={styles.panelIntro}>
                <span className={styles.eyebrow}>{t("lookFeel")}</span><h2>{t("makeYours")}</h2>
                <p>{t("themeHint")}</p>
              </div>
              <ThemeSection />
              <section className={styles.section} aria-labelledby="language-heading">
                <div className={styles.sectionHeading}>
                  <h3 id="language-heading">{t("language")}</h3><p>{t("languageHint")}</p>
                </div>
                <div className={styles.languageGrid}>
                  {LOCALES.map((code) => (
                    <button key={code} type="button" aria-pressed={locale === code}
                      onClick={() => setLocale(code)} className={styles.languageOption}>
                      <span>{code === "en" ? t("languageEnglish") : t("languagePortuguese")}</span>
                      <span className={styles.selectionMark}>{locale === code && <Check size={12} aria-hidden="true" />}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className={styles.section} aria-labelledby="focus-setting-heading">
                <div className={styles.sectionHeading}>
                  <h3 id="focus-setting-heading">{t("focusSettingTitle")}</h3><p>{t("focusSettingHint")}</p>
                </div>
                <div className={styles.focusRow}>
                  <span className={styles.featureIcon}><Focus size={23} aria-hidden="true" /></span>
                  <div><h4>{t("focusSettingName")}</h4><p>{t("focusSettingBody")}</p></div>
                  <Toggle label={t("focusSettingName")} checked={focusEnabled} onChange={() => setFocusEnabled(!focusEnabled)} />
                </div>
              </section>
              <p className={styles.instantNote}><Check size={14} aria-hidden="true" /> {t("appearanceSaved")}</p>
            </div>
            <div role="tabpanel" id="settings-panel-cards" aria-labelledby="settings-tab-cards"
              hidden={section !== "cards"} className={styles.panel} tabIndex={0}>
              <div className={styles.panelIntro}>
                <span className={styles.eyebrow}>{t("cardsEyebrow")}</span><h2>{t("cardsTitle")}</h2>
                <p>{t("cardsHint")}</p>
              </div>
              <div className={styles.sectionTitleRow}><h3>{t("sectionCards")}</h3><span className={styles.count}>{t("cardsEnabled", { active: active.length, total: CARD_REGISTRY.length })}</span></div>
              <div className={styles.cardGrid}>
                {CARD_REGISTRY.map((card) => {
                  const { icon: Icon } = CARD_DETAILS[card.id];
                  const checked = isActive(card.id);
                  return (
                    <div key={card.id} className={styles.cardOption} data-enabled={checked}>
                      <span className={styles.cardIcon}><Icon size={20} aria-hidden="true" /></span>
                      <Toggle label={card.label} checked={checked} onChange={() => toggle(card.id)} />
                      <div className={styles.cardText}><h4>{card.label}</h4><p>{t(`card${card.id[0].toUpperCase()}${card.id.slice(1)}`)}</p></div>
                    </div>
                  );
                })}
              </div>
              <p className={styles.instantNote}><Check size={14} aria-hidden="true" /> {t("cardsSaved")}</p>
            </div>
            <div role="tabpanel" id="settings-panel-application" aria-labelledby="settings-tab-application"
              hidden={section !== "application"} className={`${styles.panel} ${styles.applicationPanel}`} tabIndex={0}>
              <SetupForm presentation="panel" />
            </div>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
