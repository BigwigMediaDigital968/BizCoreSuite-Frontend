// PerformancePage.tsx
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import ManagementDashboard from "./ManagementDashboard";
import ExecutiveDashboard from "./ExecutiveDashboard";

const PerformancePage = () => {
  const user = useAuthStore((s) => s.user);

  const isExecutive = user?.role === ROLES.HEAD || user?.role === ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {isExecutive ? (
        <ManagementDashboard />
      ) : (
        <ExecutiveDashboard/>
      )}
    </div>
  );
};

export default PerformancePage;