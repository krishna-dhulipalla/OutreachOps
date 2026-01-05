import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Company {
  id: number;
  name: string;
  sponsor_status: string;
  notes?: string;
  contacts?: PersonSimple[];
  contact_count?: number;
  last_touch_date?: string | null;
  next_follow_up_date?: string | null;
}

export interface PersonSimple {
  id: number;
  name: string;
  title?: string;
}

export interface Person {
  id: number;
  name: string;
  company_id: number;
  company: Company;
  title?: string;
  status: string; // 'open', 'waiting', 'closed'
  relationship: string;
  why_reached_out: string;
  linkedin_url?: string;
  created_at: string;
  links?: string;
  outreach_channels?: string;
  touchpoints: Touchpoint[];
  follow_ups: FollowUp[];
}

export interface Touchpoint {
  id: number;
  date: string;
  channel: string;
  outcome?: string;
  direction?: string;
  message_preview?: string | null;
  next_step_action?: string | null;
}

export interface FollowUp {
  id: number;
  due_date: string;
  action: string;
  status: string;
}
