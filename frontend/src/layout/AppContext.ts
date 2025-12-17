import React from "react";

export type InitialPersonData = {
  waitlist_id?: number;
  name?: string;
  company?: string;
  company_name?: string;
  title?: string;
  relationship?: string;
  why_reached_out?: string;
  reason?: string;
  outreach_channels?: string;
  links?: string;
};

export const AppContext = React.createContext<{
  openAddPerson: (initialData?: InitialPersonData) => void;
}>({
  openAddPerson: () => {},
});

