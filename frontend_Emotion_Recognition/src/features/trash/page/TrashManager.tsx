// trash/page/TrashManager.tsx
import React, { useState } from "react";
import TrashHeader from "../components/TrashHeader";
import TrashToolbar from "../components/TrashToolbar";
import TrashTable from "../components/TrashTable";
import ConfirmDialog from "../components/ConfirmDialog";
import { restoreTrashItem, deleteTrashItemForever, emptyTrash } from "../service/trashActions";

import { KEYFRAMES } from "../utils/ui";
import { fetchTrashResults } from "../service/fetchTrashResults";
import type { ConfirmState, TrashItem, TrashFilterState } from "../utils/types";

const TrashManager: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TrashFilterState>({ type: "all", order: "recent", q: "" });
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  React.useEffect(() => {
    fetchTrashResults().then((results) => {
      // Chuyển đổi từ EmotionResult sang TrashItem
      const trashItems = results.map((r) => ({
        id: r.id,
        name: r.emotion_type + ' (' + r.confidence + ')',
        removedAt: r.created_at,
        type: r.detection_type,
        origin: r.analysis_id,
      }));
      setItems(trashItems);
    });
  }, []);

  // Lọc dữ liệu theo filter
  const filteredItems = React.useMemo(() => {
    let out = [...items];
    if (filters.q.trim()) {
      const q = filters.q.toLowerCase();
      out = out.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (filters.type !== "all") {
      out = out.filter((i) => i.type === filters.type);
    }
    if (filters.order === "recent") {
      out.sort((a, b) => new Date(b.removedAt || 0).getTime() - new Date(a.removedAt || 0).getTime());
    } else if (filters.order === "oldest") {
      out.sort((a, b) => new Date(a.removedAt || 0).getTime() - new Date(b.removedAt || 0).getTime());
    } else if (filters.order === "size") {
      out.sort((a, b) => (b.size || 0) - (a.size || 0));
    }
    return out;
  }, [items, filters]);

  const closeConfirm = () => setConfirm(null);

  async function handleRestore(ids: string[]) {
    for (const id of ids) await restoreTrashItem(id);
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds([]);
  }

  async function handleDeleteForever(ids: string[]) {
    for (const id of ids) await deleteTrashItemForever(id);
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds([]);
  }

  async function handleEmptyTrash() {
    const ok = await emptyTrash();
    if (ok) {
      setItems([]);
      setSelectedIds([]);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <style>{KEYFRAMES}</style>
      <TrashHeader />
      <TrashToolbar
        selectedIds={selectedIds}
        filters={filters}
        setFilters={setFilters}
        onRestoreSelected={() => setConfirm({ action: "restore", ids: selectedIds })}
        onDeleteSelected={() => setConfirm({ action: "delete", ids: selectedIds })}
        onEmptyTrash={() => setConfirm({ action: "empty" })}
      />
      <div className="mt-4">
        <TrashTable
          items={filteredItems}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>
      <ConfirmDialog
        open={!!confirm && confirm.action === "restore"}
        title={`Khôi phục ${confirm?.ids?.length || 0} mục?`}
        message="Mục sẽ được đưa về vị trí gốc."
        confirmLabel="Khôi phục"
        tone="primary"
        onClose={closeConfirm}
        onConfirm={async () => {
          await handleRestore(confirm!.ids!);
          closeConfirm();
        }}
      />

      <ConfirmDialog
        open={!!confirm && confirm.action === "delete"}
        title={`Xóa vĩnh viễn ${confirm?.ids?.length || 0} mục?`}
        message="Bạn sẽ không thể khôi phục sau khi xóa."
        confirmLabel="Xóa vĩnh viễn"
        tone="danger"
        onClose={closeConfirm}
        onConfirm={async () => {
          await handleDeleteForever(confirm!.ids!);
          closeConfirm();
        }}
      />

      <ConfirmDialog
        open={!!confirm && confirm.action === "empty"}
        title="Dọn sạch thùng rác?"
        message="Mọi mục trong thùng rác sẽ bị xóa vĩnh viễn."
        confirmLabel="Dọn sạch"
        tone="danger"
        onClose={closeConfirm}
        onConfirm={async () => {
          await handleEmptyTrash();
          closeConfirm();
        }}
      />


    </div>
  );
};

export default TrashManager;
