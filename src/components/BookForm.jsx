import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Hearts from "./Hearts.jsx";
import { useAuth } from "../auth.jsx";
import { useLibrary } from "../library.jsx";
import { fetchWorkDetails, searchBooks } from "../openLibrary.js";

export default function BookForm({ mode }) {
  const { id, status: statusParam } = useParams();
  const navigate = useNavigate();
  const { books, ready, addBook, updateBook } = useLibrary();
  const { isOwner } = useAuth();
  const existing = books.find((book) => book.id === id);
  const addStatus = statusParam === "tbr" ? "tbr" : "read";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [review, setReview] = useState(existing?.review ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [genre, setGenre] = useState(existing?.genre ?? "");
  const [blurb, setBlurb] = useState(existing?.blurb ?? "");
  const [error, setError] = useState("");
  const pickToken = useRef(0);

  const isAdd = mode === "add";
  const isFinish = mode === "finish";
  const bookStatus = isAdd ? addStatus : existing?.status;
  const asksForReview = bookStatus === "read" || isFinish;

  useEffect(() => {
    document.title = isAdd ? "Add a book · Afreen's Library" : "Edit book · Afreen's Library";
  }, [isAdd]);

  useEffect(() => {
    if (isAdd || !existing?.genre) return;
    setGenre((current) => current || existing.genre);
  }, [existing?.genre, isAdd]);

  useEffect(() => {
    if (!isAdd) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError("");
      return undefined;
    }

    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const found = await searchBooks(trimmed, controller.signal);
        setResults(found);
      } catch (err) {
        if (err.name !== "AbortError") {
          setResults([]);
          setSearchError("The catalog didn't answer. You can still save this title.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isAdd]);

  if (!ready) {
    return (
      <main className="journal-page">
        <p className="shelf-note">Opening the shelf...</p>
      </main>
    );
  }

  const visitorBlocked =
    (isAdd && addStatus === "read" && !isOwner) ||
    (isFinish && !isOwner) ||
    (!isAdd && !isFinish && existing?.status === "read" && !isOwner);

  if (visitorBlocked) {
    return <Navigate to={existing ? `/book/${existing.id}` : addStatus === "tbr" ? "/tbr" : "/read"} replace />;
  }

  if (!isAdd && !existing) {
    return (
      <main className="journal-page">
        <p className="shelf-note">That book isn't on the shelf.</p>
        <Link className="ink-button" to="/">
          Back to the doors
        </Link>
      </main>
    );
  }

  if (isFinish && existing?.status === "read") {
    return (
      <main className="journal-page">
        <p className="shelf-note">This book is already in Books I've Read.</p>
        <Link className="ink-button" to={`/book/${existing.id}`}>
          Back to the book
        </Link>
      </main>
    );
  }

  const backTo = isAdd ? (addStatus === "read" ? "/read" : "/tbr") : `/book/${existing.id}`;

  async function save(event) {
    event.preventDefault();
    if (asksForReview && rating < 1) {
      setError("Choose a heart rating before saving a book you have read.");
      return;
    }

    if (isAdd) {
      const title = (picked?.title || query).trim();
      if (!title) {
        setError("Type a title, or choose a match from the catalog.");
        return;
      }
      let nextGenre = genre.trim();
      let nextBlurb = blurb.trim();
      if (picked?.olKey && !nextBlurb) {
        try {
          const details = await fetchWorkDetails(picked.olKey, undefined, {
            title,
            author: picked.author,
          });
          nextBlurb = details.blurb;
          if (!nextGenre) nextGenre = details.genre;
        } catch {
          nextBlurb = "";
        }
      }
      const book = {
        id: crypto.randomUUID(),
        olKey: picked?.olKey ?? "",
        title,
        author: picked?.author ?? "",
        coverUrl: picked?.coverUrl ?? "",
        genre: nextGenre,
        blurb: nextBlurb,
        detailsFetched: Boolean(nextBlurb || !picked?.olKey),
        status: addStatus,
        rating: addStatus === "read" ? rating : null,
        review: addStatus === "read" ? review.trim() : "",
        note: addStatus === "tbr" ? note.trim() : "",
      };
      try {
        await addBook(book);
      } catch (err) {
        setError(err.message || "That book couldn't be saved.");
        return;
      }
      navigate(addStatus === "read" ? "/read" : "/tbr");
      return;
    }

    try {
      if (isFinish) {
        await updateBook(existing.id, {
          status: "read",
          rating,
          review: review.trim(),
        });
      } else if (existing.status === "read") {
        await updateBook(existing.id, { rating, review: review.trim(), genre: genre.trim() });
      } else {
        await updateBook(existing.id, { note: note.trim(), genre: genre.trim() });
      }
    } catch (err) {
      setError(err.message || "That change couldn't be saved.");
      return;
    }
    navigate(`/book/${existing.id}`);
  }

  const heading = isAdd ? "Add a book" : isFinish ? "Mark as read" : "Edit book";

  return (
    <main className="journal-page">
      <header className="page-bar">
        <Link className="ink-button" to={backTo}>
          Back
        </Link>
        <h1>{heading}</h1>
        <span />
      </header>
      <form className="notebook" onSubmit={save}>
        {isAdd ? (
          <p className="shelf-note">
            {addStatus === "read" ? "Saving into Books I've Read." : "Saving into To Be Read."}
          </p>
        ) : null}
        {isFinish ? <p className="author">{existing.title}</p> : null}
        {!isAdd && !isFinish && existing.status === "read" ? (
          <p className="shelf-note">Stays in Books I've Read.</p>
        ) : null}

        {isAdd ? (
          <label className="field">
            Title
            <input
              value={query}
              maxLength={150}
              onChange={(event) => {
                const next = event.target.value;
                const limited =
                  next.length <= 150 || (query.length > 150 && next.length <= query.length)
                    ? next
                    : query.length > 150
                      ? query
                      : next.slice(0, 150);
                pickToken.current += 1;
                setQuery(limited);
                setPicked(null);
                setBlurb("");
                setError("");
              }}
              placeholder="The Night Circus"
              autoComplete="off"
            />
          </label>
        ) : null}

        {isAdd && searching ? <p className="shelf-note">Looking through the catalog...</p> : null}
        {isAdd && searchError ? <p className="form-error">{searchError}</p> : null}
        {isAdd && results.length > 0 ? (
          <div className="results" role="listbox" aria-label="Open Library matches">
            {results.map((result) => {
              const key = `${result.olKey}-${result.title}-${result.year ?? ""}`;
              const selected = picked?.olKey === result.olKey && picked?.title === result.title;
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "result picked" : "result"}
                  onClick={() => {
                    const token = pickToken.current + 1;
                    pickToken.current = token;
                    setPicked(result);
                    setQuery(result.title);
                    setGenre(result.genre || "");
                    setBlurb("");
                    setError("");
                    if (!result.olKey) return;
                    fetchWorkDetails(result.olKey, undefined, {
                      title: result.title,
                      author: result.author,
                    })
                      .then((details) => {
                        if (pickToken.current !== token) return;
                        setGenre(details.genre || result.genre || "");
                        setBlurb(details.blurb || "");
                      })
                      .catch(() => {});
                  }}
                >
                  {result.coverUrl ? (
                    <img src={result.coverUrl} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="result-blank">No cover</span>
                  )}
                  <span>
                    <strong>{result.title}</strong>
                    <span>
                      {[result.author, result.genre, result.year].filter(Boolean).join(" · ") || "Author unknown"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {isAdd && !searching && query.trim().length >= 2 && results.length === 0 && !searchError ? (
          <p className="shelf-note">No matches. You can still save this title.</p>
        ) : null}

        {!isFinish ? (
          <label className="field">
            Genre
            <input
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              placeholder="Mythology, Fantasy"
            />
          </label>
        ) : null}
        {isAdd && blurb ? <p className="blurb-preview">{blurb}</p> : null}

        {asksForReview ? (
          <Hearts
            value={rating}
            onChange={(next) => {
              setRating(next);
              setError("");
            }}
          />
        ) : null}

        {asksForReview ? (
          <label className="field">
            Review
            <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={4} />
          </label>
        ) : (
          <label className="field">
            Note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
          </label>
        )}

        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="ink-button primary">
          {isFinish ? "Save as read" : "Save book"}
        </button>
      </form>
    </main>
  );
}
