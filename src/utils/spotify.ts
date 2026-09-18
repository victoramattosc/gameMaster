export interface ParsedSpotifyLink {
  embedUrl: string;
  key: string;
}

const SPOTIFY_URL_RE =
  /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;

export function parseSpotifyUrl(url: string): ParsedSpotifyLink | null {
  const match = url.match(SPOTIFY_URL_RE);
  if (!match) return null;
  const [, type, id] = match;
  return { embedUrl: `https://open.spotify.com/embed/${type}/${id}`, key: id };
}
