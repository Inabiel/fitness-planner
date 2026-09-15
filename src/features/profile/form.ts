import { positiveInteger } from '../../shared/validation';
import type { ActivityLevel, Experience, Goal, Profile, Sex } from '../../domain';

export interface ProfileForm {
  name: string;
  age: string;
  sex: Sex | '';
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | '';
  experience: Experience | '';
  primaryGoal: Goal | '';
  secondaryGoals: Goal[];
}

export type CompleteProfileForm = Omit<ProfileForm, 'sex' | 'activityLevel' | 'experience' | 'primaryGoal'> & {
  sex: Sex;
  activityLevel: ActivityLevel;
  experience: Experience;
  primaryGoal: Goal;
};

export type ProfileFormValue = ProfileForm[keyof ProfileForm];

export const PROFILE_LIMITS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
} as const;

export function emptyProfileForm(): ProfileForm {
  return {
    name: '',
    age: '',
    sex: '',
    heightCm: '',
    weightKg: '',
    activityLevel: '',
    experience: '',
    primaryGoal: '',
    secondaryGoals: [],
  };
}

export function profileToForm(profile: Profile): ProfileForm {
  return {
    name: profile.name,
    age: String(profile.age),
    sex: profile.sex,
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activityLevel: profile.activityLevel,
    experience: profile.experience,
    primaryGoal: profile.primaryGoal,
    secondaryGoals: profile.secondaryGoals,
  };
}

export function isCompleteProfileForm(form: ProfileForm): form is CompleteProfileForm {
  return Boolean(
    form.name.trim()
      && positiveInteger(form.age)
      && withinRange(form.age, PROFILE_LIMITS.age.min, PROFILE_LIMITS.age.max)
      && isSex(form.sex)
      && withinRange(form.heightCm, PROFILE_LIMITS.heightCm.min, PROFILE_LIMITS.heightCm.max)
      && withinRange(form.weightKg, PROFILE_LIMITS.weightKg.min, PROFILE_LIMITS.weightKg.max)
      && isActivityLevel(form.activityLevel)
      && isExperience(form.experience)
      && isGoal(form.primaryGoal),
  );
}

export function formToCalculationProfile(form: CompleteProfileForm): Omit<Profile, 'id' | 'secondaryGoals' | 'updatedAt' | 'revision'> {
  return {
    name: form.name.trim(),
    age: Number(form.age),
    sex: form.sex,
    heightCm: Number(form.heightCm),
    weightKg: Number(form.weightKg),
    activityLevel: form.activityLevel,
    experience: form.experience,
    primaryGoal: form.primaryGoal,
  };
}


function withinRange(value: string, min: number, max: number): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

export function isSex(value: string): value is Sex {
  return value === 'female' || value === 'male';
}

export function isActivityLevel(value: string): value is ActivityLevel {
  return value === 'sedentary' || value === 'light' || value === 'moderate' || value === 'high' || value === 'athlete';
}

export function isExperience(value: string): value is Experience {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export function isGoal(value: string): value is Goal {
  return value === 'lose-fat' || value === 'build-muscle' || value === 'maintain-weight' || value === 'general-fitness';
}
