import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useLibrary } from "../library.jsx";
import { bookSize } from "../spineTitle.js";
import { spineColor } from "../storage.js";

export default function Shelf({ status }) {
  const { books, ready, libraryError } = useLibrary();
  const { isOwner } = useAuth();
  const canAdd = status === "tbr" || isOwner;
  const title = status === "read" ? "Books I've Read" : "To Be Read";
  const [fontsReady, setFontsReady] = useState(false);
  const mine = books
    .filter((book) => book.status === status)
    .map((book) => ({ ...book, ...bookSize(book.title, textLength) }));
  const addBook = { id: "add", add: true, ...bookSize("Add a book", textLength) };
  const stackRef = useRef(null);
  const [innerWidth, setInnerWidth] = useState(() => guessInnerWidth());
  const rows = packRows(canAdd ? [...mine, addBook] : mine, innerWidth);

  useEffect(() => {
    document.title = `${title} · Afreen's Library`;
  }, [title]);

  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useLayoutEffect(() => {
    const el = stackRef.current;
    if (!el) return undefined;

    const measure = () => {
      const styles = getComputedStyle(el);
      const pad = Number.parseFloat(styles.getPropertyValue("--shelf-pad")) || 18;
      const next = Math.max(80, el.clientWidth - pad * 2);
      setInnerWidth((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="shelf-page">
      <header className="page-bar">
        <Link className="ink-button" to="/">
          Back to the doors
        </Link>
        <h1>{title}</h1>
        {canAdd ? (
          <Link className="ink-button" to={`/new/${status}`}>
            Add a book
          </Link>
        ) : (
          <span />
        )}
      </header>
      <div className="shelf-tools">
        <Link className="ink-button shelf-search" to={`/search?shelf=${status}`}>
          Look for books
        </Link>
      </div>
      {libraryError ? <p className="form-error">{libraryError}</p> : null}
      {!ready ? <p className="shelf-note">Opening the shelf...</p> : null}
      {ready && mine.length === 0 ? <p className="shelf-note">This shelf is waiting for a book.</p> : null}
      <div className="shelf-stack" ref={stackRef} data-fonts={fontsReady ? "ready" : "loading"}>
        {rows.map((row, index) => (
          <ShelfRow key={index}>
            {row.map((book) =>
              book.add ? (
                <Link key="add" className="book add-book" to={`/new/${status}`} style={bookStyle(book)}>
                  <span className="spine-face">
                    <span className="spine-title">
                      {book.lines.map((line, index) => (
                        <span className="spine-line" key={`${line}-${index}`}>
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                </Link>
              ) : (
                <BookSpine key={book.id} book={book} />
              ),
            )}
          </ShelfRow>
        ))}
      </div>
    </main>
  );
}

function ShelfRow({ children }) {
  const rowRef = useRef(null);

  function move(event) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const books = rowRef.current?.querySelectorAll(".book");
    if (!books) return;
    const x = event.clientX;
    books.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(x - center);
      const influence = Math.max(0, 1 - dist / 130);
      const side = Math.max(-1, Math.min(1, (x - center) / 36));
      el.style.setProperty("--lift", `${(influence * 16).toFixed(2)}px`);
      el.style.setProperty("--lean", `${(-side * influence * 8).toFixed(2)}deg`);
      el.style.zIndex = influence > 0.55 ? "4" : "1";
    });
  }

  function leave() {
    const books = rowRef.current?.querySelectorAll(".book");
    books?.forEach((el) => {
      el.style.setProperty("--lift", "0px");
      el.style.setProperty("--lean", "0deg");
      el.style.zIndex = "1";
    });
  }

  return (
    <div className="wood-shelf" ref={rowRef} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}

function BookSpine({ book }) {
  return (
    <Link className="book" to={`/book/${book.id}`} style={bookStyle(book, spineColor(book.title))}>
      <span className="spine-face">
        <span className="spine-title">
          {book.lines.map((line, index) => (
            <span className="spine-line" key={`${line}-${index}`}>
              {line}
            </span>
          ))}
        </span>
      </span>
      <span className="hover-label" aria-hidden="true">
        <span className="hover-title">{book.title}</span>
        {book.author ? <span className="hover-author">{book.author}</span> : null}
      </span>
    </Link>
  );
}

function bookStyle(book, color) {
  return {
    "--spine": `${book.spine}px`,
    "--book-height": `${book.height}px`,
    "--book-color": color,
    "--title-ink": titleInk(color),
    "--title-size": `${book.font}px`,
  };
}

function titleInk(color) {
  if (!color) return "#2a2118";
  const hex = color.replace("#", "");
  const value = Number.parseInt(hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 160 ? "#2a2118" : "#fff8ea";
}

let measureCtx;

function textLength(text, fontPx) {
  if (typeof document === "undefined") return text.length * fontPx * 0.62;
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx.font = `700 ${fontPx}px "Cabin Sketch", "Patrick Hand", cursive`;
  const width = measureCtx.measureText(text).width;
  return width > 0 ? width : text.length * fontPx * 0.62;
}

function guessInnerWidth() {
  if (typeof window === "undefined") return 900;
  return Math.max(80, Math.min(980, window.innerWidth - 32) - 36);
}

function packRows(items, innerWidth) {
  const gap = 2;
  const rows = [];
  let row = [];
  let used = 0;

  items.forEach((item) => {
    const width = item.spine;
    const next = row.length === 0 ? width : used + gap + width;
    if (row.length > 0 && next > innerWidth) {
      rows.push(row);
      row = [item];
      used = width;
    } else {
      row.push(item);
      used = next;
    }
  });

  if (row.length > 0) rows.push(row);
  return rows;
}
