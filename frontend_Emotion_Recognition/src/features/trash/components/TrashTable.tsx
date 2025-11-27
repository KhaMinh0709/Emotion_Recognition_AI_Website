// trash/components/TrashTable.tsx
import React from "react";
import { ICON, tokens, fmtBytes, fmtDate } from "../utils/ui";
import type { TrashItem } from "../utils/types";

type RowProps = {
  item: TrashItem;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
};

const Row: React.FC<RowProps> = ({ item, checked, onToggle }) => (
  <tr className="hover:bg-white/5">
    <td className="px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="accent-sky-500"
      />
    </td>
    <td className="px-3 py-2">
      <div className="flex items-center gap-3">
        {item.type === "folder"
          ? ICON.folder
          : item.type === "notebook"
          ? ICON.notebook
          : ICON.file}
        <div
          className="text-slate-200 truncate max-w-[360px]"
          title={item.name}
        >
          {item.name}
        </div>
      </div>
    </td>
    <td className="px-3 py-2 text-slate-300">{item.owner}</td>
    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
      {fmtDate(item.removedAt)}
    </td>
    <td className="px-3 py-2 text-slate-300 text-right">
      {fmtBytes(item.size ?? null)}
    </td>
    <td
      className="px-3 py-2 text-slate-300 truncate max-w-[220px]"
      title={item.origin}
    >
      {item.origin}
    </td>
  </tr>
);

type TableProps = {
  items: TrashItem[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
};

const TrashTable: React.FC<TableProps> = ({
  items,
  selectedIds,
  setSelectedIds,
}) => {
  const allChecked = items.length > 0 && selectedIds.length === items.length;

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? items.map((i) => i.id) : []);

  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );

  return (
    <div className={`${tokens.card} overflow-hidden`}>
      <table className="w-full text-sm">
        <thead className="bg-white/5 border-b border-white/10 text-slate-300">
          <tr>
            <th className="text-left px-3 py-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                className="accent-sky-500"
              />
            </th>
            <th className="text-left px-3 py-2 font-medium">Tên</th>
            <th className="text-left px-3 py-2 font-medium">Chủ sở hữu</th>
            <th className="text-left px-3 py-2 font-medium">
              Ngày chuyển vào thùng rác
            </th>
            <th className="text-right px-3 py-2 font-medium">Kích thước tệp</th>
            <th className="text-left px-3 py-2 font-medium">Vị trí gốc</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <Row
              key={it.id}
              item={it}
              checked={selectedIds.includes(it.id)}
              onToggle={toggleOne}
            />
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="p-12 text-center text-slate-400">Thùng rác trống.</div>
      )}
    </div>
  );
};

export default TrashTable;
