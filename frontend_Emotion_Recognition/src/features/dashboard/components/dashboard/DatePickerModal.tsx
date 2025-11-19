import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadData: (dateStr: string) => Promise<void>;
  isLoading?: boolean;
}

export function DatePickerModal({ isOpen, onClose, onLoadData, isLoading = false }: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleLoad = async () => {
    await onLoadData(selectedDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[rgba(10,14,32,0.95)] shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Background effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e1030] via-[#0a0f28] to-transparent" />
          <div className="absolute -top-16 left-1/3 w-[60%] h-40 blur-3xl animate-aurora bg-gradient-to-r from-sky-500/20 via-fuchsia-500/20 to-purple-500/20" />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">
              Load Results by Date
            </span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a date to view analysis results from that day
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLoad}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Results'
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes aurora {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
            50% { transform: translateY(-12px) scale(1.02); opacity: 0.8; }
          }
          .animate-aurora { animation: aurora 10s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}
