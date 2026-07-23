import { useEffect, useMemo, useState } from "react";
import { useUserSettings } from "../contexts/UserSettingsContext";
import { usePwaStatus } from "../hooks/usePwaStatus";
import {
  DEFAULT_BUDGET_PREFERENCES,
  calculateAnnualReport,
  calculateCategoryPieSegments,
  calculateBudgetSummary,
  filterTransactionsByMonth,
  getMonthName,
  type BudgetPreference
} from "../lib/budget";
import { toDateInputValue } from "../lib/date";
import {
  addTransactionSubcategory,
  archiveTransactionSubcategory,
  addTransaction,
  deleteTransaction,
  getAccountBalance,
  loadBudgetPreference,
  loadTransactionSubcategories,
  loadTransactions,
  saveBudgetPreference,
  TransactionConflictError,
  updateTransaction
} from "../lib/storage";
import {
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionSubcategoriesByType,
  type TransactionSubcategoryOption,
  type TransactionType
} from "../types/transaction";
import AnnualReportDashboard from "./AnnualReportDashboard";
import AccessibleDialog from "./AccessibleDialog";
import AccountSettingsPanel from "./AccountSettingsPanel";
import BudgetAllocationCards from "./BudgetAllocationCards";
import BudgetPreferenceEditor from "./BudgetPreferenceEditor";
import CalendarWidget from "./CalendarWidget";
import ConfirmDialog from "./ConfirmDialog";
import DailyTransactionLog from "./DailyTransactionLog";
import DashboardViewToggle, { type DashboardView } from "./DashboardViewToggle";
import MonthlySelector from "./MonthlySelector";
import PwaInstallPrompt from "./PwaInstallPrompt";
import SummaryCards from "./SummaryCards";
import ThemeToggle, { type ThemeMode } from "./ThemeToggle";
import TransactionFormModal from "./TransactionFormModal";
import TransactionSection from "./TransactionSection";

interface DashboardProps {
  theme: ThemeMode;
  userId: string;
  userEmail?: string;
  onLogout: () => void | Promise<void>;
  onToggleTheme: () => void;
}

interface ModalState {
  type?: TransactionType;
  transaction?: Transaction;
  date?: string;
  clientRequestId?: string;
}

function createTransactionModalState(
  values: Omit<ModalState, "clientRequestId" | "transaction"> = {}
): ModalState {
  return { ...values, clientRequestId: crypto.randomUUID() };
}

export default function Dashboard({
  onLogout,
  onToggleTheme,
  theme,
  userId,
  userEmail
}: DashboardProps) {
  const { currencySymbol, formatCurrency, settings } = useUserSettings();
  const { isOffline } = usePwaStatus();
  const initialPeriod = getCurrentPeriod(settings.timeZone);
  const [selectedYear, setSelectedYear] = useState(initialPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(initialPeriod.month);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactionSubcategories, setTransactionSubcategories] = useState<
    TransactionSubcategoryOption[]
  >([]);
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference>(
    DEFAULT_BUDGET_PREFERENCES
  );
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isSavingBudgetPreference, setIsSavingBudgetPreference] = useState(false);
  const [dataError, setDataError] = useState("");
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [view, setView] = useState<DashboardView>("monthly");
  const [isBudgetEditorOpen, setIsBudgetEditorOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isAccountSettingsBusy, setIsAccountSettingsBusy] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [hasCreatedTransaction, setHasCreatedTransaction] = useState(false);

  useEffect(() => {
    const period = getCurrentPeriod(settings.timeZone);
    setSelectedYear(period.year);
    setSelectedMonth(period.month);
    setSelectedDate(undefined);
  }, [settings.timeZone]);

  useEffect(() => {
    let isActive = true;

    async function fetchTransactions() {
      setIsLoadingTransactions(true);
      setDataError("");

      try {
        const [
          nextTransactions,
          nextBudgetPreference,
          nextTransactionSubcategories,
          nextTotalBalance
        ] = await Promise.all([
          loadTransactions(userId, selectedYear),
          loadBudgetPreference(userId),
          loadTransactionSubcategories(userId),
          getAccountBalance()
        ]);

        if (isActive) {
          setTransactions(nextTransactions);
          setBudgetPreference(nextBudgetPreference);
          setTransactionSubcategories(nextTransactionSubcategories);
          setTotalBalance(nextTotalBalance);
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
  }, [selectedYear, userId]);

  const monthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedYear, selectedMonth),
    [transactions, selectedMonth, selectedYear]
  );

  const subcategoriesByType = useMemo(
    () =>
      transactionSubcategories.reduce<TransactionSubcategoriesByType>((groups, subcategory) => {
        groups[subcategory.type] = [...(groups[subcategory.type] ?? []), subcategory];
        return groups;
      }, {}),
    [transactionSubcategories]
  );

  const summary = useMemo(
    () => calculateBudgetSummary(transactions, selectedYear, selectedMonth, budgetPreference),
    [budgetPreference, transactions, selectedMonth, selectedYear]
  );

  const annualTopbarSummary = useMemo(
    () => calculateAnnualReport(transactions, selectedYear),
    [transactions, selectedYear]
  );

  const activeTitle = view === "monthly" ? "Monthly Dashboard" : "Annual Report";
  const activePeriod =
    view === "monthly" ? getMonthName(selectedYear, selectedMonth) : `${selectedYear} overview`;
  const activeRemainingIncome =
    view === "monthly" ? summary.remainingIncome : annualTopbarSummary.yearly.remainingIncome;
  const userInitial = (userEmail?.trim().charAt(0) || "B").toUpperCase();

  const selectedDateTransactions = useMemo(
    () =>
      selectedDate
        ? transactions
            .filter((transaction) => transaction.date === selectedDate)
            .sort((a, b) => a.description.localeCompare(b.description))
        : [],
    [selectedDate, transactions]
  );

  async function refreshTransactions(): Promise<Transaction[]> {
    const [nextTransactions, nextTotalBalance] = await Promise.all([
      loadTransactions(userId, selectedYear),
      getAccountBalance()
    ]);
    setTransactions(nextTransactions);
    setTotalBalance(nextTotalBalance);
    return nextTransactions;
  }

  async function refreshSubcategories() {
    const nextSubcategories = await loadTransactionSubcategories(userId);
    setTransactionSubcategories(nextSubcategories);
  }

  async function handleSaveTransaction(draft: TransactionDraft) {
    if (isOffline) {
      throw new Error("Reconnect to save this transaction.");
    }

    setDataError("");
    const isNewTransaction = !modalState?.transaction;

    try {
      if (modalState?.transaction) {
        await updateTransaction(
          userId,
          modalState.transaction.id,
          draft,
          modalState.transaction.version
        );
      } else {
        await addTransaction(userId, draft, modalState?.clientRequestId ?? crypto.randomUUID());
      }

      await refreshTransactions();
      if (isNewTransaction) {
        setHasCreatedTransaction(true);
      }
      setModalState(null);
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unable to save this transaction.";

      if (error instanceof TransactionConflictError && modalState?.transaction) {
        const latestTransactions = await refreshTransactions();
        const latestTransaction = latestTransactions.find(
          (transaction) => transaction.id === modalState.transaction?.id
        );

        setModalState(latestTransaction ? { transaction: latestTransaction } : null);
        message = latestTransaction
          ? `${message} The latest saved version is now loaded.`
          : "This transaction was deleted on another device. The dashboard has been refreshed.";
      }

      setDataError(message);
      throw new Error(message);
    }
  }

  function handleDeleteTransaction(transaction: Transaction) {
    setDeleteError("");
    setTransactionToDelete(transaction);
  }

  async function handleConfirmDeleteTransaction() {
    if (!transactionToDelete) {
      return;
    }

    if (isOffline) {
      setDeleteError("Reconnect to delete this transaction.");
      return;
    }

    setDataError("");
    setDeleteError("");
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(userId, transactionToDelete.id, transactionToDelete.version);
      await refreshTransactions();
      setTransactionToDelete(null);
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unable to delete this transaction.";

      if (error instanceof TransactionConflictError) {
        const latestTransactions = await refreshTransactions();
        const latestTransaction = latestTransactions.find(
          (transaction) => transaction.id === transactionToDelete.id
        );

        setTransactionToDelete(latestTransaction ?? null);
        message = latestTransaction
          ? `${message} Review the latest saved version before deleting it.`
          : "This transaction was already deleted on another device.";
      }

      setDataError(message);
      setDeleteError(message);
    } finally {
      setIsDeletingTransaction(false);
    }
  }

  async function handleSaveBudgetPreference(nextPreference: BudgetPreference) {
    if (isOffline) {
      throw new Error("Reconnect to save budget targets.");
    }

    setDataError("");
    setIsSavingBudgetPreference(true);

    try {
      const savedPreference = await saveBudgetPreference(userId, nextPreference);
      setBudgetPreference(savedPreference);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save budget targets.";
      setDataError(message);
      throw new Error(message);
    } finally {
      setIsSavingBudgetPreference(false);
    }
  }

  async function handleAddSubcategory(type: TransactionType, name: string) {
    if (isOffline) {
      throw new Error("Reconnect to add a subcategory.");
    }

    setDataError("");

    try {
      await addTransactionSubcategory(userId, type, name);
      await refreshSubcategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add subcategory.";
      setDataError(message);
      throw new Error(message);
    }
  }

  async function handleArchiveSubcategory(subcategory: TransactionSubcategoryOption) {
    if (isOffline) {
      throw new Error("Reconnect to archive a subcategory.");
    }

    setDataError("");

    try {
      await archiveTransactionSubcategory(userId, subcategory.id);
      await refreshSubcategories();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to archive this subcategory.";
      setDataError(message);
      throw new Error(message);
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
    <main className="animate-screen-in min-h-screen bg-surface-bright text-on-surface">
      <a
        className="sr-only z-[100] rounded-lg bg-primary px-4 py-3 font-bold text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#dashboard-content"
      >
        Skip to dashboard content
      </a>
      <aside className="animate-slide-up fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 flex-col overflow-hidden border-r border-surface-variant bg-surface-container-lowest md:flex">
        <div className="flex shrink-0 items-center gap-3 p-6">
          <span
            className="material-symbols-outlined animate-pop text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance_wallet
          </span>
          <span className="text-2xl font-bold text-primary">BudgetBuddy</span>
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 custom-scrollbar">
          <DashboardViewToggle view={view} onChange={handleViewChange} />

          <div className="space-y-1 pt-2">
            <p className="px-4 text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Preferences
            </p>
            <button
              className="motion-nav-item flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
              disabled={isOffline}
              type="button"
              onClick={() => setIsBudgetEditorOpen(true)}
            >
              <span className="material-symbols-outlined text-[22px]">tune</span>
              Budget Targets
            </button>
            <button
              className="motion-nav-item flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
              type="button"
              onClick={() => setIsAccountSettingsOpen(true)}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                manage_accounts
              </span>
              Account Settings
            </button>
            <ThemeToggle className="w-full justify-start" theme={theme} onToggle={onToggleTheme} />
          </div>
        </nav>

        <div className="shrink-0 border-t border-surface-variant bg-surface-container-lowest p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-high p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container text-sm font-bold text-on-primary">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              {userEmail ? (
                <p className="truncate text-sm font-semibold text-on-surface">{userEmail}</p>
              ) : null}
            </div>
            <button
              aria-label="Account settings"
              className="motion-icon-button grid h-9 w-9 shrink-0 place-items-center rounded-lg text-outline transition hover:bg-surface-container-lowest hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              title="Account settings"
              type="button"
              onClick={() => setIsAccountSettingsOpen(true)}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                settings
              </span>
            </button>
            <button
              className="motion-icon-button grid h-9 w-9 shrink-0 place-items-center rounded-lg text-outline transition hover:bg-surface-container-lowest hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="animate-slide-up sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-surface-variant bg-surface px-4 py-3 md:fixed md:left-64 md:right-0 md:h-14 md:px-6 md:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="material-symbols-outlined text-primary md:hidden">
              account_balance_wallet
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-primary md:text-2xl">{activeTitle}</h1>
              <p className="truncate text-xs font-semibold text-outline">{activePeriod}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-end gap-6 lg:flex">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Remaining income
                </p>
                <p className="text-lg font-bold text-on-surface">
                  {formatCurrency(activeRemainingIncome)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Total balance
                </p>
                <p className="text-lg font-bold text-on-surface">{formatCurrency(totalBalance)}</p>
              </div>
            </div>

            <button
              className="motion-icon-button relative grid h-10 w-10 place-items-center rounded-full text-on-surface-variant opacity-60"
              type="button"
              aria-label="Notifications"
              title="Notifications"
              disabled
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="animate-pulse-soft absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-primary" />
            </button>

            <button
              aria-label="New transaction"
              className="motion-button motion-icon-button flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary ambient-shadow transition active:scale-95 hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isOffline}
              title={isOffline ? "Reconnect to add a transaction" : "New transaction"}
              type="button"
              onClick={() => setModalState(createTransactionModalState())}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="hidden sm:inline">New Transaction</span>
            </button>

            <ThemeToggle compact className="md:hidden" theme={theme} onToggle={onToggleTheme} />

            <button
              aria-label="Account settings"
              className="motion-icon-button grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 md:hidden"
              title="Account settings"
              type="button"
              onClick={() => setIsAccountSettingsOpen(true)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                settings
              </span>
            </button>

            <button
              className="motion-icon-button grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 md:hidden"
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:pb-8 md:pt-[5.5rem]"
          id="dashboard-content"
          tabIndex={-1}
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div className="rounded-xl border border-surface-variant bg-surface-container-lowest p-4 ambient-shadow lg:hidden">
              <DashboardViewToggle view={view} onChange={handleViewChange} />
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:hidden">
              <article className="rounded-lg border border-surface-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Remaining income
                </p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(activeRemainingIncome)}</p>
              </article>
              <article className="rounded-lg border border-surface-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Total balance
                </p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              </article>
            </section>

            {dataError ? (
              <div
                className="rounded-lg border border-light-red/40 bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container"
                role="alert"
              >
                {dataError}
              </div>
            ) : null}

            <PwaInstallPrompt eligible={hasCreatedTransaction} />

            {isLoadingTransactions ? <LoadingTransactionsState /> : null}

            {!isLoadingTransactions && view === "monthly" ? (
              <div
                className="animate-screen-in grid gap-6"
                key={`monthly-${selectedYear}-${selectedMonth}`}
              >
                <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="flex flex-col gap-5">
                    <MonthlySelector
                      month={selectedMonth}
                      year={selectedYear}
                      onChange={handleMonthChange}
                    />
                    <SummaryCards summary={summary} />
                    <BudgetAllocationCards
                      isWriteDisabled={isOffline}
                      preference={budgetPreference}
                      summary={summary}
                      onEditTargets={() => setIsBudgetEditorOpen(true)}
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <CalendarWidget
                      locale={settings.locale}
                      month={selectedMonth}
                      year={selectedYear}
                      selectedDate={selectedDate}
                      transactions={monthlyTransactions}
                      onSelectDate={setSelectedDate}
                    />
                    {selectedDate ? (
                      <DailyTransactionLog
                        date={selectedDate}
                        isWriteDisabled={isOffline}
                        transactions={selectedDateTransactions}
                        onClose={() => setSelectedDate(undefined)}
                        onDelete={handleDeleteTransaction}
                        onEdit={(transaction) => setModalState({ transaction })}
                      />
                    ) : null}
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  {transactionTypes.map((type, index) => (
                    <TransactionSection
                      isWriteDisabled={isOffline}
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
                      subcategoriesByType={subcategoriesByType}
                      onAdd={() => setModalState(createTransactionModalState({ type }))}
                      onAddSubcategory={handleAddSubcategory}
                      onArchiveSubcategory={handleArchiveSubcategory}
                      onDelete={handleDeleteTransaction}
                      onEdit={(transaction) => setModalState({ transaction })}
                      motionIndex={index}
                    />
                  ))}
                </section>
              </div>
            ) : null}

            {!isLoadingTransactions && view === "annual" ? (
              <div className="animate-screen-in" key={`annual-${selectedYear}`}>
                <AnnualReportDashboard
                  transactions={transactions}
                  year={selectedYear}
                  onYearChange={(year) => {
                    setSelectedYear(year);
                    setSelectedDate(undefined);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {modalState ? (
        <TransactionFormModal
          key={
            modalState.transaction
              ? `${modalState.transaction.id}-${modalState.transaction.version}`
              : modalState.clientRequestId
          }
          currencySymbol={currencySymbol}
          defaultDate={modalState.date}
          initialType={modalState.type}
          isWriteDisabled={isOffline}
          transaction={modalState.transaction}
          subcategoriesByType={subcategoriesByType}
          timeZone={settings.timeZone}
          onClose={() => setModalState(null)}
          onSubmit={handleSaveTransaction}
        />
      ) : null}

      {isBudgetEditorOpen ? (
        <BudgetPreferenceEditor
          isWriteDisabled={isOffline}
          isSaving={isSavingBudgetPreference}
          preference={budgetPreference}
          onClose={() => setIsBudgetEditorOpen(false)}
          onSave={handleSaveBudgetPreference}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete transaction"
        description={
          transactionToDelete
            ? `Delete “${transactionToDelete.description}”? This cannot be undone.`
            : "Delete this transaction? This cannot be undone."
        }
        errorMessage={deleteError || undefined}
        isOpen={transactionToDelete !== null}
        isPending={isDeletingTransaction}
        title="Delete transaction?"
        variant="danger"
        onCancel={() => {
          if (!isDeletingTransaction) {
            setTransactionToDelete(null);
            setDeleteError("");
          }
        }}
        onConfirm={handleConfirmDeleteTransaction}
      />

      <AccessibleDialog
        className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-2xl"
        descriptionId="account-settings-description"
        isCloseBlocked={isAccountSettingsBusy}
        labelId="account-settings-title"
        open={isAccountSettingsOpen}
        onRequestClose={() => setIsAccountSettingsOpen(false)}
      >
        <div className="mb-2 flex justify-end">
          <button
            aria-label="Close account settings"
            className="icon-control motion-icon-button"
            disabled={isAccountSettingsBusy}
            title="Close"
            type="button"
            onClick={() => setIsAccountSettingsOpen(false)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        {isAccountSettingsOpen && userEmail ? (
          <AccountSettingsPanel
            isOffline={isOffline}
            pwaActions={<PwaInstallPrompt showWhenDismissed variant="settings" />}
            userEmail={userEmail}
            userId={userId}
            onAccountDeleted={onLogout}
            onBusyChange={setIsAccountSettingsBusy}
          />
        ) : null}
      </AccessibleDialog>
    </main>
  );
}

function getCurrentPeriod(timeZone: string): { month: number; year: number } {
  const [year, month] = toDateInputValue(new Date(), timeZone).split("-").map(Number);
  return { month, year };
}

function LoadingTransactionsState() {
  return (
    <section className="app-surface animate-card-in p-6" aria-label="Loading transactions">
      <div className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
        <span
          className="material-symbols-outlined animate-spin-soft text-primary"
          aria-hidden="true"
        >
          progress_activity
        </span>
        Loading transactions...
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className={`animate-card-in stagger-${(index % 6) + 1} rounded-xl border border-surface-variant bg-surface-container-lowest p-4`}
            key={index}
          >
            <span className="animate-shimmer block h-3 w-24 rounded-full bg-surface-container" />
            <span className="animate-shimmer mt-4 block h-8 w-32 rounded-full bg-surface-container-low" />
            <span className="animate-shimmer mt-4 block h-2 w-full rounded-full bg-surface-container" />
          </div>
        ))}
      </div>
    </section>
  );
}
