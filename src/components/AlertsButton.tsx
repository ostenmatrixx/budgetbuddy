import { useState } from "react";
import type { InAppAlert } from "../types/decisionSupport";
import AccessibleDialog from "./AccessibleDialog";

interface AlertsButtonProps {
  alerts: InAppAlert[];
}

const groupLabels: Record<InAppAlert["group"], string> = {
  critical: "Critical",
  upcoming: "Upcoming",
  progress: "Progress"
};

export default function AlertsButton({ alerts }: AlertsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const groups = (Object.keys(groupLabels) as InAppAlert["group"][])
    .map((group) => ({ group, items: alerts.filter((alert) => alert.group === group) }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <button
        aria-label={`Alerts${alerts.length > 0 ? `, ${alerts.length} active` : ""}`}
        className="motion-icon-button relative grid h-10 w-10 place-items-center rounded-lg border border-surface-variant bg-surface-container-lowest text-on-surface-variant transition hover:border-outline hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="Alerts"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          notifications
        </span>
        {alerts.length > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        ) : null}
      </button>

      <AccessibleDialog
        className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-lg"
        descriptionId="alerts-description"
        labelId="alerts-title"
        open={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Current conditions
            </p>
            <h2 className="mt-1 text-2xl font-bold text-on-surface" id="alerts-title">
              Alerts
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant" id="alerts-description">
              Alerts resolve automatically when the underlying budget, schedule, or goal changes.
            </p>
          </div>
          <button
            aria-label="Close alerts"
            className="icon-control motion-icon-button"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-outline/60 bg-surface-container-low p-8 text-center">
            <span className="material-symbols-outlined text-[32px] text-success" aria-hidden="true">
              check_circle
            </span>
            <h3 className="mt-2 font-bold text-on-surface">You’re all caught up</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              There are no active budget, recurring, or goal alerts.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            {groups.map(({ group, items }) => (
              <section key={group} aria-labelledby={`alerts-${group}`}>
                <h3
                  className="text-xs font-bold uppercase tracking-[0.05em] text-outline"
                  id={`alerts-${group}`}
                >
                  {groupLabels[group]}
                </h3>
                <div className="mt-2 grid gap-2">
                  {items.map((alert) => (
                    <article
                      className="flex gap-3 rounded-xl border border-surface-variant bg-surface-container-low p-4"
                      key={alert.id}
                    >
                      <span
                        aria-hidden="true"
                        className={`material-symbols-outlined ${
                          group === "critical" ? "text-error" : "text-primary"
                        }`}
                      >
                        {alert.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-on-surface">{alert.title}</h4>
                        <p className="mt-1 text-sm text-on-surface-variant">{alert.message}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </AccessibleDialog>
    </>
  );
}
