import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Modal, Button } from "../components/ui/Shared";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Radio,
  Plus,
} from "lucide-react";
import clsx from "clsx";

const NavItem = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: any;
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
  const queryClient = useQueryClient();
  // const navigate = useNavigate(); // Optional: navigate to new person on success?

  const createPersonMutation = useMutation({
    mutationFn: async (newPerson: any) => {
      return api.post("/people", newPerson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] }); // Refresh companies too
      setIsAddOpen(false);
      // Optional: Add toast success here
      // navigate(/people/${data.id})
    },
  });

  return (
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
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsAddOpen(true)}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <AddPersonModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createPersonMutation.mutate}
      />
    </div>
  );
}

function AddPersonModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      name: formData.get("name"),
      company_name: formData.get("company"),
      title: formData.get("title"),
      relationship: formData.get("relationship"),
      why_reached_out: formData.get("why_reached_out"),
      status: "open",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            name="name"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <select
              name="relationship"
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
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Why Reached Out
          </label>
          <textarea
            name="why_reached_out"
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
