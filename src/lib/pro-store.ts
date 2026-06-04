import { useState, useEffect } from "react";

export function useProStatus() {
  const [isPro, setIsPro] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pdf_master_pro") === "true";
    }
    return false;
  });

  const upgradeToPro = () => {
    localStorage.setItem("pdf_master_pro", "true");
    setIsPro(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("proStatusChanged"));
    }
  };

  const downgradeToFree = () => {
    localStorage.removeItem("pdf_master_pro");
    setIsPro(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("proStatusChanged"));
    }
  };

  useEffect(() => {
    const handleChanged = () => {
      setIsPro(localStorage.getItem("pdf_master_pro") === "true");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("proStatusChanged", handleChanged);
      window.addEventListener("storage", handleChanged); // Sync across tabs
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("proStatusChanged", handleChanged);
        window.removeEventListener("storage", handleChanged);
      }
    };
  }, []);

  return { isPro, upgradeToPro, downgradeToFree };
}
