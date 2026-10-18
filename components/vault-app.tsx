"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";

import { EntryDialog } from "@/components/entry-dialog";
import { MasterPasswordForm } from "@/components/master-password-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_GENERATOR,
  generatePassword,
} from "@/lib/password-generator";
import { PasswordEntry, VaultPayload } from "@/lib/types";
import {
  clearVault,
  createVault,
  hasVault,
  saveVault,
  subscribeVault,
  unlockVault,
} from "@/lib/vault-storage";

function newEntry(partial?: Partial<PasswordEntry>): PasswordEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const subscribeNoop = () => () => {};

export function VaultApp() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const vaultExists = useSyncExternalStore(
    subscribeVault,
    () => hasVault(),
    () => false,
  );
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [payload, setPayload] = useState<VaultPayload | null>(null);
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordEntry | null>(null);

  const persist = useCallback(
    async (next: VaultPayload) => {
      if (!masterPassword) return;
      await saveVault(next, masterPassword);
      setPayload(next);
    },
    [masterPassword],
  );

  const handleSetup = async (password: string) => {
    const created = await createVault(password);
    setMasterPassword(password);
    setPayload(created);
    toast.success("金庫を作成しました");
  };

  const handleUnlock = async (password: string) => {
    const unlocked = await unlockVault(password);
    if (!unlocked) {
      toast.error("マスターパスワードが正しくありません");
      return;
    }
    setMasterPassword(password);
    setPayload(unlocked);
    toast.success("ロックを解除しました");
  };

  const handleLock = () => {
    setMasterPassword(null);
    setPayload(null);
    setRevealed({});
    setQuery("");
    toast.message("ロックしました");
  };

  const handleReset = () => {
    clearVault();
    setMasterPassword(null);
    setPayload(null);
    setRevealed({});
    setQuery("");
    toast.success("ローカルの金庫データを削除しました");
  };

  const filtered = useMemo(() => {
    if (!payload) return [];
    const q = query.trim().toLowerCase();
    if (!q) return payload.entries;
    return payload.entries.filter((e) =>
      [e.title, e.username, e.url, e.notes].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [payload, query]);

  const copyText = async (label: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label}をコピーしました`);
  };

  const openCreate = () => {
    setEditing(
      newEntry({ password: generatePassword(DEFAULT_GENERATOR) }),
    );
    setDialogOpen(true);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditing({ ...entry });
    setDialogOpen(true);
  };

  const saveEntry = async (entry: PasswordEntry) => {
    if (!payload) return;
    const exists = payload.entries.some((e) => e.id === entry.id);
    const entries = exists
      ? payload.entries.map((e) =>
          e.id === entry.id
            ? { ...entry, updatedAt: new Date().toISOString() }
            : e,
        )
      : [...payload.entries, entry];
    await persist({ ...payload, entries });
    setDialogOpen(false);
    setEditing(null);
    toast.success(exists ? "保存しました" : "追加しました");
  };

  const deleteEntry = async (id: string) => {
    if (!payload) return;
    if (!window.confirm("この項目を削除しますか？")) return;
    const entries = payload.entries.filter((e) => e.id !== id);
    await persist({ ...payload, entries });
    toast.success("削除しました");
  };

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  if (!masterPassword || !payload) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="size-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ローカルパスワード管理
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            データはこのブラウザ内だけに暗号化して保存されます。サーバーには送信されません。
          </p>
        </div>
        <MasterPasswordForm
          mode={vaultExists ? "unlock" : "setup"}
          onSubmit={vaultExists ? handleUnlock : handleSetup}
          onReset={vaultExists ? handleReset : undefined}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <KeyRound className="size-6 text-primary" aria-hidden />
            パスワード一覧
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {payload.entries.length} 件 · ローカル暗号化
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleLock}>
            <Lock className="size-4" aria-hidden />
            ロック
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <LogOut className="size-4" aria-hidden />
            金庫を削除
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            新規追加
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="タイトル、ユーザー名、URL で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {payload.entries.length === 0
                ? "まだパスワードがありません"
                : "一致する項目がありません"}
            </CardTitle>
            <CardDescription>
              {payload.entries.length === 0
                ? "「新規追加」から最初のログイン情報を登録してください。"
                : "検索条件を変えてみてください。"}
            </CardDescription>
          </CardHeader>
          {payload.entries.length === 0 && (
            <CardContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                最初の項目を追加
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((entry) => {
            const showPassword = revealed[entry.id];
            return (
              <li key={entry.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg">
                          {entry.title || "（無題）"}
                        </CardTitle>
                        {entry.url ? (
                          <a
                            href={
                              entry.url.startsWith("http")
                                ? entry.url
                                : `https://${entry.url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-sm text-primary hover:underline"
                          >
                            {entry.url}
                          </a>
                        ) : (
                          <CardDescription className="mt-1">
                            URL 未設定
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="編集"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="削除"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">ユーザー名</Badge>
                      <span className="truncate font-mono">
                        {entry.username || "—"}
                      </span>
                      {entry.username && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="ユーザー名をコピー"
                          onClick={() => copyText("ユーザー名", entry.username)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      )}
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">パスワード</Badge>
                      <span className="truncate font-mono">
                        {showPassword ? entry.password : "••••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={showPassword ? "隠す" : "表示"}
                        onClick={() =>
                          setRevealed((r) => ({
                            ...r,
                            [entry.id]: !r[entry.id],
                          }))
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      {entry.password && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="パスワードをコピー"
                          onClick={() => copyText("パスワード", entry.password)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      )}
                    </div>
                    {entry.notes ? (
                      <>
                        <Separator />
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {entry.notes}
                        </p>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <EntryDialog
        open={dialogOpen}
        entry={editing}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={saveEntry}
      />
    </div>
  );
}
