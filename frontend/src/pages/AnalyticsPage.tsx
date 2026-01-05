import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card, Button } from "../components/ui/Shared";

type AnalyticsDay = {
  date: string; // YYYY-MM-DD
  sent_outbound: number;
  replies_inbound: number;
  recruiter_inmail_inbound: number;
  replies_attributed_to_sent_day: number;
  response_rate_by_sent_day: number;
};

type WeeklyAnalytics = {
  week_start: string; // Monday YYYY-MM-DD
  days: AnalyticsDay[];
};

const formatPct = (value: number) =>
  `${Math.round((value + Number.EPSILON) * 100)}%`;

const addDays = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfWeekMonday = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function AnalyticsPage() {
  const currentMonday = useMemo(() => startOfWeekMonday(new Date()), []);
  const [weekStart, setWeekStart] = useState<Date>(currentMonday);

  const { data, isLoading } = useQuery<WeeklyAnalytics>({
    queryKey: ["analytics-weekly", isoDate(weekStart)],
    queryFn: async () => {
      const res = await api.get("/analytics/weekly", {
        params: { week_start: isoDate(weekStart) },
      });
      return res.data;
    },
  });

  const canGoNext = weekStart.getTime() < currentMonday.getTime();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">
            Weekly view (Mon–Sun) — Sent = outbound+sent, Replies = inbound+replied
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            Prev Week
          </Button>
          <Button
            variant="outline"
            disabled={!canGoNext}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            Next Week
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Week:{" "}
            <span className="font-semibold text-gray-900">
              {isoDate(weekStart)} – {isoDate(addDays(weekStart, 6))}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replies
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recruiter InMail
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replies (to sent day)
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.days.map((d) => (
                  <tr key={d.date} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {d.date}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">
                      {d.sent_outbound}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">
                      {d.replies_inbound}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">
                      {d.recruiter_inmail_inbound}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">
                      {d.replies_attributed_to_sent_day}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">
                      {formatPct(d.response_rate_by_sent_day)}
                    </td>
                  </tr>
                ))}
                {!data?.days?.length && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-sm text-gray-500"
                      colSpan={6}
                    >
                      No activity for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

