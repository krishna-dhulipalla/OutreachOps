import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Person } from "../api/client";
import { Modal, Button } from "../components/ui/Shared";
import { AppContext, type InitialPersonData } from "./AppContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Radio,
  Plus,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";

const NavItem = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      clsx(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )
    }
  >
    <Icon size={18} />
    {children}
  </NavLink>
);

export default function AppLayout() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [initialPersonData, setInitialPersonData] =
    useState<InitialPersonData | null>(null);

  const queryClient = useQueryClient();

  const openAddPerson = (initialData?: InitialPersonData) => {
    setInitialPersonData(initialData || null);
    setIsAddOpen(true);
  };

  const createPersonMutation = useMutation({
    mutationFn: async (newPerson: Record<string, unknown>) => {
      const initialTouchpoint =
        (newPerson as { __initial_touchpoint?: Record<string, unknown> })
          .__initial_touchpoint ?? null;

      const personPayload = { ...newPerson } as Record<string, unknown>;
      delete (personPayload as { __initial_touchpoint?: unknown }).__initial_touchpoint;

      // If we have an ID from waitlist (converting), we might want to let the backend know?
      // For now, just create a fresh person.
      // If coming from waitlist, we SHOULD delete the waitlist item on success.
      // Handling that via a callback or just manually cleaning up if waitlist_id exists?
      // Let's implement a simple "if waitlist_id, call convert endpoint" logic or just separate calls.
      // Easiest: The API call creates person. If success, we check if we need to clean up waitlist
      // But 'converting' endpoint in backend does almost nothing currently.
      // Let's just create person. The 'convert' logic in backend was just changing status.
      // We will handle the "cleanup" by actually passing `waitlist_id` to the create endpoint if we want atomicity,
      // but for MVP, we just create.
      const created = (await api.post("/people", personPayload)).data as Person;
      if (initialTouchpoint) {
        await api.post(`/people/${created.id}/touchpoints`, initialTouchpoint);
      }
      return created;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      // If we have a waitlist ID, we should technically "convert" it (mark as converted or delete)
      if (initialPersonData?.waitlist_id) {
        await api.post(`/waitlist/${initialPersonData.waitlist_id}/convert`);
        queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      }

      setIsAddOpen(false);
      setInitialPersonData(null);
    },
  });

  return (
    <AppContext.Provider value={{ openAddPerson }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-gray-900 tracking-tight">
                    OutreachOps
                  </span>
                </div>
                <nav className="hidden sm:ml-8 sm:flex sm:space-x-2 items-center">
                  <NavItem to="/" icon={LayoutDashboard}>
                    Today
                  </NavItem>
                  <NavItem to="/people" icon={Users}>
                    People
                  </NavItem>
                  <NavItem to="/companies" icon={Building2}>
                    Companies
                  </NavItem>
                  <NavItem to="/waitlist" icon={Clock}>
                    Waitlist
                  </NavItem>
                  <NavItem to="/radar" icon={Radio}>
                    Radar
                  </NavItem>
                  <NavItem to="/analytics" icon={BarChart3}>
                    Analytics
                  </NavItem>
                </nav>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => openAddPerson()}
                  className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus size={16} />
                  New Contact
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        <AddPersonModal
          isOpen={isAddOpen}
          initialData={initialPersonData}
          onClose={() => setIsAddOpen(false)}
          onSubmit={createPersonMutation.mutate}
        />
      </div>
    </AppContext.Provider>
  );
}

function AddPersonModal({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  initialData?: InitialPersonData | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [logInitialTouchpoint, setLogInitialTouchpoint] = useState(false);

  // Effect to reset or set initial data
  const [key, setKey] = useState(0); // Force re-render on open so defaultValues work
  React.useEffect(() => {
    if (isOpen) {
      setKey((k) => k + 1);
      setLogInitialTouchpoint(false);
      if (initialData?.links) {
        try {
          const parsed = JSON.parse(initialData.links);
          setLinks(Array.isArray(parsed) ? parsed : []);
        } catch {
          setLinks([]);
        }
      } else {
        setLinks([]);
      }
      setNewLink("");
    }
  }, [isOpen, initialData]);

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

    // Collect links
    const finalLinks = [...links];
    const pendingLink = normalizeUrl(newLink);
    if (pendingLink) finalLinks.push(pendingLink);

    const initialTouchpoint =
      formData.get("log_initial_touchpoint") === "on"
        ? {
            date: new Date().toISOString(),
            channel: formData.get("initial_channel"),
            outcome: formData.get("initial_outcome"),
            direction: formData.get("initial_direction"),
            message_preview: formData.get("initial_message_preview"),
          }
        : null;

    onSubmit({
      name: formData.get("name"),
      company_name: formData.get("company"),
      title: formData.get("title"),
      relationship: formData.get("relationship"),
      why_reached_out: formData.get("why_reached_out"),
      outreach_channels: formData.get("outreach_channels"),
      create_initial_followup: formData.get("create_initial_followup") === "on",
      initial_followup_days: Number(formData.get("initial_followup_days")) || 2,
      links: JSON.stringify(finalLinks),
      status: "open",
      __initial_touchpoint: initialTouchpoint,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Contact">
      <form key={key} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            name="name"
            defaultValue={initialData?.name || ""}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            name="company"
            defaultValue={
              initialData?.company || initialData?.company_name || ""
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              name="title"
              defaultValue={initialData?.title || ""}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <select
              name="relationship"
              defaultValue={initialData?.relationship || "cold"}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
            >
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="recruiter">Recruiter</option>
              <option value="referral">Referral</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        {/* New Fields: Type & Links */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primary Channel
            </label>
            <select
              name="outreach_channels"
              defaultValue={initialData?.outreach_channels || "linkedin"}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="twitter">Twitter/X</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Create Follow-up?
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                name="create_initial_followup"
                defaultChecked={true}
                className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Yes, in</span>
              <input
                type="number"
                name="initial_followup_days"
                defaultValue={2}
                min={1}
                className="w-16 rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-1"
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-900">
              Initial Touchpoint (optional)
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="log_initial_touchpoint"
                checked={logInitialTouchpoint}
                onChange={(e) => setLogInitialTouchpoint(e.target.checked)}
                className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
              />
              Log now
            </label>
          </div>

          {logInitialTouchpoint && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Who initiated?
                  </label>
                  <select
                    name="initial_direction"
                    defaultValue="outbound"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
                  >
                    <option value="outbound">I reached out (Outbound)</option>
                    <option value="inbound">They reached me (Inbound)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Outcome
                  </label>
                  <select
                    name="initial_outcome"
                    defaultValue="sent"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
                  >
                    <option value="sent">Sent</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Channel
                  </label>
                  <select
                    name="initial_channel"
                    defaultValue="LinkedIn DM"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
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
                  <label className="block text-xs font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <input
                    name="initial_message_preview"
                    placeholder="Short note…"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Counts toward analytics: Sent = outbound+sent, Replies = inbound+replied.
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Links (LinkedIn/Jobs)
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
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
            defaultValue={
              initialData?.reason || initialData?.why_reached_out || ""
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
            rows={3}
            placeholder="e.g. Hiring for X role..."
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Contact</Button>
        </div>
      </form>
    </Modal>
  );
}
