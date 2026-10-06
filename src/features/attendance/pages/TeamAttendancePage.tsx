import TeamAttendanceTab from "../components/TeamAttendanceTab";
import RefreshButton from "@/components/ui/RefreshButton";
import { attendanceKeys } from "../hooks/useAttendance";

export const TeamAttendancePage = () => (
  <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <p className="font-label-sm text-xs font-bold uppercase tracking-widest text-primary/80">
            Team Reporting
          </p>
          <h1 className="font-headline-md text-3xl font-bold text-on-surface mt-0.5">
            Team Attendance
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Daily punches and summary totals for the employees reporting into
            your branch.
          </p>
        </div>

        <RefreshButton queryKey={attendanceKeys.all} />
      </div>

      <TeamAttendanceTab />
    </div>
  </div>
);

export default TeamAttendancePage;
