import React from "react";

interface DashboardSkeletonProps {
  /** Number of top metric/KPI cards to render (default: 4) */
  kpiCount?: number;
  /** Number of table rows to simulate (default: 5) */
  tableRowCount?: number;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  kpiCount = 4,
  tableRowCount = 5,
}) => {
  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse select-none">
      
      {/* 1. Header & Actions Bar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {/* Subtitle / Tag */}
          <div className="h-3 w-28 bg-surface-container-high rounded-md" />
          {/* Main Title */}
          <div className="h-8 w-60 bg-surface-container-high rounded-xl" />
          {/* Description line */}
          <div className="h-4 w-80 max-w-full bg-surface-container-high/60 rounded-md" />
        </div>

        {/* Action Button Placeholder */}
        <div className="h-11 w-36 bg-surface-container-high rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. KPI / Metrics Cards Grid Skeleton */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(
          kpiCount,
          4
        )} gap-4`}
      >
        {Array.from({ length: kpiCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm space-y-3"
          >
            {/* Card Label */}
            <div className="h-3 w-20 bg-surface-container-high rounded-md" />
            {/* Value Stat */}
            <div className="h-8 w-24 bg-surface-container-high rounded-lg" />
            {/* Subtext / Badge */}
            <div className="h-3 w-28 bg-surface-container-high/60 rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Main Dashboard Content Area (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Chart / Primary Table) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Primary Feature Block (e.g., Hero Chart or Target Card) */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-surface-container-high rounded-md" />
              <div className="h-4 w-20 bg-surface-container-high/60 rounded-md" />
            </div>
            {/* Large Content Placeholder (Chart / Visual Box) */}
            <div className="h-48 w-full bg-surface-container-low rounded-xl" />
          </div>

          {/* Table Skeleton */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
            {/* Table Header */}
            <div className="border-b border-outline-variant/30 bg-surface-container-low/40 p-4 flex items-center justify-between">
              <div className="h-4 w-32 bg-surface-container-high rounded-md" />
              <div className="h-8 w-24 bg-surface-container-high rounded-lg" />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-outline-variant/20 p-4 space-y-4">
              {Array.from({ length: tableRowCount }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center justify-between pt-3 first:pt-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-surface-container-high shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-surface-container-high rounded-md" />
                      <div className="h-2.5 w-20 bg-surface-container-high/60 rounded-md" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-surface-container-high rounded-md" />
                  <div className="h-6 w-20 bg-surface-container-high rounded-full hidden sm:block" />
                  <div className="h-8 w-8 bg-surface-container-high rounded-lg" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Widget Sidebar / Feed) */}
        <div className="space-y-6">
          
          {/* Quick Note / Banner Widget Skeleton */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-surface-container-high rounded-md" />
              <div className="h-4 w-12 bg-surface-container-high/60 rounded-md" />
            </div>
            <div className="h-20 w-full bg-surface-container-low rounded-xl" />
          </div>

          {/* Activity / List Feed Widget Skeleton */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4">
            <div className="h-5 w-28 bg-surface-container-high rounded-md" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, listIndex) => (
                <div key={listIndex} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-surface-container-high shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-surface-container-high rounded-md" />
                      <div className="h-2.5 w-12 bg-surface-container-high/60 rounded-md" />
                    </div>
                    <div className="h-3 w-full bg-surface-container-high/60 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardSkeleton;