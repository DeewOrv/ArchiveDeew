import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center app-container">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-24 h-24 rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-primary/30 ring-1 ring-white/10">
          <img
            src="/logo.png"
            alt="ArchiveDeew"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">ArchiveDeew</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Your personal archive for anime, manga, novels, and dramas. Never lose your place again.
        </p>

        <Button
          onClick={login}
          size="lg"
          className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
        >
          Enter Archive
        </Button>
      </div>

      <div className="py-8 opacity-40">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium">Obsessive Tracking</p>
      </div>
    </div>
  );
}
