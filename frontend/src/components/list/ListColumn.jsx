import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ListColumn({ list, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: `list-${list.id}`,
    data: {
      type: "list",
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="min-w-[300px] bg-slate-200 rounded-xl p-3 shadow-md"
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing mb-3"
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Drag List
        </p>
      </div>

      {children}
    </div>
  );
}

export default ListColumn;