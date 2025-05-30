import React, { useEffect, useState } from "react";
import { ref, update, onValue, get } from "firebase/database";
import { db } from "../firebase";
import classNames from "classnames";

interface TimerButtonProps {
  groupId: string;
  buttonId: string;
  name: string;
  duration: number;
  isActive: boolean;
}

const TimerButton: React.FC<TimerButtonProps> = ({
  groupId,
  buttonId,
  name,
  duration,
  isActive,
}) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);

  useEffect(() => {
    const unsubscribe = onValue(buttonRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.startedAt && data.duration) {
        const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
        const remaining = data.duration - elapsed;
        if (remaining > 0) {
          setStartedAt(data.startedAt);
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          setStartedAt(null);
          setTimeLeft(data.duration);
          setIsRunning(false);
        }
      } else {
        setStartedAt(null);
        setTimeLeft(duration);
        setIsRunning(false);
      }
    });

    return () => unsubscribe();
  }, [buttonId, groupId]);

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = duration - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
      setIsRunning(remaining > 0);

      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration]);

  const handleStart = () => {
    if (!isRunning) {
      update(buttonRef, {
        startedAt: Date.now(),
        duration,
        isActive: true,
      });
    }
  };

 const handleReset = async () => {
  try {
    const snapshot = await get(buttonRef);
    const data = snapshot.val();
    const originalOrder = data?.originalOrder ?? 0;

    if (!data?.isActive) {
      await update(buttonRef, {
        startedAt: null,
        isActive: true,
        order: originalOrder,
      });
    } else {
      await update(buttonRef, {
        startedAt: null,
      });
    }

    setStartedAt(null);
    setTimeLeft(duration);
    setIsRunning(false);
  } catch (error) {
    console.error("Ошибка при сбросе:", error);
  }
};


  const handleDisable = () => {
    update(buttonRef, {
      isActive: false,
      startedAt: null,
    });
  };

  const buttonColor = !isActive
    ? "bg-gray-400"
    : isRunning
    ? "bg-red-500"
    : "bg-green-500";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-xs m-1 w-28">
      <button
        onClick={handleStart}
        disabled={!isActive}
        className={classNames(
          "text-white font-semibold px-2 py-1 rounded w-full h-12 text-sm leading-none text-center flex items-center justify-center whitespace-normal break-words",
          buttonColor
        )}
      >
        {name}
      </button>
      <div className="text-[12px] font-semibold">{formatTime(timeLeft)}</div>
      <div className="flex gap-1 mt-1">
        <button
          onClick={handleReset}
          className="bg-blue-400 hover:bg-blue-500 text-white px-1 py-0.5 rounded text-[10px]"
        >
          Reset
        </button>
        <button
          onClick={handleDisable}
          className="bg-gray-600 hover:bg-gray-700 text-white px-1 py-0.5 rounded text-[10px]"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default TimerButton;
