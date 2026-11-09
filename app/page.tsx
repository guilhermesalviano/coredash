import DashboardShell from "@/components/dashboardShell";
import { getDashboardSeed } from "@/features/dashboard/server/get-dashboard-seed";
import { pickLoadingGif } from "@/features/dashboard/server/loading-gifs";
import { getRuntimeSettings } from "@/features/settings/server/runtime-settings";

// Reads settings and the in-memory caches on every request.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [settings, loadingGif] = await Promise.all([
    getRuntimeSettings().catch(() => null),
    pickLoadingGif(),
  ]);
  const setupRequired = settings ? settings.setupRequired : null;
  const seed = setupRequired === false ? await getDashboardSeed() : {};

  return <DashboardShell setupRequired={setupRequired} seed={seed} loadingGif={loadingGif} />;
}
