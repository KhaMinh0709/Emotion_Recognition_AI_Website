// trash/components/ConfirmDialog.tsx
import React from "react";
import { cn, tokens } from "../utils/ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onClose: () => void;
  onConfirm?: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  tone = "danger",
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(tokens.card, "w-[min(640px,92vw)] p-6 relative z-10")}>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-300 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button className={tokens.btn.ghost} onClick={onClose}>
            Hủy
          </button>
          <button
            className={
              tone === "danger" ? tokens.btn.danger : tokens.btn.primary
            }
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
