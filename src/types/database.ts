import type { TransactionType } from "./transaction";
import type { RecurringFrequency } from "./decisionSupport";

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

type RecurringItemRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  subcategory_id: string | null;
  amount: number;
  description: string;
  notes: string;
  frequency: RecurringFrequency;
  start_date: string;
  occurrence_number: number;
  next_due_date: string;
  end_date: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

type RecurringOccurrenceActionRow = {
  id: string;
  user_id: string;
  recurring_item_id: string;
  due_date: string;
  action: "recorded" | "skipped";
  transaction_id: string | null;
  created_at: string;
};

type SavingsGoalRow = {
  id: string;
  user_id: string;
  name: string;
  subcategory_id: string;
  target_amount: number;
  tracking_start_date: string;
  target_date: string | null;
  is_active: boolean;
  version: number;
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
      recurring_items: {
        Row: RecurringItemRow;
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          subcategory_id?: string | null;
          amount: number;
          description: string;
          notes?: string;
          frequency: RecurringFrequency;
          start_date: string;
          occurrence_number?: number;
          next_due_date: string;
          end_date?: string | null;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<RecurringItemRow>;
        Relationships: [];
      };
      recurring_occurrence_actions: {
        Row: RecurringOccurrenceActionRow;
        Insert: {
          id?: string;
          user_id: string;
          recurring_item_id: string;
          due_date: string;
          action: "recorded" | "skipped";
          transaction_id?: string | null;
          created_at?: string;
        };
        Update: Partial<RecurringOccurrenceActionRow>;
        Relationships: [];
      };
      savings_goals: {
        Row: SavingsGoalRow;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          subcategory_id: string;
          target_amount: number;
          tracking_start_date: string;
          target_date?: string | null;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SavingsGoalRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_account_balance: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_savings_balance: {
        Args: {
          through_date?: string | null;
          excluded_transaction_id?: string | null;
        };
        Returns: number;
      };
      advance_recurring_date: {
        Args: {
          schedule_start: string;
          schedule_frequency: RecurringFrequency;
          next_occurrence_number: number;
        };
        Returns: string;
      };
      get_savings_goal_progress: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{ goal_id: string; saved_amount: number }>;
      };
      record_recurring_occurrence: {
        Args: {
          recurring_id: string;
          expected_due_date: string;
          request_id: string;
          transaction_type: string;
          transaction_subcategory: string;
          transaction_amount: number;
          transaction_date: string;
          transaction_description: string;
          transaction_notes: string;
        };
        Returns: TransactionRow[];
      };
      search_transactions: {
        Args: {
          search_text?: string;
          filter_types?: string[] | null;
          date_from?: string | null;
          date_to?: string | null;
          minimum_amount?: number | null;
          maximum_amount?: number | null;
          sort_direction?: string;
          page_offset?: number;
          page_limit?: number;
        };
        Returns: Array<TransactionRow & { total_count: number }>;
      };
      skip_recurring_occurrence: {
        Args: {
          recurring_id: string;
          expected_due_date: string;
        };
        Returns: RecurringItemRow[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
