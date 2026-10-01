import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="w-7 h-7 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-7 w-28 bg-gray-200 rounded-lg" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Queue Cards Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-44 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <div className="h-6 w-16 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 bg-gray-50 rounded-lg border border-gray-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
