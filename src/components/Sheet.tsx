import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";

/** Bottom sheet: slides up, drag down or tap the backdrop to close. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const drag = useDragControls();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button aria-label="关闭" className="absolute inset-0 bg-black/40" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="y" dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 90 || i.velocity.y > 500) && onClose()}>
            <div className="sticky top-0 -mx-5 bg-surface px-5 pt-2 pb-3" onPointerDown={(e) => drag.start(e)} style={{ touchAction: "none" }}>
              <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
              <h2 className="mt-3 font-jp text-lg">{title}</h2>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
