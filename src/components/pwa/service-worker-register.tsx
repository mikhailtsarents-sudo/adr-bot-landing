"use client";

import { useEffect, useState, type CSSProperties } from "react";

type UpdateCopy = {
  title: string;
  text: string;
  update: string;
  later: string;
};

const updateCopyByLocale: Record<string, UpdateCopy> = {
  ar: {
    title: "يتوفر إصدار جديد",
    text: "تم تحديث Web-Trainer. أعد تحميل الصفحة حتى تبقى الأسئلة وبيانات العمل دون اتصال محدثة.",
    update: "تحديث",
    later: "لاحقًا",
  },
  bg: {
    title: "Налична е нова версия",
    text: "Обновихме Web-Trainer. Презареди страницата, за да са актуални въпросите и офлайн данните.",
    update: "Обнови",
    later: "По-късно",
  },
  de: {
    title: "Neue Version verfuegbar",
    text: "Wir haben den Web-Trainer aktualisiert. Lade die neue Version, damit Fragen und Offline-Daten aktuell bleiben.",
    update: "Aktualisieren",
    later: "Spaeter",
  },
  en: {
    title: "New version available",
    text: "The Web Trainer has been updated. Reload to keep questions and offline data current.",
    update: "Update",
    later: "Later",
  },
  hr: {
    title: "Dostupna je nova verzija",
    text: "Web-Trainer je ažuriran. Ponovno učitaj stranicu kako bi pitanja i offline podaci bili aktualni.",
    update: "Ažuriraj",
    later: "Kasnije",
  },
  pl: {
    title: "Dostępna jest nowa wersja",
    text: "Zaktualizowaliśmy Web-Trainer. Odśwież stronę, aby pytania i dane offline były aktualne.",
    update: "Aktualizuj",
    later: "Później",
  },
  ro: {
    title: "Este disponibilă o versiune nouă",
    text: "Am actualizat Web-Trainer. Reîncarcă pagina pentru ca întrebările și datele offline să fie actuale.",
    update: "Actualizează",
    later: "Mai târziu",
  },
  ru: {
    title: "Доступна новая версия",
    text: "Мы обновили Web-Trainer. Перезагрузи страницу, чтобы вопросы и офлайн-данные были актуальными.",
    update: "Обновить",
    later: "Позже",
  },
  tr: {
    title: "Yeni sürüm hazır",
    text: "Web-Trainer güncellendi. Soruların ve çevrimdışı verilerin güncel kalması için sayfayı yenile.",
    update: "Güncelle",
    later: "Sonra",
  },
  uk: {
    title: "Доступна нова версія",
    text: "Ми оновили Web-Trainer. Перезавантаж сторінку, щоб питання й офлайн-дані були актуальними.",
    update: "Оновити",
    later: "Пізніше",
  },
};

function getUpdateCopy(): UpdateCopy {
  if (typeof navigator === "undefined") {
    return updateCopyByLocale.de;
  }

  const language = navigator.language.toLowerCase().split("-")[0];

  return updateCopyByLocale[language] ?? updateCopyByLocale.de;
}

const bannerStyle: CSSProperties = {
  position: "fixed",
  right: "max(16px, env(safe-area-inset-right))",
  bottom: "max(16px, env(safe-area-inset-bottom))",
  zIndex: 1000,
  maxWidth: "380px",
  border: "1px solid rgba(22, 42, 35, 0.16)",
  borderRadius: "22px",
  background: "rgba(255, 252, 244, 0.96)",
  boxShadow: "0 24px 70px rgba(20, 30, 26, 0.22)",
  color: "#1a251f",
  padding: "16px",
  fontFamily: "inherit",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 800,
};

const textStyle: CSSProperties = {
  margin: "8px 0 14px",
  color: "rgba(26, 37, 31, 0.74)",
  fontSize: "0.92rem",
  lineHeight: 1.45,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: "999px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 800,
  padding: "10px 14px",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#17231e",
  color: "#fffaf0",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "rgba(23, 35, 30, 0.08)",
  color: "#17231e",
};

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [copy] = useState(() => getUpdateCopy());

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const canRegister =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!canRegister) {
      return;
    }

    let disposed = false;
    let refreshing = false;

    function promptForUpdate(worker: ServiceWorker | null) {
      if (!worker || disposed) {
        return;
      }

      setWaitingWorker(worker);
      setShowUpdatePrompt(true);
    }

    function handleControllerChange() {
      if (refreshing) {
        return;
      }

      refreshing = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        promptForUpdate(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;

          if (!nextWorker) {
            return;
          }

          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              promptForUpdate(nextWorker);
            }
          });
        });

        void registration.update();
      })
      .catch(() => {
        // The trainer still works online if registration fails.
      });

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  function activateUpdate() {
    if (!waitingWorker) {
      return;
    }

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <aside aria-live="polite" role="status" style={bannerStyle}>
      <p style={titleStyle}>{copy.title}</p>
      <p style={textStyle}>{copy.text}</p>
      <div style={actionsStyle}>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={() => setShowUpdatePrompt(false)}
        >
          {copy.later}
        </button>
        <button type="button" style={primaryButtonStyle} onClick={activateUpdate}>
          {copy.update}
        </button>
      </div>
    </aside>
  );
}
