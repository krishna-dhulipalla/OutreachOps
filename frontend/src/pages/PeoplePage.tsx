import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Person } from "../api/client";
import { Badge, Button, Card } from "../components/ui/Shared";
import { Search } from "lucide-react";
import { formatChicago, toDateAssumingUtcIfNaive } from "../utils/datetime";

export default function PeoplePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc"); // created_desc, created_asc, name_asc
  const [page, setPage] = useState(1);
  const perPage = 10;

  const resetToFirstPage = () => setPage(1);

  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await api.get("/people");
      return res.data;
    },
  });

  const filteredPeople = people
    ?.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "created_asc")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ); // default created_desc
    });

  const total = filteredPeople?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filteredPeople?.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search people..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetToFirstPage();
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="waiting">Waiting</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            resetToFirstPage();
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing{" "}
          {total === 0 ? 0 : (safePage - 1) * perPage + 1}
          {"–"}
          {Math.min(safePage * perPage, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="px-2">
            Page {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Touch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Follow-up
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-t-gray-900 border-gray-200 animate-spin"></div>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : filteredPeople?.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  <p className="mb-2">No people found.</p>
                  <p className="text-sm">
                    Click "New Contact" to add someone to your list.
                  </p>
                </td>
              </tr>
            ) : (
              pageItems?.map((person) => (
                <tr
                  key={person.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/people/${person.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                        {person.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {person.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.company.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatChicago(person.created_at, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={person.status === "open" ? "green" : "gray"}>
                      {person.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.touchpoints?.length > 0
                      ? formatChicago(
                          person.touchpoints[person.touchpoints.length - 1].date,
                          { month: "short", day: "numeric" }
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const nextOpen = (person.follow_ups || [])
                        .filter((f) => f.status === "open")
                        .sort((a, b) => {
                          const da = toDateAssumingUtcIfNaive(a.due_date)?.getTime() ?? 0;
                          const db = toDateAssumingUtcIfNaive(b.due_date)?.getTime() ?? 0;
                          return da - db;
                        })[0];
                      return nextOpen
                        ? formatChicago(nextOpen.due_date, {
                            month: "short",
                            day: "numeric",
                          })
                        : "-";
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
