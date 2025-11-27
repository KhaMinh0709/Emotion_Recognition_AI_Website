// trash/components/TrashToolbar.tsx
import React from "react";
import { tokens } from "../utils/ui";
import type { TrashFilterState } from "../utils/types";

type Props = {
  selectedIds: string[];
  filters: TrashFilterState;
  setFilters: React.Dispatch<React.SetStateAction<TrashFilterState>>;
  onRestoreSelected: () => void;
  onDeleteSelected: () => void;
  onEmptyTrash: () => void;
};

const TrashToolbar: React.FC<Props> = ({
  selectedIds,
  filters,
  setFilters,
  onRestoreSelected,
  onDeleteSelected,
  onEmptyTrash,
}) => {
  const anySelected = selectedIds.length > 0;

  return (
    <div
      className={`${tokens.card} p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}
    >
      <div className="flex items-center gap-2">
        <button
          className={tokens.btn.primary}
          disabled={!anySelected}
          onClick={onRestoreSelected}
        >
          Khôi phục
        </button>
        <button
          className={tokens.btn.danger}
          disabled={!anySelected}
          onClick={onDeleteSelected}
        >
          Xóa vĩnh viễn
        </button>
        <div className="h-6 w-px bg-white/10 mx-2" />
        <button className={tokens.btn.subtle} onClick={onEmptyTrash}>
          Dọn sạch thùng rác
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200"
          value={filters.type}
          onChange={(e) =>
            setFilters((f) => ({ ...f, type: e.target.value as TrashFilterState["type"] }))
          }
        >
          <option value="all">Loại: Tất cả</option>
          <option value="folder">Thư mục</option>
          <option value="notebook">Notebook</option>
          <option value="zip">Tập tin nén</option>
          <option value="file">Tập tin khác</option>
        </select>

        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200"
          value={filters.order}
          onChange={(e) =>
            setFilters((f) => ({ ...f, order: e.target.value as TrashFilterState["order"] }))
          }
        >
          <option value="recent">Lần sửa đổi gần đây nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="size">Kích thước</option>
        </select>

        <input
          placeholder="Tìm trong thùng rác…"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 w-[220px]"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
      </div>
    </div>
  );
};

export default TrashToolbar;
