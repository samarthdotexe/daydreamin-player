import { BookHeart, LogOut, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

import { firebaseAuthService, type AuthService, type AuthUser } from "../../services/firebase/auth";
import styles from "./AuthMenu.module.css";

interface AuthMenuProps {
  service?: AuthService;
  onUserChange?: (user: AuthUser | null) => void;
  onOpenLibrary?: () => void;
}

export function AuthMenu({ service = firebaseAuthService, onUserChange, onOpenLibrary }: AuthMenuProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => service.subscribe((nextUser) => {
    setUser(nextUser);
    onUserChange?.(nextUser);
  }), [onUserChange, service]);

  async function signIn() {
    setError("");
    try {
      await service.signIn();
      setOpen(false);
    } catch {
      setError("We could not sign you in. Please try again.");
    }
  }

  if (user) {
    return (
      <div className={styles.authenticated}>
        <button type="button" onClick={onOpenLibrary} aria-label={`Open ${user.displayName}'s library`}>
          {user.photoUrl ? <img src={user.photoUrl} alt="" /> : <UserRound size={16} />}
          <span>{user.displayName}</span><BookHeart size={15} />
        </button>
        <button type="button" onClick={() => void service.signOut()} aria-label="Sign out"><LogOut size={16} /></button>
      </div>
    );
  }

  return (
    <div className={styles.auth}>
      <button className={styles.trigger} type="button" onClick={() => setOpen(true)}>Sign in</button>
      {open && (
        <section className={styles.popover} aria-label="Sign in options">
          <button className={styles.dismiss} type="button" onClick={() => setOpen(false)} aria-label="Close sign in"><X size={17} /></button>
          <UserRound size={24} />
          <h2>Save your daydreams</h2>
          <p>Sign in to keep favorite tracks across devices. Listening always works without an account.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.google} type="button" onClick={() => void signIn()}>Continue with Google</button>
          <button className={styles.continue} type="button" onClick={() => setOpen(false)}>Continue without signing in</button>
        </section>
      )}
    </div>
  );
}
