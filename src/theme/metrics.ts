// Sizes from the web auth/profile forms (spec §6).

export const radius = {
  md: 12,
} as const;

export const sizes = {
  input: 52,
  /** Change-password inputs are slightly shorter. */
  inputCompact: 48,
  button: 50,
  inputBorder: 1.5,
  focusBorder: 2,
} as const;
