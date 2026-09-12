import { describe, expect, it } from 'vitest';
import { emptyProfileForm, isCompleteProfileForm } from './form';

describe('profile input limits', () => {
  it('accepts supported values and rejects out-of-range estimate inputs', () => {
    const valid = { ...emptyProfileForm(), name: 'Alex', age: '28', sex: 'female' as const, heightCm: '172', weightKg: '70', activityLevel: 'moderate' as const, experience: 'beginner' as const, primaryGoal: 'general-fitness' as const };
    expect(isCompleteProfileForm(valid)).toBe(true);
    expect(isCompleteProfileForm({ ...valid, age: '12' })).toBe(false);
    expect(isCompleteProfileForm({ ...valid, heightCm: '251' })).toBe(false);
    expect(isCompleteProfileForm({ ...valid, weightKg: '29' })).toBe(false);
  });
});
