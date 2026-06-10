import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import * as db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LogOut, Download, Upload, User as UserIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await db.exportMedia();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archivedeew-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export successful" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target?.result as string);
        setIsImporting(true);
        await db.importMedia(items);
        queryClient.invalidateQueries({ queryKey: ["media"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        toast({ title: "Import successful" });
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON format", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <h2 className="font-semibold">{user?.firstName || user?.email?.split("@")[0] || "Archivist"}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || "No email provided"}</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Data</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Export Backup</div>
                <div className="text-xs text-muted-foreground">Download your archive as JSON</div>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Import Backup</div>
                <div className="text-xs text-muted-foreground">Restore from JSON backup</div>
              </div>
            </button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">About</h3>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/logo.png" alt="ArchiveDeew" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-medium">ArchiveDeew</div>
              <div className="text-xs text-muted-foreground">Personal media progress tracker</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Account</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition-colors text-left text-destructive"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <div className="font-medium">Log Out</div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
