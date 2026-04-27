import type { RuntimeHealthSnapshot } from "@/lib/runtime-health-storage";

export type RuntimeHealthAreaStatus = {
  status: string;
  failing_checks: string[];
  warning_checks: string[];
};

export type RuntimeHealthDashboard = {
  refreshed_at: string;
  overall_status: string;
  alerting: RuntimeHealthSnapshot["alerting"];
  areas: {
    services: RuntimeHealthAreaStatus;
    logs: RuntimeHealthAreaStatus;
    backup: RuntimeHealthAreaStatus;
    webhook: RuntimeHealthAreaStatus;
    ingest: RuntimeHealthAreaStatus;
    public_dashboards: RuntimeHealthAreaStatus;
    search_console: RuntimeHealthAreaStatus;
  };
};

function groupedStatus(statuses: string[]) {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  if (statuses.includes("ok")) return "ok";
  if (statuses.every((status) => status === "skipped")) return "skipped";
  return "unknown";
}

function buildArea(snapshot: RuntimeHealthSnapshot, prefixOrKeys: string[] | string): RuntimeHealthAreaStatus {
  const keys = Array.isArray(prefixOrKeys)
    ? prefixOrKeys
    : snapshot.checks.filter((check) => check.key.startsWith(prefixOrKeys)).map((check) => check.key);
  const relevant = snapshot.checks.filter((check) => keys.includes(check.key));
  return {
    status: groupedStatus(relevant.map((check) => check.status)),
    failing_checks: relevant.filter((check) => check.status === "fail").map((check) => check.key),
    warning_checks: relevant.filter((check) => check.status === "warn").map((check) => check.key),
  };
}

export function buildRuntimeHealthDashboard(snapshot: RuntimeHealthSnapshot): RuntimeHealthDashboard {
  return {
    refreshed_at: snapshot.generated_at,
    overall_status: snapshot.overall_status,
    alerting: snapshot.alerting,
    areas: {
      services: buildArea(snapshot, "systemd:"),
      logs: buildArea(snapshot, "log:"),
      backup: buildArea(snapshot, "backup:"),
      webhook: buildArea(snapshot, ["telegram:webhook_info"]),
      ingest: buildArea(snapshot, "ingest:"),
      public_dashboards: buildArea(snapshot, "public:"),
      search_console: buildArea(snapshot, "search_console:"),
    },
  };
}
