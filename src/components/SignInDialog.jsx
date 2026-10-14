import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";

export default function SignInDialog({ onClose }) {
  const { configured, isOwner, session, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      onClose();
    } catch (err) {
      setError(err.message || "That sign in didn't work.");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setError("");
    setBusy(true);
    try {
      await signOut();
      onClose();
    } catch (err) {
      setError(err.message || "Sign out didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sign-in-backdrop" onClick={onClose}>
      <div
        className="sign-in-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="sign-in-title">Owner sign in</h2>
        {configured && isOwner ? (
          <>
            <p className="shelf-note">Signed in as {session?.user?.email}.</p>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="action-row">
              <button type="button" className="ink-button primary" onClick={leave} disabled={busy}>
                Sign out
              </button>
              <button type="button" className="ink-button" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : null}
        {configured && !isOwner ? (
          <form onSubmit={submit}>
            <p className="shelf-note">Sign in to your Digital Library!</p>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="action-row">
              <button type="submit" className="ink-button primary" disabled={busy}>
                Sign in
              </button>
              <button type="button" className="ink-button" onClick={onClose}>
                Close
              </button>
            </div>
          </form>
        ) : null}
        {!configured ? (
          <>
            <p className="shelf-note">
              This browser still keeps the library locally. Add the Supabase URL and anon key, then the welcome banner
              signs you in as the owner.
            </p>
            <button type="button" className="ink-button" onClick={onClose}>
              Close
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
