import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Drawer({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const origin = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; origin?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="drawer" aria-labelledby="drawer-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="drawer-content"><div className="drawer-header"><span className="eyebrow" id="drawer-title">{title}</span><button className="icon-button" aria-label="Close profile" onClick={close}><X size={21} /></button></div>{children}</div></dialog>;
}
