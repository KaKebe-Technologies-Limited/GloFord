"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ConfirmActionOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  /** If set, user must type this exact string to enable confirm */
  requireTypedConfirmation?: string;
};

type ConfirmActionState = ConfirmActionOptions & {
  resolve: (confirmed: boolean) => void;
};

const ConfirmActionContext = React.createContext<{
  confirm: (opts: ConfirmActionOptions) => Promise<boolean>;
} | null>(null);

export function useConfirmAction() {
  const ctx = React.useContext(ConfirmActionContext);
  if (!ctx) throw new Error("useConfirmAction must be inside <ConfirmActionProvider>");
  return ctx.confirm;
}

export function ConfirmActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmActionState | null>(null);
  const [typed, setTyped] = React.useState("");

  const confirm = React.useCallback((opts: ConfirmActionOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
      setTyped("");
    });
  }, []);

  const handleClose = (confirmed: boolean) => {
    state?.resolve(confirmed);
    setState(null);
    setTyped("");
  };

  const confirmDisabled = state?.requireTypedConfirmation
    ? typed !== state.requireTypedConfirmation
    : false;

  return (
    <ConfirmActionContext.Provider value={{ confirm }}>
      {children}
      <AlertDialogPrimitive.Root open={!!state} onOpenChange={(open) => { if (!open) handleClose(false); }}>
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <AlertDialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-[var(--radius-lg)]"
          >
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <AlertDialogPrimitive.Title className="text-lg font-semibold">
                {state?.title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-sm text-[var(--color-muted-fg)]">
                {state?.description}
              </AlertDialogPrimitive.Description>
            </div>

            {state?.requireTypedConfirmation && (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-muted-fg)]">
                  Type <span className="font-mono font-semibold text-[var(--color-fg)]">{state.requireTypedConfirmation}</span> to confirm:
                </p>
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={state.requireTypedConfirmation}
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <AlertDialogPrimitive.Cancel
                className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0")}
                onClick={() => handleClose(false)}
              >
                {state?.cancelLabel ?? "Cancel"}
              </AlertDialogPrimitive.Cancel>
              <button
                className={cn(buttonVariants({ variant: state?.variant === "primary" ? "primary" : "danger" }))}
                disabled={confirmDisabled}
                onClick={() => handleClose(true)}
              >
                {state?.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    </ConfirmActionContext.Provider>
  );
}
