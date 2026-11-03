// Style properties that affect how text wraps; copied onto the mirror so it
// lays out the text exactly like the textarea does.
const MIRRORED_PROPERTIES = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "tabSize",
] as const;

export interface CaretPosition {
  /** Offsets inside the textarea's box, already corrected for scrolling. */
  top: number;
  left: number;
  height: number;
}

/**
 * Pixel position of the character at `index` inside a textarea. A textarea
 * can't report this itself, so we render the text before `index` in a hidden
 * copy with identical styling and measure where a marker span lands.
 */
export const getTextareaCaretPosition = (
  textarea: HTMLTextAreaElement,
  index: number
): CaretPosition => {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  for (const prop of MIRRORED_PROPERTIES) {
    mirror.style[prop] = computed[prop];
  }

  mirror.textContent = textarea.value.slice(0, index);
  const marker = document.createElement("span");
  // Non-empty so the span has a box even at the end of a line.
  marker.textContent = textarea.value.slice(index) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const position = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    height: marker.offsetHeight,
  };
  document.body.removeChild(mirror);
  return position;
};
