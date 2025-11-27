// trash/page/TrashManager.tsx
import React, { useState } from "react";
import TrashHeader from "../components/TrashHeader";
import TrashToolbar from "../components/TrashToolbar";
import TrashTable from "../components/TrashTable";
import ConfirmDialog from "../components/ConfirmDialog";

import { KEYFRAMES } from "../utils/ui";
import { useTrashState } from "../hooks/useTrashState";
import { MOCK_TRASH_ITEMS } from "../service/trashService";
import type { ConfirmState } from "../utils/types";

const TrashManager: React.FC = () => {
  const {
    filteredItems,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    restoreItems,
    deleteItems,
    emptyTrash,
  } = useTrashState(MOCK_TRASH_ITEMS);

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const closeConfirm = () => setConfirm(null);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* keyframes cho animation header */}
      <style>{KEYFRAMES}</style>

      <TrashHeader />

      <TrashToolbar
        selectedIds={selectedIds}
        filters={filters}
        setFilters={setFilters}
        onRestoreSelected={() =>
          setConfirm({ action: "restore", ids: selectedIds })
        }
        onDeleteSelected={() =>
          setConfirm({ action: "delete", ids: selectedIds })
        }
        onEmptyTrash={() => setConfirm({ action: "empty" })}
      />

      <div className="mt-4">
        <TrashTable
          items={filteredItems}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>

      {/* Confirm – Restore */}
      <ConfirmDialog
        open={!!confirm && confirm.action === "restore"}
        title={`Khôi phục ${confirm?.ids?.length || 0} mục?`}
        message="Mục sẽ được đưa về vị trí gốc."
        confirmLabel="Khôi phục"
        tone="primary"
        onClose={closeConfirm}
        onConfirm={() => {
          if (confirm?.ids) restoreItems(confirm.ids);
        }}
      />

      {/* Confirm – Delete forever */}
      <ConfirmDialog
        open={!!confirm && confirm.action === "delete"}
        title={`Xóa vĩnh viễn ${confirm?.ids?.length || 0} mục?`}
        message="Bạn sẽ không thể khôi phục sau khi xóa."
        confirmLabel="Xóa vĩnh viễn"
        tone="danger"
        onClose={closeConfirm}
        onConfirm={() => {
          if (confirm?.ids) deleteItems(confirm.ids);
        }}
      />

      {/* Confirm – Empty trash */}
      <ConfirmDialog
        open={!!confirm && confirm.action === "empty"}
        title="Dọn sạch thùng rác?"
        message="Mọi mục trong thùng rác sẽ bị xóa vĩnh viễn."
        confirmLabel="Dọn sạch"
        tone="danger"
        onClose={closeConfirm}
        onConfirm={emptyTrash}
      />
    </div>
  );
};

export default TrashManager;
