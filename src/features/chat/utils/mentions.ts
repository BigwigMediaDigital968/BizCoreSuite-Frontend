/**
 * Mentions are stored in message text as tokens: `@[Display Name](userId)`.
 * Keep MENTION_TOKEN identical to the server's (utils/mentions.ts).
 */
const MENTION_TOKEN_SOURCE = String.raw`@\[([^\]\n]{1,80})\]\(([a-f0-9]{24})\)`;

export interface Mentionable {
  _id: string;
  name: string;
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Turns `@Priya Sharma` in a draft into `@[Priya Sharma](id)`.
 * `picked` (names chosen from the popover) win over `members`; a member name
 * shared by two people is skipped unless one was picked, since we can't tell
 * who was meant. The longest names match first so "Priya Sharma" beats "Priya".
 */
export const toMentionTokens = (
  content: string,
  picked: Mentionable[],
  members: Mentionable[]
): string => {
  const idByName = new Map<string, string>();
  for (const p of picked) idByName.set(p.name, p._id);

  const seen = new Map<string, number>();
  for (const m of members) seen.set(m.name, (seen.get(m.name) ?? 0) + 1);
  for (const m of members) {
    if (!idByName.has(m.name) && seen.get(m.name) === 1) idByName.set(m.name, m._id);
  }
  if (idByName.size === 0) return content;

  const names = [...idByName.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);
  // `@` at the start or after whitespace, and the name must end the word
  // ("@Anna" must not tag "@Annabel").
  const pattern = new RegExp(`(^|\\s)@(${names.join("|")})(?![\\w])`, "g");

  return content.replace(
    pattern,
    (_, lead: string, name: string) =>
      `${lead}@[${name.replace(/[[\]]/g, "")}](${idByName.get(name)})`
  );
};

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "mention"; userId: string; name: string };

/** Splits message text into plain runs and mention tokens, in order. */
export const parseMessage = (content: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  let last = 0;
  for (const match of content.matchAll(new RegExp(MENTION_TOKEN_SOURCE, "gi"))) {
    if (match.index > last) {
      parts.push({ type: "text", text: content.slice(last, match.index) });
    }
    parts.push({ type: "mention", name: match[1], userId: match[2].toLowerCase() });
    last = match.index + match[0].length;
  }
  if (last < content.length) parts.push({ type: "text", text: content.slice(last) });
  return parts;
};

/** `@[Priya](id)` -> `@Priya`, for room-list previews. */
export const mentionsToPlainText = (content: string): string =>
  content.replace(new RegExp(MENTION_TOKEN_SOURCE, "gi"), "@$1");
