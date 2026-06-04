export default function CategoryTabs({ categories, selected, onSelect }) {
  return (
    <nav className="category-tabs" aria-label="Категории меню">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={selected === category.id ? "active" : ""}
          onClick={() => onSelect(category.id)}
        >
          {category.title}
        </button>
      ))}
    </nav>
  );
}
