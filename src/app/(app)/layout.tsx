import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { RubricProvider } from "@/lib/rubric/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <AppHeader email={user?.email ?? null} />
      <RubricProvider>{children}</RubricProvider>
    </>
  );
}
