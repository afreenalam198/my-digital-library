import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Hearts from "./Hearts.jsx";
import { useAuth } from "../auth.jsx";
import { useLibrary } from "../library.jsx";
import { spineColor } from "../storage.js";

export default function BookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, ready, removeBook } = useLibrary();
  const { isOwner } = useAuth();
  const book = books.find((item) => item.id === id);
  const [confirming, setConfirming] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (book) document.title = `${book.title} · Afreen's Library`;
  }, [book]);

  if (!ready) {
    return (
      <main className="journal-page">
        <p className="shelf-note">Opening the shelf...</p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="journal-page">
        <p className="shelf-note">That book isn't on the shelf.</p>
        <Link className="ink-button" to="/">
          Back to the doors
        </Link>
      </main>
    );
  }

  const shelfPath = book.status === "read" ? "/read" : "/tbr";
  const showPhoto = book.coverUrl && !coverFailed;

  const canEdit = book.status === "tbr" || isOwner;

  async function remove() {
    try {
      await removeBook(book.id);
      navigate(shelfPath);
    } catch (err) {
      setActionError(err.message || "That book stayed on the shelf.");
      setConfirming(false);
    }
  }

  return (
    <main className="journal-page">
      <header className="page-bar book-title-bar">
        <Link className="ink-button" to={shelfPath}>
          Back to the shelf
        </Link>
        <FittedTitle title={book.title} />
        <span />
      </header>
      <article className="journal">
        {showPhoto ? (
          <img
            className="cover-photo"
            src={book.coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="drawn-cover" style={{ backgroundColor: spineColor(book.title) }}>
            <FittedTitle as="span" title={book.title} />
          </div>
        )}
        <div className="journal-copy">
          <p className="author">{book.author || "Author unknown"}</p>
          {book.genre ? <p className="genre">{book.genre}</p> : null}
          {book.status === "read" ? (
            <>
              <Hearts value={book.rating ?? 0} />
              <h2>Review</h2>
              <p className="writing">{book.review || "No review yet."}</p>
            </>
          ) : (
            <>
              <h2>Note</h2>
              <p className="writing">{book.note || "No note yet."}</p>
            </>
          )}
          {book.blurb ? (
            <>
              <h2>About</h2>
              <p className="writing">{book.blurb}</p>
            </>
          ) : null}
          {canEdit ? (
            <div className="action-row">
              {book.status === "tbr" && isOwner ? (
                <Link className="ink-button primary" to={`/book/${book.id}/finish`}>
                  Mark as read
                </Link>
              ) : null}
              <Link className="ink-button" to={`/book/${book.id}/edit`}>
                Edit
              </Link>
              <button type="button" className="ink-button" onClick={() => setConfirming(true)}>
                Delete
              </button>
            </div>
          ) : null}
          {actionError ? <p className="form-error">{actionError}</p> : null}
          {confirming ? (
            <div className="confirm">
              <p>Take this book off the shelf?</p>
              <div className="action-row">
                <button type="button" className="ink-button primary" onClick={remove}>
                  Remove
                </button>
                <button type="button" className="ink-button" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function FittedTitle({ as: Tag = "h1", title }) {
  if (title.length <= 50) return <Tag>{title}</Tag>;
  const parts = title.split(/(\s+)/);
  return (
    <Tag className="long-title">
      {parts.map((part, index) =>
        part.trim() ? (
          <span className="title-word" key={`${part}-${index}`}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </Tag>
  );
}
