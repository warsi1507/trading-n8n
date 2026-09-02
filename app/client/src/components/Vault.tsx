import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { Eye, EyeOff, Copy, Check, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { CredentialResponse } from "@trading-n8n/common";

export function Vault() {
  const { getToken } = useAuth();
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  const [credToDelete, setCredToDelete] = useState<CredentialResponse | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCredentials = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (err) {
      console.error("Failed to fetch credentials", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newValue.trim()) return;
    setIsCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/credentials`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim(), value: newValue.trim() }),
      });
      
      if (res.ok) {
        const newCred = await res.json();
        setCredentials([newCred, ...credentials]);
        setNewName("");
        setNewValue("");
        setShowCreateForm(false);
        toast.success("Credential saved to Vault");
      } else {
        toast.error("Failed to save credential");
      }
    } catch (err) {
      console.error("Failed to create credential", err);
      toast.error("Network error while saving credential");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!credToDelete || deleteConfirmName !== credToDelete.name) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/credentials/${credToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCredentials(credentials.filter(c => c._id !== credToDelete._id));
        setCredToDelete(null);
        setDeleteConfirmName("");
        toast.success("Credential deleted");
      } else {
        toast.error("Failed to delete credential");
      }
    } catch (err) {
      console.error("Failed to delete credential", err);
      toast.error("Network error while deleting credential");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedTokens(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedTokens(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col w-full h-full text-foreground p-6 pt-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Credentials Vault</h1>
          <p className="text-sm text-muted-foreground">Securely store your API keys and tokens.</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Credential
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-semibold text-sm mb-4">Add New Credential</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input 
                placeholder="e.g. Hyperliquid Mainnet" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Token / API Key</Label>
              <Input 
                type="password" 
                placeholder="Paste your secret token here..." 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || !newValue.trim() || isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Vault"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {credentials.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl border-border/50 bg-muted/10">
            <p className="text-sm text-muted-foreground">No credentials found.</p>
          </div>
        ) : (
          credentials.map((cred) => {
            const isVisible = visibleTokens[cred._id];
            const isCopied = copiedTokens[cred._id];
            const isBeingDeleted = credToDelete?._id === cred._id;

            return (
              <div key={cred._id} className="flex flex-col p-4 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-colors shadow-sm group">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="font-medium text-sm truncate">{cred.name}</span>
                    <div className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[200px] sm:max-w-[300px] truncate transition-all">
                      {isVisible ? cred.value : "••••••••••••••••••••••••••••"}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 relative"
                      onClick={() => handleCopy(cred._id, cred.value)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-200">
                        {isCopied ? <Check className="w-4 h-4 text-green-500 scale-100" /> : <Copy className="w-4 h-4 scale-100" />}
                      </div>
                      {isCopied && (
                        <span className="absolute -top-6 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded shadow-lg animate-in zoom-in-95 fade-in duration-200">
                          Copied
                        </span>
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => toggleVisibility(cred._id)}
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <div className="w-px h-4 bg-border mx-1" />

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => {
                        setCredToDelete(cred);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isBeingDeleted && (
                  <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Type <strong className="text-foreground">{cred.name}</strong> to delete this credential.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={deleteConfirmName} 
                        onChange={(e) => setDeleteConfirmName(e.target.value)} 
                        placeholder="Credential name..." 
                        className="h-8 text-sm flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8"
                        onClick={() => { setCredToDelete(null); setDeleteConfirmName(""); }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8"
                        disabled={deleteConfirmName !== cred.name || isDeleting}
                        onClick={handleDelete}
                      >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
