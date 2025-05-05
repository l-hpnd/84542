import React, { useEffect, useState } from "react";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db } from "../firebase";
import TimerButton from "./TimerButton";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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

// ✅ Компонент для drag-and-drop групп
const SortableGroupItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const SortableButtonItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
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

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const entries = Object.entries(groups);
    const sorted = entries.sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

    const oldIndex = sorted.findIndex(([id]) => id === active.id);
    const newIndex = sorted.findIndex(([id]) => id === over.id);

    const newOrder = arrayMove(sorted, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newOrder.forEach(([id], index) => {
      updates[`groups/${id}/order`] = index;
    });

    update(ref(db), updates).catch(console.error);
  };

  const handleButtonDragEnd = (groupId: string) => (event: DragEndEvent) => {
    if (!isEditing) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = groups[groupId];
    if (!group || !group.buttons) return;

    const entries = Object.entries(group.buttons);
    const sorted = entries.sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    const oldIndex = sorted.findIndex(([id]) => id === active.id);
    const newIndex = sorted.findIndex(([id]) => id === over.id);
    const newOrder = arrayMove(sorted, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newOrder.forEach(([id], index) => {
      updates[`groups/${groupId}/buttons/${id}/order`] = index;
    });

    update(ref(db), updates).catch(console.error);
  };

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

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
      >
        {isEditing ? "Exit Edit Mode" : "Edit Mode"}
      </button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={Object.keys(groups).sort((a, b) => (groups[a].order ?? 0) - (groups[b].order ?? 0))}
          strategy={verticalListSortingStrategy}
        >
          {Object.entries(groups)
            .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
            .map(([groupId, group]) => (
              <SortableGroupItem key={groupId} id={groupId}>
                <div className="border rounded p-3 shadow space-y-2 bg-white">
                  {isEditing ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        className="text-lg font-semibold border-b outline-none flex-1 mr-2"
                        value={group.name}
                        onChange={(e) =>
                          handleGroupNameChange(groupId, e.target.value)
                        }
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

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleButtonDragEnd(groupId)}
                  >
                    <SortableContext
                      items={Object.keys(group.buttons || {})}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-2">
                        {group.buttons &&
                          Object.entries(group.buttons)
                            .sort(([, a], [, b]) => {
                              if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                              return (a.order ?? 0) - (b.order ?? 0);
                            })
                            .map(([buttonId, button]) => (
                              <SortableButtonItem key={buttonId} id={buttonId}>
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <input
                                        className="text-sm border px-2 py-1 rounded"
                                        value={button.name}
                                        onChange={(e) =>
                                          handleButtonNameChange(
                                            groupId,
                                            buttonId,
                                            e.target.value
                                          )
                                        }
                                      />
                                      <button
                                        onClick={() =>
                                          handleDeleteButton(groupId, buttonId)
                                        }
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
                              </SortableButtonItem>
                            ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {isEditing && (
                    <button
                      onClick={() => handleAddButton(groupId)}
                      className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      + Add Button
                    </button>
                  )}
                </div>
              </SortableGroupItem>
            ))}
        </SortableContext>
      </DndContext>

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