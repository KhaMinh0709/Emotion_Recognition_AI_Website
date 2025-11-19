// src/services/mockAnalysis.ts
import { Analysis, AnalysisSummary, EmotionResult } from "@/types/emotions";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RawResult {
  id: number;
  source: string;
  timestamp: string;
  emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
}

export async function fetchDashboardData(): Promise<{
  analysis: Analysis;
  summary: AnalysisSummary;
  results: EmotionResult[];
} | null> {
  try {
    const response = await fetch(`${API_URL}/results/all`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    const allResults = data.all_results || [];
    
    if (allResults.length === 0) return null;
    
    // Tạo ID duy nhất cho analysis
    const analysisId = `dashboard-${Date.now()}`;
    
    // Convert API results sang EmotionResult format
    const emotionResults: EmotionResult[] = allResults.map((item: RawResult) => ({
      id: String(item.id),
      analysis_id: analysisId,
      timestamp: new Date(item.timestamp).getTime() / 1000, // Convert to seconds
      emotion_type: item.emotion.toLowerCase() as any,
      confidence: item.confidence,
      detection_type: item.source === "face" ? "facial" : item.source === "audio" ? "vocal" : "fusion",
      face_count: item.source === "face" ? 1 : 0,
      created_at: item.timestamp,
    }));
    
    // Tính toán summary
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    
    emotionResults.forEach(r => {
      emotionCounts[r.emotion_type] = (emotionCounts[r.emotion_type] || 0) + 1;
      totalConfidence += r.confidence;
    });
    
    const total = emotionResults.length;
    const distribution: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      distribution[emotion] = (count / total) * 100;
    });
    
    const dominantEmotion = Object.entries(emotionCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b)
    )[0] as any;
    
    const analysis: Analysis = {
      id: analysisId,
      file_name: "combined_analysis",
      file_type: "combined",
      file_url: "",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const summary: AnalysisSummary = {
      id: `summary-${analysisId}`,
      analysis_id: analysisId,
      dominant_emotion: dominantEmotion,
      emotion_distribution: distribution,
      average_confidence: totalConfidence / total,
      total_frames_analyzed: total,
      duration: Math.max(...emotionResults.map(r => r.timestamp), 0),
      created_at: new Date().toISOString(),
    };
    
    return { analysis, summary, results: emotionResults };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

export async function fetchResultsByDate(dateStr: string): Promise<{
  analysis: Analysis;
  summary: AnalysisSummary;
  results: EmotionResult[];
} | null> {
  try {
    const response = await fetch(`${API_URL}/results/by-date?date_str=${dateStr}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    const allResults = data.results || [];
    
    if (allResults.length === 0) return null;
    
    const analysisId = `history-${dateStr}`;
    
    const emotionResults: EmotionResult[] = allResults.map((item: RawResult) => ({
      id: String(item.id),
      analysis_id: analysisId,
      timestamp: new Date(item.timestamp).getTime() / 1000,
      emotion_type: item.emotion.toLowerCase() as any,
      confidence: item.confidence,
      detection_type: item.source === "face" ? "facial" : item.source === "audio" ? "vocal" : "fusion",
      face_count: item.source === "face" ? 1 : 0,
      created_at: item.timestamp,
    }));
    
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    
    emotionResults.forEach(r => {
      emotionCounts[r.emotion_type] = (emotionCounts[r.emotion_type] || 0) + 1;
      totalConfidence += r.confidence;
    });
    
    const total = emotionResults.length;
    const distribution: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      distribution[emotion] = (count / total) * 100;
    });
    
    const dominantEmotion = Object.entries(emotionCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b)
    )[0] as any;
    
    const analysis: Analysis = {
      id: analysisId,
      file_name: `analysis_${dateStr}`,
      file_type: "combined",
      file_url: "",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const summary: AnalysisSummary = {
      id: `summary-${analysisId}`,
      analysis_id: analysisId,
      dominant_emotion: dominantEmotion,
      emotion_distribution: distribution,
      average_confidence: totalConfidence / total,
      total_frames_analyzed: total,
      duration: Math.max(...emotionResults.map(r => r.timestamp), 0),
      created_at: new Date().toISOString(),
    };
    
    return { analysis, summary, results: emotionResults };
  } catch (error) {
    console.error("Error fetching results by date:", error);
    return null;
  }
}

export function generateMockData(): {
  analysis: Analysis;
  summary: AnalysisSummary;
  results: EmotionResult[];
} {
  const emotions = ["happy", "sad", "angry", "surprised", "neutral", "fearful", "disgusted"];
  const id = crypto.randomUUID();
  const now = new Date();

  const results: EmotionResult[] = [];
  const emotionCounts: Record<string, number> = {};

  for (let i = 0; i < 20; i++) {
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

    results.push({
      id: crypto.randomUUID(),
      analysis_id: id,
      timestamp: i * 0.5,
      emotion_type: emotion as any,
      confidence: 0.6 + Math.random() * 0.35,
      detection_type: Math.random() > 0.5 ? "facial" : "vocal",
      face_count: Math.floor(Math.random() * 3) + 1,
      created_at: now.toISOString(),
    });
  }

  const total = results.length;
  const distribution: Record<string, number> = {};
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    distribution[emotion] = (count / total) * 100;
  });

  const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as any;
  const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;

  const analysis: Analysis = {
    id,
    file_name: "mock_analysis.mp4",
    file_type: "video/mp4",
    file_url: "",
    status: "completed",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const summary: AnalysisSummary = {
    id: crypto.randomUUID(),
    analysis_id: id,
    dominant_emotion: dominantEmotion,
    emotion_distribution: distribution,
    average_confidence: avgConfidence,
    total_frames_analyzed: results.length,
    duration: results[results.length - 1]?.timestamp || 0,
    created_at: now.toISOString(),
  };

  return { analysis, summary, results };
}
