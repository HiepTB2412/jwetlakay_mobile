/**
 * Item of `GET management-service/v1/banner/popup/end-user` (spec Phần B §6.1). The web types the
 * response as `any` and reads only these fields; other fields are passed through untyped.
 */
export type NewsPopupItem = {
  /** "NEWS" | "URL" are shown; other types are ignored (backend values not confirmed). */
  type: string;
  image?: string | null;
  /** News id (NEWS) or link (URL). The image is tappable only when this is non-empty. */
  referenceId?: string | null;
  [field: string]: unknown;
};
