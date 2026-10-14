function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
    </svg>
  );
}

export default function Hearts({ value = 0, onChange }) {
  const hearts = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <div className="hearts">
        {hearts.map((n) => (
          <span key={n} className={n <= value ? "heart on" : "heart"}>
            <HeartIcon />
          </span>
        ))}
        <span className="rating-label">{value} of 5 hearts</span>
      </div>
    );
  }

  return (
    <div className="hearts" role="group" aria-label="Rating out of 5 hearts">
      {hearts.map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? "heart on" : "heart"}
          aria-pressed={n <= value}
          aria-label={`${n} ${n === 1 ? "heart" : "hearts"}`}
          onClick={() => onChange(n)}
        >
          <HeartIcon />
        </button>
      ))}
    </div>
  );
}
