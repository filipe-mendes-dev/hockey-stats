"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import {
  Alert,
  ActionIcon,
  Button,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { AlertCircle, ArrowRight, Info, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "../../components/BrandLogo/BrandLogo";
import {
  applicationContact,
  applicationVersion,
} from "../../components/AppFooter/appMetadata";
import { LanguagePicker } from "../../components/LanguagePicker/LanguagePicker";
import { authClient } from "../../features/auth/auth-client";
import st from "./SignInPage.module.css";

export function SignInPage() {
  const t = useTranslations("auth");
  const footerT = useTranslations("footer");
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
    <section className={st.content} aria-labelledby="login-title">
      <div className={st.panel}>
        <header className={st.controls}>
          <Link className={st.brand} href="/sign-in" prefetch={false}>
            <BrandLogo priority />
          </Link>
          <LanguagePicker />
        </header>
        <div className={st.formContent}>
          <header className={st.header}>
            <div className={st.heading}>
              <Title order={1} id="login-title" className={st.title}>
                {t("welcome")}
              </Title>
              <Tooltip
                label={t("offlineHint")}
                position="bottom-end"
                events={{ hover: true, focus: true, touch: true }}
                multiline
              >
                <ActionIcon
                  type="button"
                  variant="subtle"
                  aria-label={t("connectionHelp")}
                >
                  <Info size={17} strokeWidth={1.7} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </div>
            <Text className={st.description}>{t("signInDescription")}</Text>
          </header>
          <form onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset className={st.fields} disabled={pending}>
              <TextInput
                label={t("username")}
                placeholder={t("usernamePlaceholder")}
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
                placeholder={t("passwordPlaceholder")}
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
        </div>
        <footer className={st.metadata}>
          <span>
            {footerT("beta")} ·{" "}
            {footerT("version", { version: applicationVersion })}
          </span>
          <a href={`mailto:${applicationContact}`} title={applicationContact}>
            <Mail size={14} aria-hidden="true" />
            {footerT("contact")}
          </a>
        </footer>
      </div>
      <div className={st.artwork}>
        <div className={st.artBrand}>
          <BrandLogo prominent />
        </div>
        <div className={st.artCopy}>
          <Text className={st.artEyebrow}>{t("brandEyebrow")}</Text>
          <Title order={2} className={st.artHeadline}>
            {t("brandHeadline")}
          </Title>
          <Text className={st.artDescription}>{t("brandDescription")}</Text>
        </div>
      </div>
    </section>
  );
}
