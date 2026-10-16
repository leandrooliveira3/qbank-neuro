import raw from "./mentice-videos.json";
export interface MenticeVideo {
  id: string;
  title: string;
  duration: number | null;
  url: string;
  scope: string;
  topic: string;
  kind: string;
  channel_id: string;
  author: string;
  published: string | null;
  embed_allowed: boolean | null;
  metadata_checked: boolean;
  review_basis: string;
}
export const catalogue = raw as {
  channel: string;
  channel_id: string;
  scanned_at: string;
  total_scanned: number;
  pages: number;
  complete: boolean;
  videos: MenticeVideo[];
  excluded: { id: string; title: string; reason: string }[];
};
export function embedUrl(id: string) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id))
    throw new Error("Identificador YouTube inválido");
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}
export function timeLabel(duration: number | null) {
  if (!duration) return "Duração não disponível";
  return `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`;
}
