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
};

type Group = {
  id: string;
  name: string;
  defaultDuration: number;
  buttons: Record<string, Button>;
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
    set(groupRef, {
      id: groupId,
      name: "New Group",
      defaultDuration: 30,
      buttons: {},
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
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    set(buttonRef, {
      id: buttonId,
      name: `New Button`,
      duration,
      startedAt: null,
      isActive: true,
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

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
      >
        {isEditing ? "Exit Edit Mode" : "Edit Mode"}
      </button>

      {Object.entries(groups).map(([groupId, group]) => (
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

              <button
                onClick={() => handleDeleteGroup(groupId)}
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
              >
                Delete Group
              </button>
            </div>
          ) : (
            <div className="text-lg font-semibold">{group.name}</div>
          )}

          <div className="flex flex-wrap gap-2">
            {group.buttons &&
              Object.entries(group.buttons).map(([buttonId, button]) => (
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
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <TimerButton
                      groupId={groupId}
                      buttonId={buttonId}
                      name={button.name}
                      duration={group.defaultDuration}
                      isActive={button.isActive}
                    />
                  )}
                </div>
              ))}
          </div>

          {isEditing && (
            <button
              onClick={() => handleAddButton(groupId)}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              + Add Button
            </button>
          )}
        </div>
      ))}

      {isEditing && (
        <button
          onClick={handleAddGroup}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Add Group
        </button>
      )}
    </div>
  );
};

export default GroupsContainer;
