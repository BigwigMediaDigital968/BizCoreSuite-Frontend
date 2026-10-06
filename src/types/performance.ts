export type PerformanceViewMode = "INDIVIDUAL" | "TEAM" | "BRANCH" | "";

export interface PerformanceQuery {
  viewMode?: PerformanceViewMode;
  targetUserId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PerformanceScope {
  viewMode: "INDIVIDUAL" | "TEAM" | "BRANCH";
  targetUser?: { id: string; name: string; role: string };
  teamSize?: number;
  branchId?: string;
  activeUsersCount?: number;
}

export interface PerformancePeriod {
  startDate: string;
  endDate: string;
}

export interface PerformanceMetrics {
  leads: {
    totalAssigned: number;
    statusCounts: Record<string, number>;
  };
  calls: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    totalDurationSeconds: number;
    avgDurationSeconds: number;
  };
  tasks: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  };
  attendance: {
    totalLogs: number;
    daysPresent: number;
    totalLateMinutes: number;
    totalWorkingMinutes: number;
  };
}

export interface PerformanceReport {
  scope: PerformanceScope;
  period: PerformancePeriod;
  metrics: PerformanceMetrics;
}