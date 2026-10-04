"use client";

import { useAppContext } from '@/context/app-context';
import ReaderIcon from '@/components/reader-icon';

export default function PageNavigation() {
  const {readingMode, readerPosition: p, navigateReader, isUiVisible, view} = useAppContext();
  if (readingMode !== 'pages' || !isUiVisible || view !== 'sutra') return null;
  return <nav className="page-navigation" id="pageNavigation" aria-label="Page navigation">
    <button type="button" className="bar-btn" id="btnPreviousPage" title="Previous page" aria-label="Previous page" disabled={p.section === 0 && p.page === 0} onClick={() => navigateReader('turn', -1)}><ReaderIcon name="previous" /></button>
    <span className="page-position" id="pagePosition" role="status" aria-live="polite" aria-atomic="true"
      aria-label={`Page ${p.page + 1} of ${p.count}, section ${p.section + 1} of ${p.sections}`}>{p.page + 1} / {p.count}</span>
    <button type="button" className="bar-btn" id="btnNextPage" title="Next page" aria-label="Next page" disabled={p.section === p.sections - 1 && p.page === p.count - 1} onClick={() => navigateReader('turn', 1)}><ReaderIcon name="next" /></button>
  </nav>;
}
