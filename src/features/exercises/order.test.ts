import { describe, expect, it } from 'vitest';
import { moveExerciseInOrder, reorderExerciseInOrder } from './order';

describe('exercise ordering', () => {
  it('moves an item before or after the hovered item', () => {
    expect(reorderExerciseInOrder(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'a', 'c']);
    expect(reorderExerciseInOrder(['a', 'b', 'c'], 'a', 'b', false)).toEqual(['b', 'a', 'c']);
  });

  it('moves an item one position with the arrow controls', () => {
    expect(moveExerciseInOrder(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveExerciseInOrder(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });
});
