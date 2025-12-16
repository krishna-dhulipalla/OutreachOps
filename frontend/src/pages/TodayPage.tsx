import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { FollowUp } from "../api/client";
import { Card, Button } from "../components/ui/Shared";
import { CheckCircle, Clock, Calendar, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface DashboardData {
  overdue: FollowUpWithPerson[];
  due_today: FollowUpWithPerson[];
  upcoming: FollowUpWithPerson[];
}

interface FollowUpWithPerson extends FollowUp {
  person: {
    id: number;
    name: string;
    company: { name: string };
  };
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/today");
      return res.data;
    },
  });

  const markDoneMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return api.post(`/dashboard/tasks/${taskId}/done`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const snoozeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return api.post(`/dashboard/tasks/${taskId}/snooze`, null, {
        params: { days: 2 },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const closeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return api.post(`/dashboard/tasks/${taskId}/close`, null, {
        params: { reason: "Manual close" },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  if (isLoading)
    return <div className="text-center py-10">Loading Dashboard...</div>;

  const TaskCard = ({
    task,
    isOverdue = false,
  }: {
    task: FollowUpWithPerson;
    isOverdue?: boolean;
  }) => (
    <Card
      className={`p-4 flex justify-between items-start ${
        isOverdue ? "border-l-4 border-l-red-500" : ""
      }`}
    >
      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            {task.action}
          </h3>
          <span className="text-sm text-gray-500">with</span>
          <Link
            to={`/people/${task.person.id}`}
            className="text-blue-600 font-medium hover:underline"
          >
            {task.person.name}
          </Link>
          <span className="text-sm text-gray-500">
            at {task.person.company.name}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1 flex items-center">
          <Calendar size={14} className="mr-1" />
          {format(new Date(task.due_date), "MMM d, yyyy")}
          {isOverdue && (
            <span className="text-red-600 ml-2 font-medium">(Overdue)</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {/* Close Action (X) */}
        <button
          onClick={() => closeMutation.mutate(task.id)}
          title="Cancel/Close Task"
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <XCircle size={18} />
        </button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => snoozeMutation.mutate(task.id)}
        >
          <Clock size={14} className="mr-1" /> Snooze 2d
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => markDoneMutation.mutate(task.id)}
        >
          <CheckCircle size={14} className="mr-1" /> Done
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Good Morning, Vamsi
        </h1>
        <p className="text-gray-600">
          Here are your outreach priorities for today.
        </p>
      </div>

      {/* Overdue */}
      {data?.overdue && data.overdue.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center">
            <Clock className="mr-2" size={20} /> Overdue Tasks (
            {data.overdue.length})
          </h2>
          <div className="space-y-3">
            {data.overdue.map((task) => (
              <TaskCard key={task.id} task={task} isOverdue />
            ))}
          </div>
        </div>
      ) : null}

      {/* Today */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <CheckCircle className="mr-2 text-green-600" size={20} /> Due Today
        </h2>
        {(!data?.due_today || data.due_today.length === 0) && (
          <div className="text-gray-500 italic p-4 border border-dashed rounded-lg text-center">
            No tasks due today. You're all caught up!
          </div>
        )}
        <div className="space-y-3">
          {data?.due_today.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-bold text-gray-500 mb-3">Upcoming</h2>
        <div className="space-y-3 opacity-80">
          {data?.upcoming.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
