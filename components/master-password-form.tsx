"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  mode: "setup" | "unlock";
  onSubmit: (password: string) => Promise<void>;
  onReset?: () => void;
};

export function MasterPasswordForm({ mode, onSubmit, onReset }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldsLocked, setFieldsLocked] = useState(true);

  const isSetup = mode === "setup";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("マスターパスワードは8文字以上にしてください");
      return;
    }

    if (isSetup && password !== confirm) {
      setError("確認用パスワードが一致しません");
      return;
    }

    setBusy(true);
    try {
      await onSubmit(password);
      setPassword("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSetup ? "金庫を作成" : "ロック解除"}</CardTitle>
        <CardDescription>
          {isSetup
            ? "忘れないマスターパスワードを設定してください。復元用の手段はありません。"
            : "マスターパスワードを入力して金庫を開きます。"}
        </CardDescription>
      </CardHeader>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vault-master-password">マスターパスワード</Label>
            <Input
              id="vault-master-password"
              name="vault-master-password"
              type="password"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              readOnly={fieldsLocked}
              onFocus={() => setFieldsLocked(false)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              required
            />
          </div>
          {isSetup && (
            <div className="space-y-2">
              <Label htmlFor="vault-master-confirm">確認</Label>
              <Input
                id="vault-master-confirm"
                name="vault-master-confirm"
                type="password"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                readOnly={fieldsLocked}
                onFocus={() => setFieldsLocked(false)}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="もう一度入力"
                required
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {onReset ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  window.confirm(
                    "保存されている金庫を完全に削除します。よろしいですか？",
                  )
                ) {
                  onReset();
                }
              }}
            >
              金庫データを削除
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "処理中…" : isSetup ? "作成して開始" : "解除"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
