// trash/service/trashService.ts
import { TrashItem } from "../utils/types";

// 👉 Dán nguyên array SAMPLE hiện tại của bạn vào đây
export const MOCK_TRASH_ITEMS: TrashItem[] = [
  {
    id: "1",
    type: "notebook",
    name: "OCR_FULL_CLASS.ipynb",
    owner: "Bạn",
    removedAt: "2025-10-22T03:12:00Z",
    size: 43800,
    origin: "OCR_FULL_CLASS",
    ext: "ipynb",
  },
  {
    id: "2",
    type: "folder",
    name: "runs_char-sao",
    owner: "Bạn",
    removedAt: "2025-10-17T10:00:00Z",
    size: null,
    origin: "Chau",
  },
  // ... các phần tử còn lại giống SAMPLE cũ
];
