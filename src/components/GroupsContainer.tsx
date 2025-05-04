import React, { useEffect, useState } from "react";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db } from "../firebase";
import TimerButton from "./TimerButton";
import { v4 as uuidv4 } from "uuid";

type Button = {
  id: string;
  name: string;
  duration: number;
  startedAt: number | null;
  isActive: boolean;
  originalIndex?: number;
  order?: number;
};

type Group = {
  id: string;
  name: string;
  defaultDuration: number;
  buttons: Record<string, Button>;
  order?: number;
};

const GroupsContainer: React.FC = () => {
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const groupsRef = ref(db, "groups");
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroups(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddGroup = () => {
    const groupId = uuidv4();
    const groupRef = ref(db, `groups/${groupId}`);
    const order = Object.keys(groups).length;
    set(groupRef, {
      id: groupId,
      name: "New Group",
      defaultDuration: 30,
      buttons: {},
      order,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupRef = ref(db, `groups/${groupId}`);
    remove(groupRef);
  };

  const handleGroupNameChange = (groupId: string, newName: string) => {
    update(ref(db, `groups/${groupId}`), { name: newName });
  };

  const handleDurationChange = (groupId: string, newDuration: number) => {
    const groupRef = ref(db, `groups/${groupId}`);
    update(groupRef, { defaultDuration: newDuration });

    const buttons = groups[groupId]?.buttons || {};
    Object.keys(buttons).forEach((buttonId) => {
      const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
      update(buttonRef, { duration: newDuration });
    });
  };

  const handleAddButton = (groupId: string) => {
    const buttonId = uuidv4();
    const duration = groups[groupId]?.defaultDuration || 30;
    const index = Object.keys(groups[groupId]?.buttons || {}).length;
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    set(buttonRef, {
      id: buttonId,
      name: `New Button`,
      duration,
      startedAt: null,
      isActive: true,
      originalIndex: index,
      order: index,
    });
  };

  const handleDeleteButton = (groupId: string, buttonId: string) => {
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    remove(buttonRef);
  };

  const handleButtonNameChange = (
    groupId: string,
    buttonId: string,
    newName: string
  ) => {
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    update(buttonRef, { name: newName });
  };

  const handleDisable = (groupId: string, buttonId: string) => {
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    update(buttonRef, { isActive: false });
  };

  const handleRestore = (groupId: string, buttonId: string) => {
    const button = groups[groupId]?.buttons[buttonId];
    const originalIndex = button?.originalIndex ?? 0;
    const updatedButtons = Object.entries(groups[groupId]?.buttons || {})
      .filter(([id]) => id !== buttonId)
      .sort(([, a], [, b]) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

    updatedButtons.splice(originalIndex, 0, [buttonId, { ...button, isActive: true }]);

    const newButtons = Object.fromEntries(updatedButtons);
    update(ref(db, `groups/${groupId}`), { buttons: newButtons });
  };

  const moveButton = (groupId: string, buttonId: string, direction: "up" | "down") => {
    const groupButtons = groups[groupId]?.buttons;
    if (!groupButtons) return;

    const sorted = Object.entries(groupButtons).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    const index = sorted.findIndex(([id]) => id === buttonId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const [currentId, currentBtn] = sorted[index];
    const [targetId, targetBtn] = sorted[targetIndex];

    const currentRef = ref(db, `groups/${groupId}/buttons/${currentId}`);
    const targetRef = ref(db, `groups/${groupId}/buttons/${targetId}`);

    update(currentRef, { order: targetBtn.order });
    update(targetRef, { order: currentBtn.order });
  };

  const moveGroup = (groupId: string, direction: "up" | "down") => {
    const sorted = Object.entries(groups).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    const index = sorted.findIndex(([id]) => id === groupId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const [currentId, currentGroup] = sorted[index];
    const [targetId, targetGroup] = sorted[targetIndex];

    update(ref(db, `groups/${currentId}`), { order: targetGroup.order });
    update(ref(db, `groups/${targetId}`), { order: currentGroup.order });
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
      >
        {isEditing ? "Exit Edit Mode" : "Edit Mode"}
      </button>

      {Object.entries(groups)
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([groupId, group]) => (
          <div key={groupId} className="border rounded p-3 shadow space-y-2">
            {isEditing ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  className="text-lg font-semibold border-b outline-none flex-1 mr-2"
                  value={group.name}
                  onChange={(e) => handleGroupNameChange(groupId, e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm">Duration:</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 border px-1 py-0.5 rounded text-sm"
                    value={Math.floor(group.defaultDuration / 60)}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value) || 0;
                      const seconds = group.defaultDuration % 60;
                      handleDurationChange(groupId, minutes * 60 + seconds);
                    }}
                  />
                  <span className="text-sm">min</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className="w-16 border px-1 py-0.5 rounded text-sm"
                    value={group.defaultDuration % 60}
                    onChange={(e) => {
                      const seconds = parseInt(e.target.value) || 0;
                      const minutes = Math.floor(group.defaultDuration / 60);
                      handleDurationChange(groupId, minutes * 60 + seconds);
                    }}
                  />
                  <span className="text-sm text-gray-600">sec</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveGroup(groupId, "up")}
                    className="bg-gray-300 hover:bg-gray-400 text-xs px-2 py-1 rounded"
                  >↑</button>
                  <button
                    onClick={() => moveGroup(groupId, "down")}
                    className="bg-gray-300 hover:bg-gray-400 text-xs px-2 py-1 rounded"
                  >↓</button>
                  <button
                    onClick={() => handleDeleteGroup(groupId)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                  >Delete Group</button>
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">{group.name}</div>
            )}

            <div className="flex flex-wrap gap-2">
              {group.buttons &&
                Object.entries(group.buttons)
                  .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
                  .map(([buttonId, button]) => (
                    <div key={buttonId} className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            className="text-sm border px-2 py-1 rounded"
                            value={button.name}
                            onChange={(e) =>
                              handleButtonNameChange(groupId, buttonId, e.target.value)
                            }
                          />                    
                          <button
                            onClick={() => handleDeleteButton(groupId, buttonId)}
                            className="bg-red-400 hover:bg-red-500 text-white text-xs px-2 py-1 rounded"
                          >×</button>
                        </>
                      ) : (
                        <>
                          <TimerButton
                            groupId={groupId}
                            buttonId={buttonId}
                            name={button.name}
                            duration={group.defaultDuration}
                            isActive={button.isActive}
                          />
                          
                        </>
                      )}
                    </div>
                  ))}
            </div>

            {isEditing && (
              <button
                onClick={() => handleAddButton(groupId)}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >+ Add Button</button>
            )}
          </div>
        ))}

      {isEditing && (
        <button
          onClick={handleAddGroup}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >+ Add Group</button>
      )}
    </div>
  );
};

export default GroupsContainer;