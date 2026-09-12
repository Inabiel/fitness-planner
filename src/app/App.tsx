import { Navigate, Route, Routes } from 'react-router';
import { usePlanner, type AuthenticatedPlannerData } from '../data/db';
import { Dashboard } from '../features/dashboard';
import { AboutPage } from '../features/about';
import { CalculatePage } from '../features/calculate';
import { ExerciseOrder } from '../features/exercises';
import { HistoryDetail, Session } from '../features/sessions';
import { Onboarding, ProfileSettings } from '../features/profile';
import { PlanDetail, PlanEditor, Plans, ProgramDetail, ProgramEditor } from '../features/plans';
import { Progress } from '../features/progress';
import { AppShell, LoadingScreen } from '../shared/ui';

export function App() {
  const data = usePlanner();
  if (!data) return <LoadingScreen />;

  return data.profile ? <AuthenticatedApp data={{ ...data, profile: data.profile }} /> : <OnboardingRoutes />;
}

function OnboardingRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding existing={undefined} />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );
}

function AuthenticatedApp({ data }: { data: AuthenticatedPlannerData }) {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding existing={data.profile} />} />
      <Route element={<AppShell profile={data.profile} />}>
        <Route path="/" element={<Dashboard data={data} />} />
        <Route path="/plans" element={<Plans data={data} />} />
        <Route path="/plans/new" element={<PlanEditor data={data} />} />
        <Route path="/plans/:planId" element={<PlanDetail data={data} />} />
        <Route path="/plans/:planId/edit" element={<PlanEditor data={data} />} />
        <Route path="/programs/new" element={<ProgramEditor data={data} />} />
        <Route path="/programs/:programId" element={<ProgramDetail data={data} />} />
        <Route path="/programs/:programId/edit" element={<ProgramEditor data={data} />} />
        <Route path="/sessions/:planId/:date" element={<Session data={data} />} />
        <Route path="/history/:recordId" element={<HistoryDetail data={data} />} />
        <Route path="/progress" element={<Progress data={data} />} />
        <Route path="/exercise-order" element={<ExerciseOrder profile={data.profile} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/calculate" element={<CalculatePage />} />
        <Route path="/profile" element={<ProfileSettings profile={data.profile} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
