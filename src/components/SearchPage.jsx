import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLibrary } from "../library.jsx";
import { bookAboutText, cosine, embedTexts } from "../semantic.js";

export default function SearchPage() {
  const { books } = useLibrary();
  const [params] = useSearchParams();
  const shelf = params.get("shelf") === "tbr" ? "/tbr" : "/read";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = "Search · Afreen's Library";
  }, []);

  async function search(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Describe the kind of book you want.");
      setResults(null);
      return;
    }
    if (books.length === 0) {
      setError("");
      setResults([]);
      setStatus("");
      return;
    }

    setSearching(true);
    setError("");
    setStatus("Reading what your books are about...");
    try {
      const described = books.map((book) => ({ book, text: bookAboutText(book) }));
      const vectors = await embedTexts(
        [trimmed, ...described.map((item) => item.text || item.book.title)],
        (info) => {
          if (info.status === "progress" && typeof info.progress === "number") {
            setStatus(`Getting the search ready... ${Math.round(info.progress)}%`);
          } else if (info.status === "initiate" || info.status === "download") {
            setStatus("Getting the search ready...");
          }
        },
      );
      const queryVector = vectors[0];
      const ranked = described
        .map((item, index) => ({
          book: item.book,
          score: cosine(queryVector, vectors[index + 1]),
        }))
        .filter((item) => item.score >= 0.2)
        .sort((left, right) => right.score - left.score)
        .slice(0, 8);
      setResults(ranked);
      setStatus("");
    } catch {
      setResults(null);
      setStatus("");
      setError("The meaning search couldn't start. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="journal-page">
      <header className="page-bar">
        <Link className="ink-button" to={shelf}>
          Back to the shelf
        </Link>
        <h1>Search</h1>
        <span />
      </header>
      <form className="notebook" onSubmit={search}>
        <p className="shelf-note">Search your shelves by what a book is about.</p>
        <label className="field">
          Describe a book
          <textarea
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            rows={3}
            placeholder="A lonely student in Tokyo"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {status ? <p className="shelf-note">{status}</p> : null}
        <button type="submit" className="ink-button primary" disabled={searching}>
          Search
        </button>
      </form>
      {results && results.length === 0 ? (
        <p className="shelf-note search-empty">
          {books.length === 0
            ? "Your shelves are empty, so there is nothing to search yet."
            : "Nothing on your shelves is close to that."}
        </p>
      ) : null}
      {results && results.length > 0 ? (
        <div className="matches">
          {results.map(({ book, score }) => (
            <Link key={book.id} className="match" to={`/book/${book.id}`}>
              <strong>{book.title}</strong>
              <span>{book.author || "Author unknown"}</span>
              <span>{[book.genre, shelfName(book.status), closeness(score)].filter(Boolean).join(" · ")}</span>
              {book.blurb ? <p>{snippet(book.blurb)}</p> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function shelfName(status) {
  return status === "read" ? "Books I've Read" : "To Be Read";
}

function closeness(score) {
  if (score >= 0.5) return "Close match";
  if (score >= 0.36) return "Related";
  return "Loose match";
}

function snippet(blurb) {
  const clean = blurb.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177)}...`;
}
