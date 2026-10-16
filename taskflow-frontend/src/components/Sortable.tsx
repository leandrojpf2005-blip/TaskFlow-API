import type { HTMLAttributes, ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** Spread on the element you hold to drag (the "handle"). */
export interface DragHandle {
  ref: (el: HTMLElement | null) => void;
  props: HTMLAttributes<HTMLElement>;
}

const lockX: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/**
 * A vertical list you reorder by holding an item and dragging it, like
 * Strong. Touch needs a short hold first so the page still scrolls; mouse
 * drags after a few pixels; keyboard works too (space, arrows, space).
 */
export function SortableList<T>({
  items,
  idOf,
  onMove,
  holdMs = 260,
  className = "",
  children,
}: {
  items: T[];
  idOf: (item: T) => string;
  onMove: (from: number, to: number) => void;
  holdMs?: number;
  className?: string;
  children: (item: T, handle: DragHandle, dragging: boolean) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: holdMs, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(idOf);
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[lockX]}
      onDragStart={() => navigator.vibrate?.(12)}
      onDragEnd={end}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={idOf(item)} id={idOf(item)} className={className}>
            {(handle, dragging) => children(item, handle, dragging)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: (handle: DragHandle, dragging: boolean) => ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`sortable ${className}${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children({ ref: setActivatorNodeRef, props: { ...attributes, ...listeners } as HTMLAttributes<HTMLElement> }, isDragging)}
    </div>
  );
}
