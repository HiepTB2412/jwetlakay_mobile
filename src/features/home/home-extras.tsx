import { LuckySpinButton } from "@/features/lucky-spin";
import { NewsPopup } from "@/features/news";

/**
 * Home-page extras (web HomeExtras, spec Phần B §3.8 / §6.0): the news popup and the floating
 * Lucky Spin button. Render them on the screen that is the CMS home page (`home.path`), or on
 * "/" when there is none. They remount (and the popup shows again) every time that screen does.
 */
export function HomeExtras() {
  return (
    <>
      <NewsPopup />
      <LuckySpinButton />
    </>
  );
}
