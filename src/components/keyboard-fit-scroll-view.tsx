import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type KeyboardFitScrollViewProps = {
  /** The content block (e.g. logo + title + form), vertically centered when the keyboard is closed. */
  children: ReactNode;
  /** Change it when the content switches step so the fit is recomputed for the new focused input. */
  fitKey?: unknown;
  /** Space kept between the end of the content and the keyboard. */
  gap?: number;
  /** Style of the centering wrapper (padding etc.). */
  contentStyle?: StyleProp<ViewStyle>;
};

/** Keyboard position in window coordinates; null while hidden. */
type KeyboardFrame = { top: number; height: number };

/** The focused input never scrolls closer than this to the top edge. */
const TOP_MARGIN = 8;
/** Lets the step's autofocus land before measuring the focused input. */
const STEP_SETTLE_MS = 120;

/**
 * Scroll view for centered forms (auth screens). With the keyboard open it picks the smallest
 * scroll that is worth it:
 * 1. Everything fits above the keyboard → show it all, logo to footer.
 * 2. It doesn't fit, but the end of the content (submit button) can be brought above the keyboard
 *    with the focused input still on screen → do that; the top (logo) is hidden only because the
 *    button needs the room (small screens).
 * 3. The content is too long for its end to be reached (long register form) → scroll only as far
 *    as the focused input needs; don't give up the logo and title for a partial gain.
 *
 * The position is recomputed from scratch on every keyboard show/hide/resize, step change and,
 * while the keyboard is open, every content size change (an error message appearing must not
 * push the submit button under the keyboard).
 * KeyboardAwareScrollView only ever adds scroll, so switching steps or keyboard type
 * (number pad ↔ letters) left extra scroll behind and pushed the logo off screen.
 *
 * Determinism: fit() reads the latest keyboard frame from a ref (never a value captured by an
 * older closure, e.g. the step timer), only the most recent call applies its result, and the
 * keyboard frame comes from one event source per platform.
 */
export function KeyboardFitScrollView({ children, fitKey, gap = 16, contentStyle }: KeyboardFitScrollViewProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const wrapperRef = useRef<ComponentRef<typeof View>>(null);
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  // State sizes the spacer below; the ref is what fit() reads.
  const [keyboard, setKeyboard] = useState<KeyboardFrame | null>(null);
  const keyboardRef = useRef<KeyboardFrame | null>(null);
  const latestFit = useRef(0);

  const fit = useCallback(() => {
    const run = ++latestFit.current;
    const scroll = scrollRef.current;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!scroll || !wrapper || !content) return;

    const frame = keyboardRef.current;
    if (!frame) {
      scroll.scrollTo({ y: 0, animated: true });
      return;
    }

    // Positions are relative to the wrapper, which sits at y = 0 of the scroll content;
    // the visible height runs from the top of the scroll view to the top of the keyboard.
    scroll.getNativeScrollRef()?.measureInWindow((_x, scrollTopInWindow) => {
      const visibleHeight = frame.top - scrollTopInWindow;
      content.measureLayout(wrapper, (_cx, contentY, _cw, contentHeight) => {
        // Scroll that brings the end of the content (submit button, footer) above the keyboard.
        const showEnd = contentY + contentHeight + gap - visibleHeight;

        const apply = (inputTop?: number, inputHeight?: number) => {
          // A newer fit started while this one was measuring: its result wins.
          if (run !== latestFit.current) return;
          let target: number;
          if (showEnd <= contentY) {
            target = showEnd; // 1. everything fits, content top included
          } else if (inputTop === undefined || inputHeight === undefined) {
            target = 0;
          } else if (showEnd <= inputTop - TOP_MARGIN) {
            target = showEnd; // 2. the end is reachable with the focused input still visible
          } else {
            target = inputTop + inputHeight + gap - visibleHeight; // 3. just keep the input visible
          }
          scroll.scrollTo({ y: Math.max(0, target), animated: true });
        };

        const focused = TextInput.State.currentlyFocusedInput();
        if (focused) {
          focused.measureLayout(wrapper, (_ix, inputTop, _iw, inputHeight) => apply(inputTop, inputHeight), () => apply());
        } else {
          apply();
        }
      });
    });
  }, [gap]);

  useEffect(() => {
    const update = (frame: KeyboardFrame | null) => {
      keyboardRef.current = frame;
      setKeyboard(frame);
    };
    // One source per platform, reporting resizes too (number pad → letters + Passwords bar):
    // iOS sends every frame change (show, hide, resize) as keyboardWillChangeFrame;
    // Android re-sends keyboardDidShow when the keyboard height changes.
    const subscriptions =
      Platform.OS === "ios"
        ? [
            Keyboard.addListener("keyboardWillChangeFrame", ({ endCoordinates }) => {
              const screenHeight = Dimensions.get("screen").height;
              update(
                endCoordinates.screenY >= screenHeight
                  ? null
                  : { top: endCoordinates.screenY, height: screenHeight - endCoordinates.screenY },
              );
            }),
          ]
        : [
            Keyboard.addListener("keyboardDidShow", ({ endCoordinates }) =>
              update({ top: endCoordinates.screenY, height: endCoordinates.height }),
            ),
            Keyboard.addListener("keyboardDidHide", () => update(null)),
          ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  // After the spacer below has been laid out for the new keyboard frame.
  useEffect(() => {
    fit();
  }, [keyboard, fit]);

  useEffect(() => {
    const timer = setTimeout(fit, STEP_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [fitKey, fit]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
    >
      {/* Fixed height (the viewport), so the keyboard spacer below never re-centers the content. */}
      <View
        ref={wrapperRef}
        collapsable={false}
        style={[styles.wrapper, viewportHeight ? { minHeight: viewportHeight } : styles.grow, contentStyle]}
      >
        <View
          ref={contentRef}
          collapsable={false}
          // Only while the keyboard is open: with it closed, re-fitting would scroll back to the
          // top and undo the user's own scrolling on long forms.
          onLayout={() => keyboardRef.current && fit()}
        >
          {children}
        </View>
      </View>
      <View style={{ height: keyboard?.height ?? 0 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { flexGrow: 1 },
  wrapper: { justifyContent: "center" },
  grow: { flex: 1 },
});
