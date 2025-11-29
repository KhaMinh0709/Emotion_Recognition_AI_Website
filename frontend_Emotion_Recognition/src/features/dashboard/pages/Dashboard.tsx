import { useEffect, useMemo, useState } from "react";
import { fetchResultsByDate, generateMockData, setResultTrash } from "../services/mockAnalysis";
import { EmotionSummaryCard } from "../../../components/EmotionSummaryCard";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DistributionCard } from "../components/dashboard/DistributionCard";
import { TimelineCard } from "../components/dashboard/TimelineCard";
import { DetectionTable } from "../components/dashboard/DetectionTable";
import { DetectionDetailModal } from "../components/dashboard/DetectionDetailModal";
import { DashboardSkeleton } from "../components/dashboard/Skeletons";
import { DatePickerModal } from "../components/dashboard/DatePickerModal";
import { Analysis, AnalysisSummary, EmotionResult } from "../../../types/emotions";
import { DashboardStyles } from "../styles/DashboardStyles";

export default function Dashboard() {
  const [mockData, setMockData] = useState<{
    analysis: Analysis;
    summary: AnalysisSummary;
    results: EmotionResult[];
  } | null>(null);

  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [selected, setSelected] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // load data từ API khi component mount - lấy dữ liệu hôm nay
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy ngày hôm nay
        const todayStr = new Date().toISOString().split('T')[0];
        const result = await fetchResultsByDate(todayStr);
        if (result) {
          setMockData(result);
        } else {
          setError("No data available for today. Please upload or analyze some files first.");
          setMockData(null);
        }
      } catch (err) {
        setError("Failed to load data from server");
        setMockData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ESC đóng modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ⚠️ luôn tạo biến từ mockData trước
  const summary = mockData?.summary ?? null;
  const results = mockData?.results ?? [];

  // ⚠️ luôn gọi useMemo trước khi return
  const windowResults = useMemo(() => {
    if (!selected || results.length === 0) return [];
    const start = selected.timestamp - 1.5;
    const end = selected.timestamp + 1.5;
    return results.filter((r) => r.timestamp >= start && r.timestamp <= end);
  }, [selected, results]);

  function handleAskDelete(id: string) {
    setDeleteId(id);
    setIsConfirmOpen(true);
  }

  // hàm xóa 1 dòng
  async function handleDeleteDetection(id: string) {
    setIsConfirmOpen(false);
    const ok = await setResultTrash(id);
    if (ok) {
      // Sau khi xóa, reload lại dữ liệu dashboard
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await fetchResultsByDate(todayStr);
      setMockData(result);
      if (selected?.id === id) {
        setSelected(null);
      }
    } else {
      alert("Xóa thất bại!");
    }
    setDeleteId(null);
  }

  // hàm load dữ liệu theo ngày
  const handleLoadByDate = async (dateStr: string) => {
    setIsLoadingDate(true);
    try {
      const result = await fetchResultsByDate(dateStr);
      if (result) {
        setMockData(result);
        setIsDatePickerOpen(false);
      } else {
        alert(`No results found for ${dateStr}`);
      }
    } finally {
      setIsLoadingDate(false);
    }
  };

  // ⬇️ bây giờ mới return sớm
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !mockData || !summary) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(10,14,32,0.6)] backdrop-blur-xl p-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e1030] via-[#0a0f28] to-transparent" />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">No Data Available</h2>
            <p className="text-gray-400">{error || "Start by uploading or analyzing files to see results here."}</p>
            <button
              onClick={() => setIsDatePickerOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 transition-all"
            >
              Select Different Date
            </button>
          </div>
        </div>
        <DatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onLoadData={handleLoadByDate}
          isLoading={isLoadingDate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        summary={{
          dominant_emotion: summary.dominant_emotion,
          average_confidence: summary.average_confidence,
          total_frames_analyzed: summary.total_frames_analyzed,
          duration: summary.duration,
        }}
        onNewAnalysis={() => setIsDatePickerOpen(true)}
      />

      <EmotionSummaryCard summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionCard
          distribution={summary.emotion_distribution}
          chartType={chartType}
          onChangeType={setChartType}
        />
        <TimelineCard results={results} />
      </div>

      <DetectionTable
        results={results}
        onSelect={setSelected}
        onDeleteOne={handleAskDelete}
      />

      {selected && (
        <DetectionDetailModal
          selected={selected}
          windowResults={windowResults}
          onClose={() => setSelected(null)}
        />
      )}

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onLoadData={handleLoadByDate}
        isLoading={isLoadingDate}
      />

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa bản ghi?</h3>
            <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa bản ghi này khỏi dashboard? Thao tác này sẽ chuyển bản ghi vào thùng rác.</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => { setIsConfirmOpen(false); setDeleteId(null); }}
              >Hủy</button>
              <button
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                onClick={() => deleteId && handleDeleteDetection(deleteId)}
              >Xóa</button>
            </div>
          </div>
        </div>
      )}

      <DashboardStyles />
    </div>
  );
}

