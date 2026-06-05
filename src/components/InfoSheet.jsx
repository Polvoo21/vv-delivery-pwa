import { X } from "lucide-react";
import { useSwipeDismiss } from "../utils/useSwipeDismiss";

export default function InfoSheet({ story, onClose }) {
  const swipe = useSwipeDismiss(onClose);

  if (!story) return null;

  return (
    <div
      className={`sheet-overlay ${swipe.closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
    >
      <button className="sheet-dim" type="button" onClick={swipe.close} aria-label="Закрыть" />
      <section
        className={`bottom-sheet compact-sheet info-sheet ${swipe.dragging ? "is-dragging" : ""} ${
          swipe.closing ? "is-closing" : ""
        }`}
        style={swipe.style}
        {...swipe.bind}
      >
        <div className="sheet-grabber" />
        <button className="sheet-icon-close" type="button" onClick={swipe.close} aria-label="Закрыть">
          <X size={20} />
        </button>
        <div className="info-accent">{story.accent}</div>
        <p className="eyebrow">Вместе Вкуснее</p>
        <h2>{story.title}</h2>
        <p>{story.text}</p>
        <button className="primary-action" type="button" onClick={swipe.close}>
          Хорошо
        </button>
      </section>
    </div>
  );
}
