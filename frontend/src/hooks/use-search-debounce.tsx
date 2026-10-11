import { useRef, useCallback, useEffect } from "react";

export function useSearchDebounce(
  onSearch: (value: string) => void,
  delay: number = 500,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSearch(value);
      }, delay);
    },
    [onSearch, delay],
  );

  const cancelSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedSearch, cancelSearch };
}
