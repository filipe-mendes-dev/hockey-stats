"use client";

import { useTranslations } from "next-intl";
import { DialogFrame } from "../../../components/DialogFrame/DialogFrame";
import type { RecorderDialogProps } from "./RecorderDialog.interfaces";

export function RecorderDialog(props: RecorderDialogProps) {
  const t = useTranslations("recorder");
  return <DialogFrame {...props} opened closeLabel={t("cancel")} />;
}
