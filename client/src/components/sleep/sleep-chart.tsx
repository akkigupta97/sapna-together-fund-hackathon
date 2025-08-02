import { Card } from "@/components/ui/card";
import type { SleepSession } from "@shared/schema";
import { format, parseISO } from "date-fns";

interface SleepChartProps {
  sessions: SleepSession[];
}

export default function SleepChart({ sessions }: SleepChartProps) {
  if (sessions.length === 0) {
    return (
      <div className="h-48 bg-white/5 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">📊</div>
          <div>Sleep Chart Visualization</div>
          <div className="text-sm">7-day sleep pattern analysis</div>
        </div>
      </div>
    );
  }

  // Simple bar chart implementation
  const maxDuration = Math.max(...sessions.map(s => s.duration || 0));
  const chartData = sessions.slice(0, 7).reverse(); // Show last 7 days, oldest first

  return (
    <div className="h-48 bg-white/5 rounded-xl p-4">
      <div className="h-full flex items-end justify-between space-x-2">
        {chartData.map((session, index) => {
          const height = session.duration ? (session.duration / maxDuration) * 100 : 0;
          const quality = session.quality || 0;
          
          return (
            <div key={session.id} className="flex flex-col items-center flex-1">
              <div className="text-xs text-gray-400 mb-2">
                {quality}%
              </div>
              <div className="w-full bg-gray-600 rounded-t-md relative overflow-hidden" style={{ height: '120px' }}>
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-300 ${
                    quality >= 80 ? 'bg-mint-green' :
                    quality >= 60 ? 'bg-warm-amber' :
                    'bg-red-400'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {session.startTime ? format(parseISO(session.startTime), 'EEE') : 'N/A'}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-mint-green rounded"></div>
            <span className="text-gray-400">Good (80%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-warm-amber rounded"></div>
            <span className="text-gray-400">Fair (60-80%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span className="text-gray-400">Poor (&lt;60%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
