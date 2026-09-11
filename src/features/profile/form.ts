import { positiveInteger, positiveNumber } from '../../shared/validation';
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
      && positiveNumber(form.age)
      && isSex(form.sex)
      && positiveNumber(form.heightCm)
      && positiveNumber(form.weightKg)
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

export { positiveInteger, positiveNumber };

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
