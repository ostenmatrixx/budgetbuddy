import { type FormEvent, useState } from "react";

interface LoginScreenProps {
  onLogin: (password: string) => string | undefined;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = onLogin(password);

    if (nextError) {
      setError(nextError);
      return;
    }

    setError("");
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black-bean">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <form
          className="w-full rounded-lg border border-ecru bg-white p-6 shadow-[0_20px_60px_rgba(166,66,66,0.12)]"
          onSubmit={handleSubmit}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-maroon">
            Personal Budget
          </p>
          <h1 className="mt-3 text-3xl font-bold">Budget Tracker</h1>
          <p className="mt-2 text-sm leading-6 text-black-bean/70">
            Sign in to review your monthly income, spending, and savings.
          </p>

          <label className="mt-8 block text-sm font-semibold" htmlFor="admin-password">
            Admin password
          </label>
          <input className="sr-only" type="text" value="admin" autoComplete="username" readOnly />
          <input
            id="admin-password"
            className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-4 py-3 text-base outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error ? (
            <p className="mt-3 rounded-lg bg-light-red/25 px-3 py-2 text-sm font-medium text-maroon">
              {error}
            </p>
          ) : null}

          <button
            className="mt-6 w-full rounded-lg bg-maroon px-4 py-3 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30"
            type="submit"
          >
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
