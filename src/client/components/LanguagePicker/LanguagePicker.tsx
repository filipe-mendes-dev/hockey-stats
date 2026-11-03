"use client";

import { useState } from "react";
import { Image, Menu, UnstyledButton } from "@mantine/core";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { LanguagePickerProps } from "./LanguagePicker.interfaces";
import st from "./LanguagePicker.module.css";

const languages = [
  { locale: "en", label: "englishNative", image: "/flags/gb.svg" },
  { locale: "pt-PT", label: "portugueseNative", image: "/flags/pt.svg" },
] as const;

export function LanguagePicker({ compact = false }: LanguagePickerProps) {
  const t = useTranslations("language");
  const { locale, select } = useLanguage();
  const [opened, setOpened] = useState(false);
  const selected =
    languages.find((language) => language.locale === locale) ?? languages[0];

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      width={160}
      position="bottom-end"
      classNames={{ dropdown: st.dropdown, item: st.item }}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          type="button"
          className={st.control}
          data-expanded={opened || undefined}
          data-compact={compact || undefined}
          aria-label={t("pickerLabel", { language: t(selected.label) })}
          title={t("pickerLabel", { language: t(selected.label) })}
        >
          <Image
            src={selected.image}
            w={compact ? 14 : 20}
            h={compact ? 10.5 : 15}
            alt=""
            className={st.flag}
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {languages.map((language) => (
          <Menu.Item
            key={language.locale}
            onClick={() => select(language.locale)}
            aria-current={locale === language.locale ? "true" : undefined}
            leftSection={
              <Image
                src={language.image}
                w={16}
                h={12}
                alt=""
                className={st.flag}
              />
            }
            rightSection={
              locale === language.locale ? (
                <Check size={12} aria-hidden="true" />
              ) : undefined
            }
          >
            {t(language.label)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
