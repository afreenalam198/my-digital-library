import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth.jsx";
import { fetchWorkDetails } from "./openLibrary.js";
import { loadBooks, saveBooks } from "./storage.js";
import {
  deleteBookRow,
  fetchBooks,
  insertBook,
  isSupabaseConfigured,
  supabase,
  updateBookRow,
  upsertBooks,
} from "./supabase.js";

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const remote = isSupabaseConfigured();
  const { ready: authReady, isOwner } = useAuth();
  const [books, setBooks] = useState(() => (remote ? [] : loadBooks()));
  const [ready, setReady] = useState(!remote);
  const [libraryError, setLibraryError] = useState("");

  const updateBook = useCallback(
    async (id, patch) => {
      if (remote) await updateBookRow(id, patch);
      setBooks((current) => current.map((book) => (book.id === id ? { ...book, ...patch } : book)));
    },
    [remote],
  );

  useEffect(() => {
    if (!authReady) return undefined;
    if (!remote) {
      setBooks(loadBooks());
      setReady(true);
      return undefined;
    }

    let cancel = false;

    async function load() {
      try {
        let next = await fetchBooks();
        if (isOwner && next.length === 0 && localStorage.getItem("afreen-library-imported") !== "yes") {
          const local = loadBooks();
          if (local.length > 0) {
            await upsertBooks(local);
            localStorage.setItem("afreen-library-imported", "yes");
            next = await fetchBooks();
          }
        }
        if (!cancel) {
          setBooks(next);
          setLibraryError("");
        }
      } catch (err) {
        if (!cancel) setLibraryError(err.message || "The library didn't load.");
      } finally {
        if (!cancel) setReady(true);
      }
    }

    load();
    const channel = supabase
      .channel("books-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "books" }, () => {
        fetchBooks()
          .then((next) => {
            if (!cancel) setBooks(next);
          })
          .catch(() => {});
      })
      .subscribe();

    return () => {
      cancel = true;
      supabase.removeChannel(channel);
    };
  }, [authReady, isOwner, remote]);

  useEffect(() => {
    if (remote || !ready) return;
    saveBooks(books);
  }, [books, ready, remote]);

  useEffect(() => {
    if (!isOwner) return undefined;
    const pending = books.filter((book) => book.olKey && !book.genreReady);
    if (pending.length === 0) return undefined;
    let cancel = false;

    (async () => {
      for (const book of pending) {
        if (cancel) return;
        try {
          const details = await fetchWorkDetails(book.olKey, undefined, {
            title: book.title,
            author: book.author,
          });
          if (cancel) return;
          await updateBook(book.id, {
            genre: details.genre || book.genre,
            blurb: book.blurb || details.blurb,
            genreReady: true,
            aboutChecked: true,
            detailsFetched: true,
          });
        } catch {
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [books, isOwner, updateBook]);

  const value = useMemo(
    () => ({
      books,
      ready,
      libraryError,
      async addBook(book) {
        if (remote) await insertBook(book);
        setBooks((current) => (current.some((item) => item.id === book.id) ? current : [...current, book]));
      },
      updateBook,
      async removeBook(id) {
        if (remote) await deleteBookRow(id);
        setBooks((current) => current.filter((book) => book.id !== id));
      },
    }),
    [books, libraryError, ready, remote, updateBook],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }
  return value;
}
