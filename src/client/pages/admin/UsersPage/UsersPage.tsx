"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Loader, Pagination, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersPageSize } from "../../../../contracts/admin-users.schema";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { SearchToolbar } from "../../../components/SearchToolbar/SearchToolbar";
import { HelpPopover } from "../../../components/HelpPopover/HelpPopover";
import { UsersList } from "../../../features/admin/UsersList/UsersList";
import { authClient } from "../../../features/auth/auth-client";
import { UserDialog } from "../../../features/admin/UserDialog/UserDialog";
import type { UserDialogSelection } from "../../../features/admin/UserDialog/UserDialog.interfaces";
import {
  usersDirectoryKey,
  useUsersDirectory,
} from "../../../features/admin/queries/users.queries";
import { AdminUsersRequestError } from "../../../features/admin/users.api";
import st from "./UsersPage.module.css";

export function UsersPage() {
  const t = useTranslations("adminUsers");
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const administratorId =
    session?.user.role === "admin" && !session.user.banned
      ? session.user.id
      : undefined;
  const [filters, setFilters] = useState({ search: "", page: 1 });
  const [debouncedFilters] = useDebouncedValue(filters, 250);
  const [selection, setSelection] = useState<UserDialogSelection | null>(null);
  const [saved, setSaved] = useState(false);
  const client = useQueryClient();
  const directory = useUsersDirectory(administratorId, debouncedFilters);
  const busy = directory.isFetching || filters !== debouncedFilters;
  const data = directory.data;

  function showDialog(value: UserDialogSelection): void {
    setSaved(false);
    setSelection(value);
  }

  function finishSave(): void {
    setSelection(null);
    setSaved(true);
    void client.invalidateQueries({ queryKey: usersDirectoryKey });
  }

  return (
    <section className={st.page}>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <HelpPopover label={t("managementHelp")}>
            {t("onlineOnly")}
          </HelpPopover>
        }
        back={{ href: "/app", label: t("backToMenu") }}
      />
      <SearchToolbar
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        clearLabel={t("clearSearch")}
        value={filters.search}
        onChange={(search) => setFilters({ search, page: 1 })}
        actionHref="/app/admin/users/new"
        actionLabel={t("actions.create")}
        compactActionLabel={t("new")}
      />
      {saved && (
        <Alert color="green" role="status" className={st.feedback}>
          {t("saved")}
        </Alert>
      )}
      {sessionPending || (administratorId && directory.isPending) ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("loading")}</Text>
        </div>
      ) : !administratorId ? (
        <Alert color="red" className={st.feedback} role="alert">
          {t("errors.authentication_required")}
          <Button component={Link} href="/sign-in" variant="subtle" size="sm">
            {t("signIn")}
          </Button>
        </Alert>
      ) : directory.isError ? (
        <Alert color="red" className={st.feedback} role="alert">
          {t(
            `errors.${directory.error instanceof AdminUsersRequestError ? directory.error.code : "unavailable"}`,
          )}
          <Button
            variant="subtle"
            size="sm"
            onClick={() => void directory.refetch()}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : data ? (
        <>
          <Text size="sm" c="dimmed" role="status" className={st.count}>
            {busy ? t("loading") : t("results", { count: data.total })}
          </Text>
          {data.users.length === 0 ? (
            <Text className={st.empty}>{t("empty")}</Text>
          ) : (
            <UsersList users={data.users} busy={busy} onSelect={showDialog} />
          )}
          <Pagination
            className={st.pagination}
            total={Math.max(1, Math.ceil(data.total / usersPageSize))}
            value={data.page}
            onChange={(page) => setFilters({ ...filters, page })}
            hideWithOnePage
            layout="responsive"
            formatLabel={({ page, totalPages }) =>
              t("pageOf", { page: String(page), total: String(totalPages) })
            }
            getControlProps={(control) => ({
              "aria-label": t(`pagination.${control}`),
            })}
            getItemProps={(page) => ({
              "aria-label": t("pageNumber", { page: String(page) }),
            })}
            disabled={busy}
          />
        </>
      ) : null}
      {selection && administratorId && (
        <UserDialog
          selection={selection}
          administratorId={administratorId}
          onClose={() => setSelection(null)}
          onSaved={finishSave}
        />
      )}
    </section>
  );
}
