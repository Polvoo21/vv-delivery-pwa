export default function StoriesRow({ stories, onOpen }) {
  return (
    <section className="stories-row" aria-label="Новости и истории">
      {stories.map((story) => (
        <button className="story-card" key={story.id} type="button" onClick={() => onOpen(story)}>
          {story.image ? <img src={story.image} alt="" loading="lazy" /> : null}
          <span className="story-orbit">{story.accent}</span>
          <b>{story.title}</b>
        </button>
      ))}
    </section>
  );
}
