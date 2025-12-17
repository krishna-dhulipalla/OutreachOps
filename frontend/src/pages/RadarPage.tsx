import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card, Button, Modal } from "../components/ui/Shared";
import { Search, Bookmark } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  published: string;
  snippet: string;
}

export default function RadarPage() {
  const [query, setQuery] = useState("H-1B sponsor hiring");
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const queryClient = useQueryClient();

  const {
    data: news,
    isLoading,
    refetch,
  } = useQuery<NewsItem[]>({
    queryKey: ["radar", query],
    queryFn: async () => {
      const res = await api.get(`/radar?query=${encodeURIComponent(query)}`);
      return res.data;
    },
  });

  const saveToWaitlistMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.post("/waitlist", data);
    },
    onSuccess: () => {
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      // Optional: Toast
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">H-1B Radar</h1>
        <p className="text-gray-600">
          Latest news regarding H-1B sponsors, layoffs, and hiring trends.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-10">Scanning radar...</div>
        )}

        {news?.map((item, i) => (
          <Card key={i} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 hover:underline"
                  >
                    {item.title}
                  </a>
                </h3>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span className="font-medium text-gray-700">
                    {item.source}
                  </span>
                  <span>•</span>
                  <span>{item.published}</span>
                </div>
                <div
                  className="mt-2 text-gray-600 text-sm line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: item.snippet }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 flex-shrink-0"
                onClick={() => setSelectedItem(item)}
              >
                <Bookmark size={16} />
              </Button>
            </div>
          </Card>
        ))}

        {news?.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500">
            No signals detected. Try a different query.
          </div>
        )}
      </div>

      <SaveToWaitlistModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSubmit={saveToWaitlistMutation.mutate}
      />
    </div>
  );
}

function SaveToWaitlistModal({
  item,
  onClose,
  onSubmit,
}: {
  item: NewsItem | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      company: formData.get("company"),
      reason: formData.get("reason"),
      priority: "B",
    });
  };

  // Try to guess company name from title or source
  const defaultCompany = item ? item.source || "" : "";
  const defaultReason = item ? `Flagged from news: ${item.title}` : "";

  return (
    <Modal isOpen={!!item} onClose={onClose} title="Save to Waitlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            name="company"
            defaultValue={defaultCompany}
            required
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reason / Notes
          </label>
          <textarea
            name="reason"
            defaultValue={defaultReason}
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            rows={3}
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
