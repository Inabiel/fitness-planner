import { EXERCISES } from '../../data/exercises';

export function normalizeExerciseOrder(savedOrder: readonly string[] | undefined): string[] {
  const knownIds = new Set(EXERCISES.map((exercise) => exercise.id));
  const seen = new Set<string>();
  const order: string[] = [];

  for (const id of savedOrder ?? []) {
    if (knownIds.has(id) && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }

  for (const exercise of EXERCISES.slice().sort((a, b) => a.popularityRank - b.popularityRank)) {
    if (!seen.has(exercise.id)) order.push(exercise.id);
  }

  return order;
}

export function moveExerciseInOrder(current: readonly string[], id: string, direction: -1 | 1): string[] {
  const index = current.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return [...current];

  const next = [...current];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function reorderExerciseInOrder(current: readonly string[], sourceId: string, targetId: string, before = true): string[] {
  if (!sourceId || sourceId === targetId) return [...current];

  const sourceIndex = current.indexOf(sourceId);
  const targetIndex = current.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return [...current];

  const next = [...current];
  const moved = next.splice(sourceIndex, 1)[0];
  const insertionIndex = before
    ? sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
    : sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
  next.splice(insertionIndex, 0, moved);
  return next;
}
