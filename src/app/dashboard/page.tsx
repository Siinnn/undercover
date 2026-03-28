'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Theme } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Home, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [newThemeName, setNewThemeName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        fetchThemes(session.user.id);
      }
    });
  }, [router]);

  const fetchThemes = async (userId: string) => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setThemes(data as Theme[]);
    }
    setIsLoading(false);
  };

  const createTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim() || !session) return;
    
    // Slug generation basique
    const slug = newThemeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 4);

    const { data, error } = await supabase
      .from('themes')
      .insert({
        name: newThemeName.trim(),
        slug,
        user_id: session.user.id,
        is_official: false
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur création du thème");
    } else if (data) {
      toast.success("Thème créé !");
      setThemes([data as Theme, ...themes]);
      setNewThemeName('');
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce thème ?")) return;
    const { error } = await supabase.from('themes').delete().eq('id', id);
    if (error) {
      toast.error("Erreur suppression");
    } else {
      toast.success("Thème supprimé");
      setThemes(themes.filter(t => t.id !== id));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Chargement...</div>;

  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Espace Créateur</h1>
          <p className="text-zinc-400 text-sm">{session?.user?.email}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/')} className="bg-zinc-900 border-zinc-700 text-zinc-300">
            <Home className="w-4 h-4 mr-2" /> Retour à l'accueil
          </Button>
          <Button variant="destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Création de Thème */}
        <div className="md:col-span-1">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Nouveau Thème</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTheme} className="space-y-4">
                <Input 
                  placeholder="Ex: Animaux Marins" 
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button type="submit" disabled={!newThemeName.trim()} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Créer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Liste des thèmes */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Mes Thèmes ({themes.length})</h2>
          
          {themes.length === 0 ? (
             <div className="text-zinc-400 text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg">
               Vous n'avez pas encore créé de thème.
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {themes.map(theme => (
                 <Card key={theme.id} className="bg-zinc-900 border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/theme/${theme.id}`)}>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-white text-lg line-clamp-1">{theme.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-end">
                       <p className="text-xs text-zinc-400">
                         {new Date(theme.created_at).toLocaleDateString()}
                       </p>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={(e) => { e.stopPropagation(); deleteTheme(theme.id); }}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </CardContent>
                 </Card>
               ))}
             </div>
          )}
        </div>

      </section>
    </main>
  );
}
