import { X } from "lucide-react";

export default function InfoSheet({ story, onClose }) {
  if (!story) return null;

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label={story.title}>
      <button className="sheet-dim" type="button" onClick={onClose} aria-label="Закрыть" />
      <section className="bottom-sheet compact-sheet info-sheet">
        <div className="sheet-grabber" />
        <button className="sheet-icon-close" type="button" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
        <div className="info-accent">{story.accent}</div>
        <p className="eyebrow">Вместе Вкуснее</p>
        <h2>{story.title}</h2>
        <p>{story.text}</p>
        <button className="primary-action" type="button" onClick={onClose}>
          Хорошо
        </button>
      </section>
    </div>
  );
}
