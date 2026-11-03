import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/toast";

import { onSignatureRejected } from "./signed-requests";

/** Matches the toast's auto-hide, so a burst of rejected requests shows one toast (web toastId). */
const DEDUPE_MS = 3000;

/** Shows "Odds are temporarily unavailable" when sport-api rejects our signature (01401). */
export function useSignatureRejectedToast(): void {
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let lastShownAt = 0;
    return onSignatureRejected(() => {
      const now = Date.now();
      if (now - lastShownAt < DEDUPE_MS) return;
      lastShownAt = now;
      toast.error(t("sportApiUnavailable"));
    });
  }, [toast, t]);
}
