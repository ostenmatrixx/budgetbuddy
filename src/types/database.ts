import type { TransactionType } from "./transaction";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TransactionRow = {
  id: string;
  client_request_id: string;
  user_id: string;
  type: TransactionType;
  subcategory: string | null;
  amount: number;
  date: string;
  description: string;
  notes: string;
  version: number;
  created_at: string;
  updated_at: string;
};

type BudgetPreferenceRow = {
  user_id: string;
  essentials_percent: number;
  savings_percent: number;
  non_essentials_percent: number;
  created_at: string;
  updated_at: string;
};

type TransactionSubcategoryRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UserSettingsRow = {
  user_id: string;
  currency_code: string;
  locale: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: TransactionRow;
        Insert: {
          id?: string;
          client_request_id?: string;
          user_id: string;
          type: TransactionType;
          subcategory?: string | null;
          amount: number;
          date: string;
          description: string;
          notes?: string;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TransactionRow>;
        Relationships: [];
      };
      budget_preferences: {
        Row: BudgetPreferenceRow;
        Insert: {
          user_id: string;
          essentials_percent?: number;
          savings_percent?: number;
          non_essentials_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BudgetPreferenceRow>;
        Relationships: [];
      };
      transaction_subcategories: {
        Row: TransactionSubcategoryRow;
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TransactionSubcategoryRow>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: {
          user_id: string;
          currency_code?: string;
          locale?: string;
          time_zone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserSettingsRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_account_balance: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
