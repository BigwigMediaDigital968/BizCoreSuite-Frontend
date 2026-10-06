import { Navigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/types/auth";
import EmployeeAttendancePage from "./EmployeeAttendancePage";

/**
 * `/attendance` means "my own attendance", which only Manager and Employee
 * have — Head and Admin don't punch in, so they get the org-wide report
 * instead. Keeps old links to /attendance working for every role.
 */
export const AttendanceDispatcher = () => {
    const user = useAuthStore((s) => s.user);

    const isExecutive = user?.role === ROLES.HEAD || user?.role === ROLES.ADMIN;

    if (isExecutive) {
        return <Navigate to="/attendance/report" replace />;
    }

    return (
        <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6">
            <EmployeeAttendancePage />
        </div>
    );
};
