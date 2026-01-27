'use client';

import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BrainItem, Status, STATUSES } from '@/lib/types';
import ItemCard from '@/components/ItemCard';
import Filters from '@/components/Filters';
import QuickAdd from '@/components/QuickAdd';

export default function BoardPage() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [project, setProject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (project) params.set('project', project);
    if (category) params.set('category', category);
    if (priority) params.set('priority', priority);
    const res = await fetch(`/api/items?${params}`);
    setItems(await res.json());
  }, [project, category, priority]);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const itemId = result.draggableId;
    const newStatus = result.destination.droppableId as Status;
    const newIndex = result.destination.index;

    // Optimistic update
    setItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (!item) return prev;
      const updated = prev.map((i) => (i.id === itemId ? { ...i, status: newStatus, position: newIndex } : i));
      return updated;
    });

    await fetch(`/api/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, position: newIndex }),
    });
  };

  const columnItems = (status: Status) =>
    items.filter((i) => i.status === status).sort((a, b) => a.position - b.position);

  return (
    <div className="p-5 md:p-8 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Board</h1>
        <Filters
          project={project} category={category} priority={priority}
          onProjectChange={setProject} onCategoryChange={setCategory} onPriorityChange={setPriority}
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUSES.map((s) => (
            <div key={s.value} className="bg-zinc-900/50 rounded-xl p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-400">{s.label}</h2>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{columnItems(s.value).length}</span>
              </div>
              <Droppable droppableId={s.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-800/30' : ''}`}
                  >
                    {columnItems(s.value).map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-80' : ''}
                          >
                            <ItemCard item={item} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <QuickAdd onAdded={load} />
    </div>
  );
}
