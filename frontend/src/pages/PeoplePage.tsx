import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Person } from "../api/client";
import { Badge, Card } from "../components/ui/Shared";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function PeoplePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await api.get("/people");
      return res.data;
    },
  });

  const filteredPeople = people?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
        {/* Global CTA in AppLayout handles adding people */}
      </div>

      <div className="flex gap-4">
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
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
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-t-gray-900 border-gray-200 animate-spin"></div>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : filteredPeople?.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  <p className="mb-2">No people found.</p>
                  <p className="text-sm">
                    Click "New Contact" to add someone to your list.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPeople?.map((person) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={person.status === "open" ? "green" : "gray"}>
                      {person.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.touchpoints?.length > 0
                      ? format(
                          new Date(
                            person.touchpoints[
                              person.touchpoints.length - 1
                            ].date
                          ),
                          "MMM d"
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.follow_ups?.length > 0
                      ? format(new Date(person.follow_ups[0].due_date), "MMM d")
                      : "-"}
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
