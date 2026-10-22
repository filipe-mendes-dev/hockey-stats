"use client";

import { useState } from "react";
import { Group, Image, Menu, UnstyledButton } from "@mantine/core";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../i18n/LanguageProvider";
import st from "./LanguagePicker.module.css";

const languages = [
  { locale: "en", label: "englishNative", image: "/flags/gb.svg" },
  { locale: "pt-PT", label: "portugueseNative", image: "/flags/pt.svg" },
] as const;

export function LanguagePicker() {
  const t = useTranslations("language");
  const { locale, select } = useLanguage();
  const [opened, setOpened] = useState(false);
  const selected =
    languages.find((language) => language.locale === locale) ?? languages[0];

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      width={136}
      position="bottom-end"
      classNames={{ dropdown: st.dropdown, item: st.item }}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          className={st.control}
          data-expanded={opened || undefined}
          aria-label={t("pickerLabel", { language: t(selected.label) })}
        >
          <Group gap={6} wrap="nowrap" className={st.selection}>
            <Image
              src={selected.image}
              w={16}
              h={12}
              alt=""
              className={st.flag}
            />
            <span className={st.label}>{t(selected.label)}</span>
          </Group>
          <ChevronDown size={12} className={st.chevron} aria-hidden="true" />
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
