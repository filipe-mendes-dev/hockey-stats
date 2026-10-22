"use client";

import { Badge, Table, Text, useMantineTheme } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { UserActionsMenu } from "../UserActionsMenu/UserActionsMenu";
import type { UsersListProps } from "./UsersList.interfaces";
import st from "./UsersList.module.css";

export function UsersList({ users, busy, onSelect }: UsersListProps) {
  const t = useTranslations("adminUsers");
  const theme = useMantineTheme();
  const { locale } = useLanguage();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <>
      <div className={st.desktop}>
        <Table
          aria-label={t("title")}
          aria-busy={busy}
          className={st.table}
          verticalSpacing="md"
          horizontalSpacing="sm"
          highlightOnHover
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("account")}</Table.Th>
              <Table.Th className={st.role}>{t("role")}</Table.Th>
              <Table.Th className={st.access}>{t("access")}</Table.Th>
              <Table.Th className={st.created}>{t("created")}</Table.Th>
              <Table.Th className={st.actions}>
                <span className={st.visuallyHidden}>{t("actionsLabel")}</span>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>
                  <Text fw={500} truncate title={user.name}>
                    {user.name}
                  </Text>
                  <Text
                    size="sm"
                    c="dimmed"
                    truncate
                    title={user.username ?? undefined}
                  >
                    {user.username}
                  </Text>
                </Table.Td>
                <Table.Td>{t(user.role)}</Table.Td>
                <Table.Td>
                  <Badge
                    color={user.disabled ? "gray" : theme.primaryColor}
                    variant="light"
                    className={st.badge}
                  >
                    {t(user.disabled ? "disabled" : "enabled")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <time dateTime={user.createdAt}>
                    {date.format(new Date(user.createdAt))}
                  </time>
                </Table.Td>
                <Table.Td className={st.actions}>
                  <UserActionsMenu user={user} onSelect={onSelect} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      <ul className={st.mobile} aria-label={t("title")} aria-busy={busy}>
        {users.map((user) => (
          <li key={user.id} className={st.row}>
            <div className={st.identity}>
              <Text fw={500} className={st.name}>
                {user.name}
              </Text>
              <Text size="sm" c="dimmed" className={st.username}>
                {user.username}
              </Text>
            </div>
            <div className={st.rowActions}>
              <UserActionsMenu user={user} onSelect={onSelect} />
            </div>
            <div className={st.status}>
              <Text size="xs" c="dimmed">
                {t(user.role)}
              </Text>
              <Badge
                color={user.disabled ? "gray" : theme.primaryColor}
                variant="light"
                className={st.badge}
              >
                {t(user.disabled ? "disabled" : "enabled")}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
