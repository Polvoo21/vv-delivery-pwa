import { ChevronRight } from "lucide-react";

export function SiteBreadcrumbs({ items = [] }) {
  if (items.length < 2) return null;

  return (
    <nav className="site-breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.path}>
              {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
              {isCurrent ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <a href={item.path}>{item.name}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

