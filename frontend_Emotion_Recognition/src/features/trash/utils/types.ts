// trash/types.ts
export type TrashItem = {
  id: string;
  type?: "folder" | "notebook" | "zip" | "file" | string;
  name: string;
  owner?: string;
  removedAt?: string;
  size?: number | null;
  origin?: string;
  ext?: string;
};

export type TrashFilterState = {
  type: "all" | "folder" | "notebook" | "zip" | "file";
  order: "recent" | "oldest" | "size";
  q: string;
};

export type ConfirmAction = "restore" | "delete" | "empty";

export type ConfirmState =
  | {
      action: ConfirmAction;
      ids?: string[];
    }
  | null;
