// trash/hooks/useTrashState.ts
import { useMemo, useState } from "react";
import type { TrashItem, TrashFilterState } from "../utils/types";

export function useTrashState(initialItems: TrashItem[]) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TrashFilterState>({
    type: "all",
    order: "recent",
    q: "",
  });

  const filteredItems = useMemo(() => {
    let out = [...items];

    if (filters.q.trim()) {
      const q = filters.q.toLowerCase();
      out = out.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (filters.type !== "all") {
      out = out.filter((i) => i.type === filters.type);
    }

    if (filters.order === "recent") {
      out.sort(
        (a, b) =>
          new Date(b.removedAt || 0).getTime() -
          new Date(a.removedAt || 0).getTime()
      );
    } else if (filters.order === "oldest") {
      out.sort(
        (a, b) =>
          new Date(a.removedAt || 0).getTime() -
          new Date(b.removedAt || 0).getTime()
      );
    } else if (filters.order === "size") {
      out.sort((a, b) => (b.size || 0) - (a.size || 0));
    }

    return out;
  }, [items, filters]);

  const restoreItems = (ids: string[]) => {
    if (!ids.length) return;
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelectedIds([]);
  };

  const deleteItems = (ids: string[]) => {
    if (!ids.length) return;
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelectedIds([]);
  };

  const emptyTrash = () => {
    setItems([]);
    setSelectedIds([]);
  };

  return {
    items,
    filteredItems,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    restoreItems,
    deleteItems,
    emptyTrash,
  };
}
