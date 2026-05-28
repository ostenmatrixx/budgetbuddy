import { useEffect, useMemo, useState } from "react";
import {
  calculateCategoryPieSegments,
  calculateBudgetSummary,
  filterTransactionsByMonth,
  getMonthName
} from "../lib/budget";
import {
  addTransaction,
  deleteTransaction,
  loadTransactions,
  updateTransaction
} from "../lib/storage";
import {
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionType
} from "../types/transaction";
import AnnualReportDashboard from "./AnnualReportDashboard";
import BudgetAllocationCards from "./BudgetAllocationCards";
import CalendarWidget from "./CalendarWidget";
import DailyTransactionLog from "./DailyTransactionLog";
import DashboardViewToggle, { type DashboardView } from "./DashboardViewToggle";
import MonthlySelector from "./MonthlySelector";
import SummaryCards from "./SummaryCards";
import TransactionFormModal from "./TransactionFormModal";
import TransactionSection from "./TransactionSection";

interface DashboardProps {
  userId: string;
  userEmail?: string;
  onLogout: () => void | Promise<void>;
}

interface ModalState {
  type?: TransactionType;
  transaction?: Transaction;
  date?: string;
}

export default function Dashboard({ userId, userEmail, onLogout }: DashboardProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [dataError, setDataError] = useState("");
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [view, setView] = useState<DashboardView>("monthly");

  useEffect(() => {
    let isActive = true;

    async function fetchTransactions() {
      setIsLoadingTransactions(true);
      setDataError("");

      try {
        const nextTransactions = await loadTransactions(userId);

        if (isActive) {
          setTransactions(nextTransactions);
        }
      } catch (error) {
        if (isActive) {
          setDataError(
            error instanceof Error ? error.message : "Unable to load your transactions."
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingTransactions(false);
        }
      }
    }

    void fetchTransactions();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const monthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedYear, selectedMonth),
    [transactions, selectedMonth, selectedYear]
  );

  const summary = useMemo(
    () => calculateBudgetSummary(transactions, selectedYear, selectedMonth),
    [transactions, selectedMonth, selectedYear]
  );

  const selectedDateTransactions = useMemo(
    () =>
      selectedDate
        ? transactions
            .filter((transaction) => transaction.date === selectedDate)
            .sort((a, b) => a.description.localeCompare(b.description))
        : [],
    [selectedDate, transactions]
  );

  async function refreshTransactions() {
    const nextTransactions = await loadTransactions(userId);
    setTransactions(nextTransactions);
  }

  async function handleSaveTransaction(draft: TransactionDraft) {
    setDataError("");

    try {
      if (modalState?.transaction) {
        await updateTransaction(userId, modalState.transaction.id, draft);
      } else {
        await addTransaction(userId, draft);
      }

      await refreshTransactions();
      setModalState(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to save this transaction.");
    }
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    const confirmed = window.confirm(`Delete "${transaction.description}"?`);

    if (!confirmed) {
      return;
    }

    setDataError("");

    try {
      await deleteTransaction(transaction.id);
      await refreshTransactions();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to delete this transaction.");
    }
  }

  function handleMonthChange(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDate(undefined);
  }

  function handleViewChange(nextView: DashboardView) {
    setView(nextView);
    setSelectedDate(undefined);
  }

  return (
    <main className="min-h-screen bg-white text-black-bean">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-ecru/70 bg-white/85 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-maroon">
              {view === "monthly" ? "Monthly dashboard" : "Annual report"}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Budget Tracker</h1>
            <p className="mt-2 text-sm text-black-bean/70">
              {view === "monthly"
                ? `${getMonthName(selectedYear, selectedMonth)} overview`
                : `${selectedYear} yearly overview`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <DashboardViewToggle view={view} onChange={handleViewChange} />
            {userEmail ? (
              <p className="max-w-[260px] truncate text-sm font-medium text-black-bean/60">
                {userEmail}
              </p>
            ) : null}
            <button
              className="w-fit rounded-lg border border-maroon/60 bg-white px-4 py-2 text-sm font-bold text-maroon shadow-sm transition hover:bg-maroon hover:text-white focus:outline-none focus:ring-2 focus:ring-maroon/30"
              type="button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {dataError ? (
          <div className="rounded-lg border border-light-red/50 bg-light-red/15 px-4 py-3 text-sm font-semibold text-maroon">
            {dataError}
          </div>
        ) : null}

        {isLoadingTransactions ? (
          <section className="rounded-lg border border-light-red/30 bg-white p-6 text-sm font-semibold text-black-bean/65 shadow-[0_20px_60px_rgba(166,66,66,0.08)]">
            Loading transactions...
          </section>
        ) : null}

        {!isLoadingTransactions && view === "monthly" ? (
          <>
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex flex-col gap-5">
                <MonthlySelector
                  month={selectedMonth}
                  year={selectedYear}
                  onChange={handleMonthChange}
                />
                <SummaryCards summary={summary} />
                <BudgetAllocationCards summary={summary} />
              </div>
              <div className="flex flex-col gap-4">
                <CalendarWidget
                  month={selectedMonth}
                  year={selectedYear}
                  selectedDate={selectedDate}
                  transactions={monthlyTransactions}
                  onSelectDate={setSelectedDate}
                />
                {selectedDate ? (
                  <DailyTransactionLog
                    date={selectedDate}
                    transactions={selectedDateTransactions}
                    onClose={() => setSelectedDate(undefined)}
                    onDelete={handleDeleteTransaction}
                    onEdit={(transaction) => setModalState({ transaction })}
                  />
                ) : null}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              {transactionTypes.map((type) => (
                <TransactionSection
                  key={type}
                  type={type}
                  year={selectedYear}
                  month={selectedMonth}
                  transactions={monthlyTransactions.filter(
                    (transaction) => transaction.type === type
                  )}
                  pieSegments={calculateCategoryPieSegments(
                    transactions,
                    selectedYear,
                    selectedMonth,
                    type
                  )}
                  onAdd={() => setModalState({ type })}
                  onDelete={handleDeleteTransaction}
                  onEdit={(transaction) => setModalState({ transaction })}
                />
              ))}
            </section>
          </>
        ) : null}

        {!isLoadingTransactions && view === "annual" ? (
          <AnnualReportDashboard
            transactions={transactions}
            year={selectedYear}
            onYearChange={(year) => {
              setSelectedYear(year);
              setSelectedDate(undefined);
            }}
          />
        ) : null}
      </div>

      {modalState ? (
        <TransactionFormModal
          defaultDate={modalState.date}
          initialType={modalState.type}
          transaction={modalState.transaction}
          onClose={() => setModalState(null)}
          onSubmit={handleSaveTransaction}
        />
      ) : null}
    </main>
  );
}
