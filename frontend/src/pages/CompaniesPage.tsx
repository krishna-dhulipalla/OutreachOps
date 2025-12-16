import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card, Badge } from "../components/ui/Shared";
import { Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface CompanySummary {
  id: number;
  name: string;
  sponsor_status: string;
  notes: string;
  contact_count: number;
  last_touch_date: string | null;
  next_follow_up_date: string | null;
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
          <Card
            key={company.id}
            className="p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {company.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {company.contact_count} contacts
                  </p>
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

            <div className="space-y-2 mt-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last Touch:</span>
                <span className="font-medium text-gray-900">
                  {company.last_touch_date
                    ? format(parseISO(company.last_touch_date), "MMM d")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next Follow-up:</span>
                <span className="font-medium text-gray-900">
                  {company.next_follow_up_date
                    ? format(parseISO(company.next_follow_up_date), "MMM d")
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
