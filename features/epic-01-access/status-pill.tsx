import styles from "./access-ui.module.css";

type StatusPillProps = {
  status: string;
};

const styleByStatus: Record<string, string> = {
  Active: styles.pillActive,
  Approved: styles.pillApproved,
  Claimed: styles.pillReviewing,
  "Under Review": styles.pillReviewing,
  "Being reviewed": styles.pillReviewing,
  Pending: styles.pillPending,
  Received: styles.pillReceived,
  Rejected: styles.pillRejected,
  Suspended: styles.pillSuspended,
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`${styles.pill} ${styleByStatus[status] ?? ""}`}>
      {status}
    </span>
  );
}
