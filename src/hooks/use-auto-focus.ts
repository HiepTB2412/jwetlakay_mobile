import { useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";

import type { TextFieldRef } from "@/components/text-field";

type TransitionEndListener = (event: { data?: { closing?: boolean } }) => void;
// expo-router does not export the native-stack navigation types, so only the event used here is typed.
type StackEvents = { addListener: (type: "transitionEnd", listener: TransitionEndListener) => () => void };

/** Used when no push animation runs (initial route, reduced motion, web). */
const TRANSITION_FALLBACK_MS = 600;

/**
 * Focuses the returned ref (and so opens the keyboard) once the screen has finished
 * sliding in, and again every time `step` changes. Attach it to the first input of
 * whatever step is showing.
 *
 * `autoFocus` alone fires mid-transition, which makes the keyboard animate over the push
 * or, on some Android devices, not open at all.
 */
export function useAutoFocus<T extends { focus: () => void } = TextFieldRef>(step?: unknown) {
  const ref = useRef<T>(null);
  const navigation = useNavigation() as unknown as StackEvents;
  const [screenReady, setScreenReady] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", (event) => {
      if (!event.data?.closing) setScreenReady(true);
    });
    const fallback = setTimeout(() => setScreenReady(true), TRANSITION_FALLBACK_MS);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation]);

  useEffect(() => {
    if (!screenReady) return;
    // One frame so a field mounted by this step change is attached before focusing.
    const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [screenReady, step]);

  return ref;
}
