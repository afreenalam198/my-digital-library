export function coverUrlFromId(coverId) {
  if (!coverId) return "";
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

const SKIP_GENRE =
  /^(accessible book|protected daisy|in library|lending library|large type|large print|open library staff|overdrive|internet archive|long now|nyt:|reading level)/i;
const GENERIC_GENRE = /^(fiction|nonfiction|non-fiction|novel|juvenile fiction|juvenile literature)$/i;

const KNOWN_GENRE =
  /fantasy|myth|romance|fiction|mystery|science|histor|memoir|biograph|thriller|horror|poet|classic|literary|young adult|adventure|magic|dystop|japan|love|college|student/i;

function usefulGenre(subject) {
  if (/[^\u0000-\u024F]/.test(subject)) return false;
  if (!KNOWN_GENRE.test(subject)) return false;
  return subject.includes(" ") || subject.includes(",") || subject.length > 10;
}

export function pickGenre(subjects) {
  const clean = (Array.isArray(subjects) ? subjects : [])
    .map((item) => String(item).trim())
    .filter((item) => item && !SKIP_GENRE.test(item));
  const readable = clean.filter(usefulGenre);
  const pool = readable.length > 0 ? readable : clean;
  const specific = pool.filter((item) => !GENERIC_GENRE.test(item));
  return (specific.length > 0 ? specific : pool)
    .slice(0, 2)
    .map((item) => item.replace(/, general$/i, ""))
    .join(", ");
}

function plainText(value) {
  const raw = typeof value === "string" ? value : value?.value || "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchBooks(query, signal) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("fields", "key,title,author_name,cover_i,first_publish_year,subject");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Open Library search failed");
  }

  const data = await response.json();
  return (data.docs ?? [])
    .filter((doc) => doc.title)
    .map((doc) => ({
      olKey: doc.key ?? "",
      title: doc.title,
      author: Array.isArray(doc.author_name) && doc.author_name[0] ? doc.author_name[0] : "",
      coverUrl: coverUrlFromId(doc.cover_i),
      year: doc.first_publish_year ?? null,
      genre: pickGenre(doc.subject),
    }));
}

async function readWork(olKey, signal) {
  if (!olKey) return { genre: "", blurb: "" };
  const path = olKey.startsWith("/") ? olKey : `/${olKey}`;
  const response = await fetch(`https://openlibrary.org${path}.json`, { signal });
  if (!response.ok) {
    throw new Error("Open Library work lookup failed");
  }
  const data = await response.json();
  return {
    genre: pickGenre(data.subjects),
    blurb: plainText(data.description),
  };
}

export async function fetchWorkDetails(olKey, signal, hint = {}) {
  const primary = await readWork(olKey, signal);
  if (primary.blurb || !hint.title) return primary;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", hint.title);
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "key,title");
  const response = await fetch(url, { signal });
  if (!response.ok) return primary;

  const data = await response.json();
  const title = hint.title.trim().toLowerCase();
  for (const doc of data.docs ?? []) {
    if (!doc.key || doc.key === olKey || (doc.title || "").trim().toLowerCase() !== title) continue;
    const next = await readWork(doc.key, signal);
    if (!next.blurb) continue;
    return {
      genre: primary.genre || next.genre,
      blurb: next.blurb,
    };
  }
  return primary;
}
