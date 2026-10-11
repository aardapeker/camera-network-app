import { Server, Network, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { SocketType, socketIcons, socketColors } from "./icons";
import { useTranslation } from "react-i18next";
import { useTypeLabels } from "~/hooks/use-type-labels";

interface ChildSocket {
  id: string;
  name: string;
  type: SocketType;
  note?: string | null;
}

interface WorkstationDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workstationName: string;
  workstationNote?: string | null;
  childSockets: ChildSocket[];
  isEditable?: boolean;
  onRemoveSocket?: (socketId: string) => void;
  onUpdateSocketName?: (socketId: string, name: string) => void;
  onUpdateSocketNote?: (socketId: string, name: string) => void;
  onUpdateWorkstationName?: (name: string) => void;
  onUpdateWorkstationNote?: (note: string) => void;
  onReorderSockets?: (orderedSocketIds: string[]) => void;
}

function SortableSocketItem({
  socket,
  isEditable,
  onRemoveSocket,
  onUpdateSocketName,
  onUpdateSocketNote,
}: {
  socket: ChildSocket;
  isEditable: boolean;
  onRemoveSocket?: (socketId: string) => void;
  onUpdateSocketName?: (socketId: string, name: string) => void;
  onUpdateSocketNote?: (socketId: string, note: string) => void;
}) {
  const { t } = useTranslation();
  const { socketLabels } = useTypeLabels();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: socket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const SocketIcon = socketIcons[socket.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-card rounded-lg border hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {isEditable && (
          <button
            className="mt-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div
          className="p-2 rounded-md shrink-0"
          style={{
            backgroundColor: `${socketColors[socket.type]}15`,
          }}
        >
          <SocketIcon
            className="h-5 w-5"
            style={{ color: socketColors[socket.type] }}
          />
        </div>
        <div className="flex-1 min-w-0">
          {isEditable ? (
            <input
              type="text"
              value={socket.name || ""}
              onChange={(e) =>
                onUpdateSocketName?.(socket.id, e.target.value)
              }
              className="w-full bg-transparent font-medium text-sm border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
            />
          ) : (
            <p className="font-medium text-sm truncate">
              {socket.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {socketLabels[socket.type]}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("editor.noteColon")}
            </span>
            {isEditable ? (
              <input
                type="text"
                value={socket.note || ""}
                onChange={(e) =>
                  onUpdateSocketNote?.(
                    socket.id,
                    e.target.value,
                  )
                }
                className="w-full bg-transparent font-medium text-sm border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              />
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded p-1.5 line-clamp-2">
                {socket.note}
              </p>
            )}
          </div>
        </div>
        {isEditable && onRemoveSocket && (
          <button
            onClick={() => onRemoveSocket(socket.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title={t("editor.removeFromCabinet")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkstationDetailDrawer({
  open,
  onOpenChange,
  workstationName,
  workstationNote,
  childSockets,
  isEditable = false,
  onRemoveSocket,
  onUpdateSocketName,
  onUpdateSocketNote,
  onUpdateWorkstationName,
  onUpdateWorkstationNote,
  onReorderSockets,
}: WorkstationDetailDrawerProps) {
  const { t } = useTranslation();
  const { socketLabels } = useTypeLabels();
  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = childSockets.findIndex((s) => s.id === active.id);
    const newIndex = childSockets.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(childSockets, oldIndex, newIndex);
    onReorderSockets?.(reordered.map((s) => s.id));
  };

  // Group devices by type for summary
  const socketsByType = childSockets.reduce(
    (acc, socket) => {
      if (!acc[socket.type]) {
        acc[socket.type] = [];
      }
      acc[socket.type].push(socket);
      return acc;
    },
    {} as Record<SocketType, ChildSocket[]>,
  );

  const socketTypes = Object.keys(socketsByType) as SocketType[];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-[400px] sm:max-w-[400px] z-9999">
        <DrawerHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Server className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditable ? (
                <>
                  <DrawerTitle className="sr-only">
                    {workstationName}
                  </DrawerTitle>
                  <input
                    type="text"
                    value={workstationName}
                    onChange={(e) => onUpdateWorkstationName?.(e.target.value)}
                    className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </>
              ) : (
                <DrawerTitle className="text-lg truncate">
                  {workstationName}
                </DrawerTitle>
              )}
              <DrawerDescription>
                {t("editor.socketsInside", { count: childSockets.length })}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button className="p-2 rounded-md hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
          {isEditable ? (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">{t("editor.note")}</label>
              <textarea
                value={workstationNote || ""}
                onChange={(e) => onUpdateWorkstationNote?.(e.target.value)}
                placeholder={t("editor.addNote")}
                rows={2}
                className="w-full mt-1 text-sm bg-muted/50 rounded-md p-2 border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>
          ) : (
            workstationNote && (
              <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                {workstationNote}
              </p>
            )
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Summary Section */}
          {socketTypes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t("editor.summary")}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {socketTypes.map((type) => {
                  const DeviceIcon = socketIcons[type];
                  const count = socketsByType[type].length;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 p-2 bg-card rounded-lg border"
                    >
                      <DeviceIcon
                        className="h-5 w-5 shrink-0"
                        style={{ color: socketColors[type] }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{count}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {socketLabels[type]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sockets List */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t("editor.sockets")}
            </h4>
            {childSockets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("editor.noSockets")}</p>
                <p className="text-xs mt-1">
                  {t("editor.dragSocketsHint")}
                </p>
              </div>
            ) : isEditable && onReorderSockets ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={childSockets.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {childSockets.map((socket) => (
                      <SortableSocketItem
                        key={socket.id}
                        socket={socket}
                        isEditable={isEditable}
                        onRemoveSocket={onRemoveSocket}
                        onUpdateSocketName={onUpdateSocketName}
                        onUpdateSocketNote={onUpdateSocketNote}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {childSockets.map((socket) => (
                  <SortableSocketItem
                    key={socket.id}
                    socket={socket}
                    isEditable={isEditable}
                    onRemoveSocket={onRemoveSocket}
                    onUpdateSocketName={onUpdateSocketName}
                    onUpdateSocketNote={onUpdateSocketNote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
