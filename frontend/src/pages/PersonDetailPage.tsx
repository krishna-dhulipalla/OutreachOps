import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Person } from "../api/client";
import { api } from "../api/client";
import { Button, Badge, Card, Modal } from "../components/ui/Shared";
import { ArrowLeft, Linkedin, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PersonDetailPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { data: person, isLoading } = useQuery<Person>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/people/${personId}`);
      return res.data;
    },
  });

  const logTouchpointMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/people/${personId}/touchpoints`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person", personId] });
      setIsLogOpen(false);
    },
  });

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (!person) return <div className="text-center py-10">Person not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate("/people")}
            className="text-gray-500 hover:text-gray-900 flex items-center mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to People
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {person.name}
            <Badge color={person.status === "open" ? "green" : "gray"}>
              {person.status}
            </Badge>
          </h1>
          <div className="text-lg text-gray-600 mt-1">
            {person.title && <span>{person.title} at </span>}
            <span className="font-medium text-gray-900">
              {person.company.name}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {person.linkedin_url && (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Linkedin size={16} className="mr-1" /> LinkedIn
              </a>
            )}
            <span>
              Relationship:{" "}
              <span className="capitalize font-medium">
                {person.relationship}
              </span>
            </span>
            <span>
              Added {format(new Date(person.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsLogOpen(true)}>
            <MessageSquare size={16} className="mr-2" /> Log Touchpoint
          </Button>
          {/* Add Follow-up Button */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Why Reached Out
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {person.why_reached_out}
            </p>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Activity Timeline
            </h3>
            {person.touchpoints?.length === 0 && (
              <p className="text-gray-500">No activity logged yet.</p>
            )}
            {person.touchpoints?.map((tp) => (
              <div
                key={tp.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <MessageSquare size={16} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {tp.channel}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {format(new Date(tp.date), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {tp.outcome && (
                    <p className="text-gray-600 text-sm mt-1">
                      Outcome: {tp.outcome}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Follow-ups */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Next Tasks</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Add
              </button>
            </div>
            {person.follow_ups?.length === 0 && (
              <p className="text-gray-500 text-sm">No tasks pending.</p>
            )}
            <ul className="space-y-3">
              {person.follow_ups?.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2 text-sm border-l-2 border-yellow-400 pl-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.action}</p>
                    <p className="text-gray-500 flex items-center mt-1">
                      <Calendar size={12} className="mr-1" />{" "}
                      {format(new Date(task.due_date), "MMM d")}
                    </p>
                  </div>
                  {/* Checkbox or actions */}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Company Info
            </h3>
            <p className="text-sm text-gray-600">
              Sponsor Status:{" "}
              <span className="font-medium">
                {person.company.sponsor_status}
              </span>
            </p>
          </Card>
        </div>
      </div>

      <TouchpointModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSubmit={logTouchpointMutation.mutate}
      />
    </div>
  );
}

function TouchpointModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [outcome, setOutcome] = useState("sent");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      channel: formData.get("channel"),
      message_preview: formData.get("message"),
      date: new Date().toISOString(),
      outcome: formData.get("outcome"),
      next_step_action: formData.get("next_step_action"),
      next_step_date: formData.get("next_step_date"),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Touchpoint">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Channel
            </label>
            <select
              name="channel"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option>LinkedIn DM</option>
              <option>Email</option>
              <option>Connection Request</option>
              <option>Call</option>
              <option>In Person</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Outcome
            </label>
            <select
              name="outcome"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="sent">Sent / Left Message</option>
              <option value="replied">Replied</option>
              <option value="meeting_booked">Meeting Booked</option>
              <option value="ghosted">No Response</option>
              <option value="closed">Closed / Not Interested</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes / Message Preview
          </label>
          <textarea
            name="message"
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            rows={3}
            placeholder="What did you say or what happened?"
          ></textarea>
        </div>

        {outcome !== "closed" && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Next Follow-up
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-800">
                  Date
                </label>
                <input
                  type="date"
                  name="next_step_date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 border p-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-800">
                  Action
                </label>
                <input
                  type="text"
                  name="next_step_action"
                  defaultValue="Follow Up"
                  className="mt-1 block w-full rounded-md border-gray-300 border p-1"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Log Touchpoint</Button>
        </div>
      </form>
    </Modal>
  );
}
