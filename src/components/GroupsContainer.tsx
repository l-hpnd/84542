import React, { useEffect, useState } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
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
  originalIndex: number;
}

const GroupsContainer: React.FC = () => {
  const [groups, setGroups] = useState<Record<string, GroupData>>({});
  const [isEditMode, setIsEditMode] = useState(false);

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

  const moveButton = (groupId: string, buttonId: string, direction: "up" | "down") => {
    const buttons = Object.entries(groups[groupId]?.buttons || {})
      .filter(([_, b]) => b.isActive)
      .sort(([, a], [, b]) => a.originalIndex - b.originalIndex);

    const index = buttons.findIndex(([id]) => id === buttonId);
    const swapWith = direction === "up" ? index - 1 : index + 1;

    if (index === -1 || swapWith < 0 || swapWith >= buttons.length) return;

    const [currId, currBtn] = buttons[index];
    const [swapId, swapBtn] = buttons[swapWith];

    update(ref(db), {
      [`groups/${groupId}/buttons/${currId}/originalIndex`]: swapBtn.originalIndex,
      [`groups/${groupId}/buttons/${swapId}/originalIndex`]: currBtn.originalIndex,
    });
  };

  {isEditMode && (
  <button
    onClick={addGroup}
    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
  >
    + Группа
  </button>
)};
const moveGroup = (groupId: string, direction: "up" | "down") => {
    const sortedGroups = Object.entries(groups).sort(
      ([, a], [, b]) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0)
    );

    const index = sortedGroups.findIndex(([id]) => id === groupId);
    const swapWith = direction === "up" ? index - 1 : index + 1;

    if (index === -1 || swapWith < 0 || swapWith >= sortedGroups.length) return;

    const [currId, currGroup] = sortedGroups[index];
    const [swapId, swapGroup] = sortedGroups[swapWith];

    update(ref(db), {
      [`groups/${currId}/originalIndex`]: swapGroup.originalIndex,
      [`groups/${swapId}/originalIndex`]: currGroup.originalIndex,
    });
  };

  const updateGroupName = (groupId: string, name: string) => {
    update(ref(db, `groups/${groupId}`), { name });
  };

  const sortedGroups = Object.entries(groups).sort(
    ([, a], [, b]) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0)
  );

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => setIsEditMode((prev) => !prev)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {isEditMode ? "Готово" : "Редактировать"}
        </button>
      </div>

      {sortedGroups.map(([groupId, group], groupIdx) => (
        <div key={groupId} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              {isEditMode ? (
                <input
                  value={group.name}
                  onChange={(e) => updateGroupName(groupId, e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              ) : (
                <h2 className="text-lg font-semibold">{group.name}</h2>
              )}
              {isEditMode && (
                <>
                  <button onClick={() => moveGroup(groupId, "up")}>▲</button>
                  <button onClick={() => moveGroup(groupId, "down")}>▼</button>
                </>
              )}
            </div>
            {isEditMode && (
              <button
                onClick={() => addButton(groupId)}
                className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
              >
                + Кнопка
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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
                    isEditMode={isEditMode}
                    onMove={(dir) => moveButton(groupId, buttonId, dir)}
                  />
                ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupsContainer;