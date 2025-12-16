import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card, Button, Badge, Modal } from "../components/ui/Shared";
import { Plus, ArrowRight } from "lucide-react";
import { AppContext } from "../layout/AppLayout";

interface WaitlistItem {
  id: number;
  company: string;
  name?: string;
  priority: string;
  reason?: string;
  status: string;
  links?: string; // JSON string
  outreach_channels?: string;
}

export default function WaitlistPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { openAddPerson } = useContext(AppContext);

  const { data: items, isLoading } = useQuery<WaitlistItem[]>({
    queryKey: ["waitlist"],
    queryFn: async () => {
      const res = await api.get("/waitlist");
      return res.data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (newItem: any) => {
      return api.post("/waitlist", newItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      setIsAddOpen(false);
    },
  });

  const handleConvert = (item: WaitlistItem) => {
    // Open the global Add Person modal with pre-filled data
    openAddPerson({
      name: item.name,
      company_name: item.company,
      reason: item.reason,
      links: item.links,
      outreach_channels: item.outreach_channels,
      waitlist_id: item.id, // Pass ID to handle "conversion" cleanup
    });
  };

  if (isLoading)
    return <div className="text-center py-10">Loading Waitlist...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-900">
                  {item.company}
                </h3>
                <Badge
                  color={
                    item.priority === "A"
                      ? "red"
                      : item.priority === "B"
                      ? "yellow"
                      : "gray"
                  }
                >
                  {item.priority}
                </Badge>
              </div>
              {item.name && (
                <p className="text-sm text-gray-600 mt-1">
                  Person: {item.name}
                </p>
              )}
              {item.reason && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  "{item.reason}"
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConvert(item)}
              >
                Convert <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {items?.length === 0 && (
        <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
          Waitlist is empty. Add companies/people you want to contact later.
        </div>
      )}

      <AddWaitlistModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={addItemMutation.mutate}
      />
    </div>
  );
}

function AddWaitlistModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  const addLink = () => {
    if (newLink) {
      setLinks([...links, newLink]);
      setNewLink("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const finalLinks = [...links];

    onSubmit({
      company: formData.get("company"),
      name: formData.get("name"),
      priority: formData.get("priority"),
      reason: formData.get("reason"),
      outreach_channels: formData.get("outreach_channels"),
      links: JSON.stringify(finalLinks),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Waitlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            name="company"
            required
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Person Name (Optional)
          </label>
          <input
            name="name"
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>

        {/* New Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option value="A">High (A)</option>
              <option value="B" selected>
                Medium (B)
              </option>
              <option value="C">Low (C)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Channel
            </label>
            <select
              name="outreach_channels"
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Dynamic Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Links (Job/Profile)
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
            Reason / Notes
          </label>
          <textarea
            name="reason"
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            rows={2}
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add to Waitlist</Button>
        </div>
      </form>
    </Modal>
  );
}
