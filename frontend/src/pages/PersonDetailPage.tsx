import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Person } from "../api/client";
import { api } from "../api/client";
import { Button, Badge, Card, Modal } from "../components/ui/Shared";
import {
  ArrowLeft,
  Linkedin,
  MessageSquare,
  Calendar,
  Pencil,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { formatChicago, toDateAssumingUtcIfNaive } from "../utils/datetime";

// Add EditPersonModal in the same file for now or create generic
// To save time, I will create a dedicated EditPersonModal here distinct from Global Add

function EditPersonModal({
  person,
  isOpen,
  onClose,
  onSubmit,
}: {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  React.useEffect(() => {
    if (person.links) {
      try {
        setLinks(JSON.parse(person.links));
      } catch {
        setLinks([]);
      }
    }
  }, [person]);

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const addLink = () => {
    const normalized = normalizeUrl(newLink);
    if (normalized) {
      setLinks([...links, normalized]);
      setNewLink("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const finalLinks = [...links];
    const pendingLink = normalizeUrl(newLink);
    if (pendingLink) finalLinks.push(pendingLink);
    onSubmit({
      name: formData.get("name"),
      company_name: formData.get("company_name"),
      title: formData.get("title"),
      relationship: formData.get("relationship"),
      why_reached_out: formData.get("why_reached_out"),
      outreach_channels: formData.get("outreach_channels"),
      links: JSON.stringify(finalLinks),
      status: formData.get("status"),
      linkedin_url: formData.get("linkedin_url"),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Person">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            name="name"
            defaultValue={person.name}
            required
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            name="company_name"
            defaultValue={person.company.name}
            required
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              name="title"
              defaultValue={person.title}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <select
              name="relationship"
              defaultValue={person.relationship}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="recruiter">Recruiter</option>
              <option value="referral">Referral</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>
        {/* Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Links
          </label>
          <div className="space-y-2 mt-1">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex gap-2 text-sm bg-gray-50 p-2 rounded"
              >
                <span className="truncate flex-1">{link}</span>
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste URL..."
                className="block w-full rounded-md border-gray-300 border p-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Why Reached Out
          </label>
          <textarea
            name="why_reached_out"
            defaultValue={person.why_reached_out}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PersonDetailPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false); // New state

  const { data: person, isLoading } = useQuery<Person>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/people/${personId}`);
      return res.data;
    },
  });

  const logTouchpointMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.post(`/people/${personId}/touchpoints`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["person", personId] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsLogOpen(false);
    },
  });

  const deletePersonMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/people/${personId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate("/people");
    },
  });

  const updatePersonMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.put(`/people/${personId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["person", personId] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsEditOpen(false);
    },
  });

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (!person) return <div className="text-center py-10">Person not found</div>;

  // Parse links safely
  let linksArray: string[] = [];
  if (person.links) {
    try {
      const parsed = JSON.parse(person.links);
      linksArray = Array.isArray(parsed) ? parsed : [];
    } catch {
      linksArray = [];
    }
  }

  const getLinkLabel = (link: string) => {
    try {
      return new URL(link).hostname;
    } catch {
      return link;
    }
  };

  return (
    <div className="space-y-6">
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
            <button
              onClick={() => setIsEditOpen(true)}
              className="text-gray-400 hover:text-gray-700 ml-2"
            >
              <Pencil size={18} />
            </button>
          </h1>
          <div className="text-lg text-gray-600 mt-1">
            {person.title && <span>{person.title} at </span>}
            <span className="font-medium text-gray-900">
              {person.company.name}
            </span>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-4 text-sm text-gray-500">
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
                Added{" "}
                {formatChicago(person.created_at, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {/* Render Links */}
            {linksArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {linksArray.map((link: string, i: number) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-700"
                  >
                    <LinkIcon size={12} /> {getLinkLabel(link)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
	        <div className="flex gap-2">
	          <Button
	            variant="outline"
	            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this person? This cannot be undone."
                )
              ) {
                deletePersonMutation.mutate();
              }
            }}
            className="text-red-600 border-red-200 hover:bg-red-50"
	          >
	            Delete
	          </Button>
	          <Button
	            variant="outline"
	            onClick={() => {
	              const nextStatus = person.status === "closed" ? "open" : "closed";
	              const ok = window.confirm(
	                nextStatus === "closed"
	                  ? "Mark this person as closed? This will also close any open follow-up tasks."
	                  : "Reopen this person?"
	              );
	              if (ok) updatePersonMutation.mutate({ status: nextStatus });
	            }}
	          >
	            {person.status === "closed" ? "Reopen" : "Close"}
	          </Button>
	          <Button onClick={() => setIsLogOpen(true)}>
	            <MessageSquare size={16} className="mr-2" /> Log Touchpoint
	          </Button>
	          {/* Add Follow-up Button */}
	        </div>
      </div>

      <EditPersonModal
        person={person}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={updatePersonMutation.mutate}
      />

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
                      {formatChicago(tp.date, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {tp.outcome && (
                    <p className="text-gray-600 text-sm mt-1">
                      Outcome: {tp.outcome}
                    </p>
                  )}
                  {tp.message_preview && (
                    <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">
                      {tp.message_preview}
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
            </div>
            {(() => {
              const openTasks = (person.follow_ups || [])
                .filter((t) => t.status === "open")
                .sort((a, b) => {
                  const da = toDateAssumingUtcIfNaive(a.due_date)?.getTime() ?? 0;
                  const db = toDateAssumingUtcIfNaive(b.due_date)?.getTime() ?? 0;
                  return da - db;
                });

              if (openTasks.length === 0) {
                return <p className="text-gray-500 text-sm">No tasks pending.</p>;
              }

              return (
                <ul className="space-y-3">
                  {openTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 text-sm border-l-2 border-yellow-400 pl-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {task.action}
                        </p>
                        <p className="text-gray-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />{" "}
                          {formatChicago(task.due_date, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
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
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [outcome, setOutcome] = useState("sent");
  const [direction, setDirection] = useState("outbound");

  React.useEffect(() => {
    if (!isOpen) return;
    setOutcome("sent");
    setDirection("outbound");
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      channel: formData.get("channel"),
      message_preview: formData.get("message"),
      date: new Date().toISOString(),
      outcome: formData.get("outcome"),
      direction: formData.get("direction"),
      next_step_action: formData.get("next_step_action"),
      next_step_date: formData.get("next_step_date"),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Touchpoint">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Channel
            </label>
            <select
              name="channel"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option>LinkedIn DM</option>
              <option>LinkedIn InMail</option>
              <option>Email</option>
              <option>Connection Request</option>
              <option>Call</option>
              <option>In Person</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Who Initiated?
            </label>
            <select
              name="direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option value="outbound">I reached out (Outbound)</option>
              <option value="inbound">They reached me (Inbound)</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Outcome
            </label>
            <select
              name="outcome"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              onChange={(e) => {
                const v = e.target.value;
                setOutcome(v);
                if (v === "sent") setDirection("outbound");
                if (v === "replied") setDirection("inbound");
              }}
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
