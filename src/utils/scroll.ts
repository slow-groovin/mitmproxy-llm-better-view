let scrollStack: number[] = [];
/**
 * For stack-able scroll to/back
 * @param selector 
 */
export function scrollTo(selector: string) {
  scrollStack.push(window.scrollY);
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}

export function scrollReturn() {
  const pos = scrollStack.pop();
  if (pos !== undefined) {
    window.scrollTo({ top: pos, behavior: 'smooth' });
  }
}