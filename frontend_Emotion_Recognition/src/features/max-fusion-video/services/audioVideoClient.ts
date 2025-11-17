// src/features/max-fusion-video/services/audioVideoClient.ts
import { ModelScore } from "@/features/max-fusion-video/utils/mockData";

// Get API base URL from environment or use default
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export type AudioVideoResponse = {
  emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
};

export type FusionAnalysisResult = {
  label: string;
  score: number;
  by_modality?: {
    video?: { label: string; score: number };
    audio?: { label: string; score: number };
  };
};

/**
 * Call the audio-video fusion API endpoint
 * @param file Video file to analyze
 * @returns Prediction result with emotion, confidence, and all emotions scores
 */
export async function predictAudioVideoEmotion(
  file: File
): Promise<AudioVideoResponse> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE_URL}/audio-video/predict`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `Audio-video prediction failed: ${errorData.detail || res.statusText}`
    );
  }

  return res.json();
}

/**
 * Convert API response to UI format
 */
export function formatFusionResult(response: AudioVideoResponse): FusionAnalysisResult {
  const emotionLabels: Record<string, string> = {
    ANG: "Angry",
    DIS: "Disgusted",
    FEA: "Fearful",
    HAP: "Happy",
    NEU: "Neutral",
    SAD: "Sad",
  };

  const label = emotionLabels[response.emotion] || response.emotion;

  return {
    label,
    score: response.confidence,
    by_modality: {
      video: { label, score: response.confidence },
      audio: { label, score: response.confidence },
    },
  };
}

/**
 * React hook for audio-video prediction
 */
export function useAudioVideoPrediction() {
  const predict = async (
    file: File
  ): Promise<{ result: FusionAnalysisResult; raw: AudioVideoResponse }> => {
    const raw = await predictAudioVideoEmotion(file);
    const result = formatFusionResult(raw);
    return { result, raw };
  };

  return { predict };
  
}
