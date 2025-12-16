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
  touchpoints: Touchpoint[];
  follow_ups: FollowUp[];
}

export interface Touchpoint {
  id: number;
  date: string;
  channel: string;
  outcome?: string;
}

export interface FollowUp {
  id: number;
  due_date: string;
  action: string;
  status: string;
}
