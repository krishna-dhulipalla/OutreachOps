import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card, Badge } from "../components/ui/Shared";
import { Building2 } from "lucide-react";
import { formatChicago } from "../utils/datetime";

interface CompanySummary {
  id: number;
  name: string;
  sponsor_status: string;
  notes: string;
  contact_count: number;
  last_touch_date: string | null;
  next_follow_up_date: string | null;
  contacts: { id: number; name: string; title?: string }[];
}

export default function CompaniesPage() {
  const { data: companies, isLoading } = useQuery<CompanySummary[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get("/companies");
      return res.data;
    },
  });

  if (isLoading)
    return <div className="text-center py-10">Loading Companies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies?.map((company) => (
          <Card key={company.id} className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {company.name}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    Next:{" "}
                    {company.next_follow_up_date
                      ? formatChicago(company.next_follow_up_date, {
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </div>
                </div>
              </div>
              <Badge
                color={
                  company.sponsor_status === "yes"
                    ? "green"
                    : company.sponsor_status === "no"
                    ? "red"
                    : "gray"
                }
              >
                {company.sponsor_status === "unknown"
                  ? "?"
                  : company.sponsor_status}
              </Badge>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                Contacts
              </p>
              <div className="space-y-2">
                {company.contacts?.map((contact) => (
                  <div
                    key={contact.id}
                    className="group flex justify-between items-center text-sm p-1 hover:bg-gray-50 rounded"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      {contact.title && (
                        <span className="text-xs text-gray-500">
                          {contact.title}
                        </span>
                      )}
                    </div>
                    <a
                      href={`/people/${contact.id}`}
                      className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-blue-200 px-2 py-1 rounded bg-blue-50"
                    >
                      View
                    </a>
                  </div>
                ))}
                {company.contacts?.length === 0 && (
                  <span className="text-sm text-gray-400 italic">
                    No contacts
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mt-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last Touch:</span>
                <span className="font-medium text-gray-900">
                  {company.last_touch_date
                    ? formatChicago(company.last_touch_date, {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next Follow-up:</span>
                <span className="font-medium text-gray-900">
                  {company.next_follow_up_date
                    ? formatChicago(company.next_follow_up_date, {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </Card>
        ))}

        {companies?.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
            No companies tracked yet. Add a contact to create a company.
          </div>
        )}
      </div>
    </div>
  );
}
