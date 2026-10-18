import { Button, ButtonLink } from "../Button/Button";
import type { EntityFormProps } from "./EntityForm.interfaces";
import st from "./EntityForm.module.css";

export function EntityForm({
  pending,
  failed,
  failedLabel,
  submitLabel,
  cancelLabel,
  cancelHref,
  onSubmit,
  children,
}: EntityFormProps) {
  return (
    <form
      className={st.form}
      noValidate
      onSubmit={onSubmit}
      aria-busy={pending}
    >
      {children}
      {failed && (
        <p className={st.error} role="alert">
          {failedLabel}
        </p>
      )}
      <div className={st.actions}>
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        <ButtonLink variant="secondary" href={cancelHref}>
          {cancelLabel}
        </ButtonLink>
      </div>
    </form>
  );
}
