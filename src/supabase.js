import { createClient } from "@supabase/supabase-js";
import { normalizeBook, normalizePatch } from "./bookFields.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && key);
}

export const supabase = isSupabaseConfigured() ? createClient(url, key) : null;

export function toRow(book) {
  const clean = normalizeBook(book);
  return {
    id: clean.id,
    ol_key: clean.olKey,
    title: clean.title,
    author: clean.author,
    cover_url: clean.coverUrl,
    genre: clean.genre,
    blurb: clean.blurb,
    status: clean.status,
    rating: clean.rating,
    review: clean.review,
    note: clean.note,
    details_fetched: Boolean(clean.detailsFetched),
    genre_ready: Boolean(clean.genreReady),
    about_checked: Boolean(clean.aboutChecked),
  };
}

export function fromRow(row) {
  return {
    id: row.id,
    olKey: row.ol_key ?? "",
    title: row.title,
    author: row.author ?? "",
    coverUrl: row.cover_url ?? "",
    genre: row.genre ?? "",
    blurb: row.blurb ?? "",
    status: row.status,
    rating: row.rating,
    review: row.review ?? "",
    note: row.note ?? "",
    detailsFetched: Boolean(row.details_fetched),
    genreReady: Boolean(row.genre_ready),
    aboutChecked: Boolean(row.about_checked),
  };
}

function patchRow(patch) {
  const clean = normalizePatch(patch);
  const row = {};
  if ("olKey" in clean) row.ol_key = clean.olKey;
  if ("title" in clean) row.title = clean.title;
  if ("author" in clean) row.author = clean.author;
  if ("coverUrl" in clean) row.cover_url = clean.coverUrl;
  if ("genre" in clean) row.genre = clean.genre;
  if ("blurb" in clean) row.blurb = clean.blurb;
  if ("status" in clean) row.status = clean.status;
  if ("rating" in clean) row.rating = clean.rating;
  if ("review" in clean) row.review = clean.review;
  if ("note" in clean) row.note = clean.note;
  if ("detailsFetched" in clean) row.details_fetched = Boolean(clean.detailsFetched);
  if ("genreReady" in clean) row.genre_ready = Boolean(clean.genreReady);
  if ("aboutChecked" in clean) row.about_checked = Boolean(clean.aboutChecked);
  return row;
}

export async function fetchBooks() {
  const { data, error } = await supabase.from("books").select("*").order("title");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function insertBook(book) {
  const { error } = await supabase.from("books").insert(toRow(book));
  if (error) throw new Error(error.message);
}

export async function upsertBooks(books) {
  const { error } = await supabase.from("books").upsert(books.map(toRow));
  if (error) throw new Error(error.message);
}

export async function updateBookRow(id, patch) {
  const { error } = await supabase.from("books").update(patchRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBookRow(id) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
