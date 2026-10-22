"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import type { Player } from "../../../domain/players/player.schema";
import { createPlayerInputSchema } from "../../../domain/players/validation/createPlayer.schema";
import { useCreatePlayer } from "./mutations/players.mutations";

export function usePlayerCreation(onCreated: (player: Player) => void) {
  const creation = useCreatePlayer();
  const [name, setName] = useState("");
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function changeName(value: string): void {
    setName(value);
    if (creation.isError) creation.reset();
    if (invalid && value.trim()) setInvalid(false);
  }

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || creation.isPending) return;
    const input = createPlayerInputSchema.safeParse({ name });
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void creation
      .mutateAsync(input.data)
      .then(onCreated)
      .catch(() => {
        submitted.current = false;
      });
  }

  return { creation, name, invalid, nameInput, changeName, submit };
}
