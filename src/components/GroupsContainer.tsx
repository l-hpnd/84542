import React, { useEffect, useState } from "react";
import { ref, onValue, push, update } from "firebase/database";
import { db } from "../firebase";
import TimerButton from "./TimerButton";

interface ButtonData {
  name: string;
  duration: number;
  isActive: boolean;
  originalIndex: number;
}

interface GroupData {
  name: string;
  buttons: Record<string, ButtonData>;
}

const GroupsContainer: React.FC = () => {
  const [groups, setGroups] = useState<Record<string, GroupData>>({});

  // Слушаем все группы и кнопки
  useEffect(() => {
    const groupsRef = ref(db, "groups");
    return onValue(groupsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGroups(data);
    });
  }, []);

  const addButton = (groupId: string) => {
    const group = groups[groupId];
    if (!group) return;

    const buttonsArray = Object.entries(group.buttons || {});
    const originalIndex = buttonsArray.length;

    const newButtonRef = push(ref(db, `groups/${groupId}/buttons`));
    update(newButtonRef, {
      name: `New ${originalIndex + 1}`,
      duration: 60,
      isActive: true,
      originalIndex,
    });
  };

  return (
    <div className="p-4">
      {Object.entries(groups).map(([groupId, group]) => (
        <div key={groupId} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <button
              onClick={() => addButton(groupId)}
              className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
            >
              + Add Button
            </button>
          </div>

          <div className="flex flex-wrap">
            {group.buttons &&
              Object.entries(group.buttons)
                .sort(([_, a], [__, b]) => {
                  if (a.isActive === b.isActive) {
                    return (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
                  }
                  return a.isActive ? -1 : 1;
                })
                .map(([buttonId, buttonData]) => (
                  <TimerButton
                    key={buttonId}
                    groupId={groupId}
                    buttonId={buttonId}
                    name={buttonData.name}
                    duration={buttonData.duration}
                    isActive={buttonData.isActive}
                  />
                ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupsContainer;
