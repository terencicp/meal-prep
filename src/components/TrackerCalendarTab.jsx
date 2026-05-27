import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TrackerCalendarTab({
  trackerHistory,
  onBack,
  currentPrepDateKey,
  currentPrepSummary,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  const year = currentDate.getFullYear();

  const getDayData = (day) => {
    const dateKey = `${year}-${String(currentDate.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    if (dateKey === currentPrepDateKey) {
      return currentPrepSummary;
    }

    return trackerHistory[dateKey] || null;
  };

  const days = [];
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const calculateLast30DaysPercentage = () => {
    let sumPercentages = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${dayStr}`;

      const data =
        dateKey === currentPrepDateKey
          ? currentPrepSummary
          : trackerHistory[dateKey];
      if (data && data.completionPercentage) {
        sumPercentages += data.completionPercentage;
      }
    }
    return Math.round(sumPercentages / 30);
  };

  const calculateStreak = () => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${dayStr}`;

      const data =
        dateKey === currentPrepDateKey
          ? currentPrepSummary
          : trackerHistory[dateKey];
      if (data && (data.completionPercentage || 0) > 0) {
        streak++;
      } else if (i > 0) {
        break; // Stop if not today and no data
      } else if (i === 0) {
        // if today is 0%, just don't break yet, streak could carry from yesterday
      }
    }
    return streak;
  };

  const last30DaysPercent = calculateLast30DaysPercentage();
  const streak = calculateStreak();

  const isCurrentMonth = () => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className='w-full max-w-116 mx-auto px-3 sm:px-0'>
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-black text-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-4 border-black uppercase'>
          <h3 className='text-sm font-black tracking-wide text-[#FFD600] mb-1'>
            Streak
          </h3>
          <div className='text-4xl font-black'>
            {streak}
            <span className='text-2xl text-white ml-1'>D</span>
          </div>
        </div>
        <div className='bg-[#FFD600] text-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-4 border-black uppercase'>
          <h3 className='text-sm font-black tracking-wide mb-1'>
            Last 30 Days
          </h3>
          <div className='text-4xl font-black'>
            {last30DaysPercent}
            <span className='text-2xl ml-1'>%</span>
          </div>
        </div>
      </div>

      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6'>
        <div className='flex justify-between items-center mb-6'>
          <button
            onClick={prevMonth}
            className='p-1 border-[4px] border-black hover:bg-gray-100'
          >
            <ChevronLeft className='w-6 h-6' strokeWidth={4} />
          </button>
          <h2 className='text-xl font-black uppercase tracking-wide'>
            {monthName} {year}
          </h2>
          {isCurrentMonth() ? (
            <div className='w-8 h-8'></div>
          ) : (
            <button
              onClick={nextMonth}
              className='p-1 border-[4px] border-black hover:bg-gray-100'
            >
              <ChevronRight className='w-6 h-6' strokeWidth={4} />
            </button>
          )}
        </div>

        <div className='grid grid-cols-7 gap-2 mb-2'>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className='text-center font-black py-2'>
              {day}
            </div>
          ))}
        </div>

        <div className='grid grid-cols-7 gap-2'>
          {days.map((day, i) => {
            if (!day) return <div key={i}></div>;
            const data = getDayData(day);
            const percent = data ? data.completionPercentage || 0 : 0;
            const hasMeals = data ? (data.totalItems || 0) > 0 : false;

            const currentDayDate = new Date(year, currentDate.getMonth(), day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPastDay = currentDayDate < today;
            const isToday = currentDayDate.getTime() === today.getTime();

            // "The border is black for streak days. Past days with no checked meals are gray."
            const isStreakDay = percent > 0;

            let textColor = "text-black";
            if (isPastDay && percent === 0) {
              textColor = "text-gray-400";
            }

            return (
              <div
                key={i}
                className={`relative aspect-square flex items-center justify-center font-black text-lg ${
                  isStreakDay ? "border-4 border-black" : ""
                } ${textColor}`}
                style={{
                  background:
                    percent > 0
                      ? `conic-gradient(#FFD600 ${percent}%, transparent 0)`
                      : "transparent",
                }}
              >
                <span className='z-10 leading-none'>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className='mt-8 text-center text-xs font-semibold text-gray-400'>
        v0.4.3
      </div>
    </div>
  );
}
