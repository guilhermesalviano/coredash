"use client";

import { useStatus } from "@/contexts/statusContext";
import { format } from "date-fns";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import storage from "@/lib/storage";
import Card from "../card";
import { useDayChange } from "@/hooks/useDayChange";

const HabitTracker = () => {
  const [streakState, setStreakState] = useState(0);
  const [weekDaysMap, setWeekDaysMap] = useState<Object>();
  const [questionToday, setQuestionToday] = useState(false);
  const [noToday, setNoToday] = useState(false);
  const { reportStatus } = useStatus();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const handleNo = () => {
    storage.set("habitNoToday", todayStr);
    setNoToday(true);
    setQuestionToday(true);
  };

  const track = async (answer: string) => {
    const habit = { habit: answer };

    await fetch("/api/habit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(habit),
    });

    fetchHabit();
    setQuestionToday(!!answer);
    storage.set("habitToday", todayStr);
  }

  const fetchHabit = useCallback(async () => {
    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    console.log("[log]: a new habit fetch.");

    try {
      const res = await fetch("/api/habit");
      if (!res.ok) throw new Error(`Erro do servidor: ${res.status}`);

      const data = await res.json();
      const { streak, lastDayOfWeek } = data.data;

      reportStatus("habit", "success");
      if (todayStr.split("T")[0] !== lastDayOfWeek.split("T")[0]) return;

      setStreakState(streak);
      setQuestionToday(true);

      if (lastDayOfWeek) {
        const lastDayOfWeekNumber = new Date(lastDayOfWeek).getUTCDay();

        const weekDaysMapLocal = Object.fromEntries(
          DAYS_OF_WEEK.map((day, i) => [
            day,
            i <= lastDayOfWeekNumber && i > lastDayOfWeekNumber - streak,
          ])
        );

        setWeekDaysMap(weekDaysMapLocal);
      }
    } catch {
      reportStatus("habit", "error");
    }
  }, [todayStr]);

  useEffect(() => {
    const noTodayStored = storage.get("habitNoToday");
    const todayStored = storage.get("habitToday");
    if (noTodayStored === todayStr) {
      setNoToday(true);
      setQuestionToday(true);
      reportStatus("habit", "success");
      return;
    } else if (todayStored === todayStr){
      setQuestionToday(true);
    }

    fetchHabit();
  }, []);

  useDayChange((newDay) => {
    console.log(`Day changed to ${newDay}, fetching habit.`);
    fetchHabit();
  });

  return (
    <Card className="flex justify-center flex-col items-center">
      {!questionToday ? (
        <div className="flex flex-col justify-center items-center gap-4">
          <Image src="/joey-friends.gif" width={200} height={200} alt="joey" unoptimized />
          <h2 className="text-2xl">Did you wake up early today???</h2>
          <div className="flex gap-8">
            <button
              onClick={() => {track("wakedup")}}
              className="bg-orange-500 hover:bg-orange-600 cursor-pointer text-white rounded-xs px-4! py-2!">
              Yess!
            </button>
            <button
              onClick={handleNo} 
              className="border border-orange-500 hover:bg-orange-500 cursor-pointer hover:text-white rounded-xs px-4! py-2!">
              No :(
            </button>
          </div>
        </div>
      ) : (
        <>
          {noToday ? (
            <div className="flex flex-col justify-center text-center items-center gap-2 py-2!">
              {Number(format(today, "HH")) >= 22 ? (
                <>
                  <Image src="/sleep-cat.gif" width={200} height={200} alt="sleepy" unoptimized />
                  <h2 className="text-2xl">{format(today, "HH")}h? Bedtime, baby!</h2>
                  <p className="text-gray-400">
                    If it's not done by {format(today, "HH")}h, just sleep and finish it tomorrow.
                  </p>
                </>
              ) : (
                <>
                  <Image src="/dog-falling.gif" width={100} height={100} alt="sleepy" unoptimized />
                  <h2 className="text-xl">The shrimp that snoozes gets swept away by the tide.</h2>
                </>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-2xl py-2!">Days waking up early</h2>
              <Image src="/flame.png" width="60" height="60" alt="flame" unoptimized />
              <h2 className="text-4xl">{streakState}</h2>
              <p className="text-xl">Day streak</p>
              <div className="week flex gap-4 pt-4!">
                {weekDaysMap && Object.entries(weekDaysMap).reverse().map(([day, value]) => {
                  return (
                    <span key={day} className="flex flex-col justify-center items-center gap-2">
                      <div className="flex justify-center">
                        {value ? (
                          <div className="flex items-center justify-center bg-orange-500 border border-orange-500 rounded-full w-6 h-6">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path 
                                d="M3 8.5L6 11.5L13 4.5" 
                                stroke="white" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex w-6 h-6 border border-orange-500 rounded-full" />
                        )}
                      </div>
                      {day.slice(0, 3)}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default HabitTracker;