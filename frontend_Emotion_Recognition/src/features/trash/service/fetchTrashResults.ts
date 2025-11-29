import { EmotionResult } from "@/types/emotions";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchTrashResults(): Promise<EmotionResult[]> {
    try {
        const response = await fetch(`${API_URL}/results/trash`);
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        const trashResults = data.trash_results || [];
        return trashResults.map((item: any) => ({
            id: String(item.id),
            analysis_id: "trash",
            timestamp: new Date(item.timestamp).getTime() / 1000,
            emotion_type: item.emotion?.toLowerCase() ?? "neutral",
            confidence: item.confidence,
            detection_type: item.source === "face" ? "facial" : item.source === "audio" ? "vocal" : "fusion",
            face_count: item.source === "face" ? 1 : 0,
            created_at: item.timestamp,
        }));
    } catch (error) {
        console.error("Error fetching trash results:", error);
        return [];
    }
}
