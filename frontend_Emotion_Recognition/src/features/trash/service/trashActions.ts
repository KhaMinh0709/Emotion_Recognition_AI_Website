const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function restoreTrashItem(id: string) {
  try {
    const res = await fetch(`${API_URL}/results/restore/${id}`, {
      method: "POST"
    });
    return (await res.json()).success === true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
}

export async function deleteTrashItemForever(id: string) {
  try {
    const res = await fetch(`${API_URL}/results/delete/${id}`, {
      method: "DELETE"
    });
    return (await res.json()).success === true;
  } catch (e) {
    console.error("Delete forever failed", e);
    return false;
  }
}

export async function emptyTrash() {
  try {
    const res = await fetch(`${API_URL}/results/trash/empty`, {
      method: "DELETE"
    });
    return (await res.json()).success === true;
  } catch (e) {
    console.error("Empty trash failed", e);
    return false;
  }
}
