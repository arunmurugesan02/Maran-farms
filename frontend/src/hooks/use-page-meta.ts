import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    const previousDescription = meta.getAttribute("content") || "";
    if (description) {
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = previousTitle;
      if (description) {
        if (created) {
          meta.remove();
        } else {
          meta.setAttribute("content", previousDescription);
        }
      }
    };
  }, [title, description]);
}
