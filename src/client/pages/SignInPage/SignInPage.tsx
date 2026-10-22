"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "../../features/auth/auth-client";
import st from "./SignInPage.module.css";

export function SignInPage() {
  const t = useTranslations("auth");
  const [pending, setPending] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<
    "invalidCredentials" | "unavailable" | "rateLimited" | null
  >(null);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
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
      window.location.replace("/app");
    } catch {
      setError("unavailable");
    } finally {
      setPending(false);
    }
  }

  return (
    <Paper
      component="section"
      className={st.content}
      aria-labelledby="login-title"
    >
      <header className={st.header}>
        <Title order={1} id="login-title" className={st.title}>
          {t("welcomeBack")}
        </Title>
        <Text className={st.description}>{t("signInDescription")}</Text>
      </header>
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset className={st.fields} disabled={pending}>
          <TextInput
            label={t("username")}
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={30}
            error={error === "invalidCredentials"}
            description={error ? t(error) : undefined}
            descriptionProps={{ id: "username-feedback" }}
            classNames={{ description: st.visuallyHidden }}
          />
          <PasswordInput
            label={t("password")}
            id="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={128}
            error={error === "invalidCredentials"}
            description={error ? t(error) : undefined}
            descriptionProps={{ id: "password-feedback" }}
            classNames={{ description: st.visuallyHidden }}
            aria-invalid={error === "invalidCredentials"}
            visible={passwordVisible}
            onVisibilityChange={setPasswordVisible}
            visibilityToggleButtonProps={{
              "aria-label": t(
                passwordVisible ? "hidePassword" : "showPassword",
              ),
            }}
          />
          <Button
            className={st.submit}
            type="submit"
            fullWidth
            loading={pending}
            rightSection={<ArrowRight size={18} aria-hidden="true" />}
          >
            {pending ? t("signingIn") : t("signIn")}
          </Button>
        </fieldset>
        {error && (
          <Alert
            id="login-error"
            className={st.error}
            color="red"
            icon={<AlertCircle size={18} aria-hidden="true" />}
            role="alert"
          >
            {t(error)}
          </Alert>
        )}
      </form>
      <Text className={st.note}>{t("offlineHint")}</Text>
    </Paper>
  );
}
