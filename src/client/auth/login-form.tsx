"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "./client";
import st from "./styles.module.css";

export function LoginForm() {
  const t = useTranslations("auth");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    "invalidCredentials" | "unavailable" | "rateLimited" | null
  >(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const username = data.get("username");
    const password = data.get("password");
    if (typeof username !== "string" || typeof password !== "string") return;

    setPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.username({
        username: username.trim(),
        password,
      });
      if (result.error) {
        const status = result.error.status;
        setError(
          status === 429
            ? "rateLimited"
            : [400, 401, 403, 422].includes(status)
              ? "invalidCredentials"
              : "unavailable",
        );
        return;
      }
      window.location.replace("/");
    } catch {
      setError("unavailable");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={st.content} aria-labelledby="login-title">
      <h1 id="login-title">{t("signIn")}</h1>
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset className={st.fields} disabled={pending}>
          <div className={st.field}>
            <label htmlFor="username">{t("username")}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={30}
              aria-describedby={error ? "login-error" : undefined}
              aria-invalid={error === "invalidCredentials"}
            />
          </div>
          <div className={st.field}>
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              aria-describedby={error ? "login-error" : undefined}
              aria-invalid={error === "invalidCredentials"}
            />
          </div>
          <button className={st.submit} type="submit">
            {pending ? t("signingIn") : t("signIn")}
          </button>
        </fieldset>
        {error && (
          <p id="login-error" className={st.error} role="alert">
            {t(error)}
          </p>
        )}
      </form>
    </section>
  );
}
