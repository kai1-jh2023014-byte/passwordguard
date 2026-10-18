"use client";

import { FormEvent, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_GENERATOR,
  generatePassword,
} from "@/lib/password-generator";
import { PasswordEntry } from "@/lib/types";

type Props = {
  open: boolean;
  entry: PasswordEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: PasswordEntry) => Promise<void>;
};

function EntryDialogForm({
  entry,
  onOpenChange,
  onSave,
}: {
  entry: PasswordEntry;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: PasswordEntry) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => ({ ...entry }));
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      await onSave(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {entry.title ? "ログイン情報を編集" : "ログイン情報を追加"}
        </DialogTitle>
        <DialogDescription>
          サイト名とパスワードを入力してください。
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="例: GitHub"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">URL（任意）</Label>
          <Input
            id="url"
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            placeholder="github.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">ユーザー名 / メール</Label>
          <Input
            id="username"
            value={draft.username}
            onChange={(e) =>
              setDraft({ ...draft, username: e.target.value })
            }
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <div className="flex gap-2">
            <Input
              id="password"
              className="font-mono"
              value={draft.password}
              onChange={(e) =>
                setDraft({ ...draft, password: e.target.value })
              }
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="パスワードを生成"
              onClick={() =>
                setDraft({
                  ...draft,
                  password: generatePassword(DEFAULT_GENERATOR),
                })
              }
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">メモ（任意）</Label>
          <Input
            id="notes"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={busy || !draft.title.trim()}>
            {busy ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EntryDialog({ open, entry, onOpenChange, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {entry ? (
          <EntryDialogForm
            key={entry.id}
            entry={entry}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
