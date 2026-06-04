import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center app-container">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
          <Layers className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-3">Media Vault</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Your personal space for tracking anime, manga, novels, and dramas. Never lose your place again.
        </p>

        <Button 
          onClick={login}
          size="lg" 
          className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
        >
          Enter Vault
        </Button>
      </div>
      
      <div className="py-8 opacity-40">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium">Obsessive tracking</p>
      </div>
    </div>
  );
}
