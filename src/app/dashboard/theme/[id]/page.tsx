'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Theme, WordPair } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ThemeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const themeId = resolvedParams.id;
  
  const [theme, setTheme] = useState<Theme | null>(null);
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [wordCivil, setWordCivil] = useState('');
  const [wordImposter, setWordImposter] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        fetchThemeAndPairs(session.user.id);
      }
    });
  }, [router]);

  const fetchThemeAndPairs = async (userId: string) => {
    // 1. Fetch theme info
    const { data: themeData, error: themeError } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .eq('user_id', userId)
      .single();

    if (themeError || !themeData) {
      toast.error('Thème introuvable ou accès refusé');
      return router.push('/dashboard');
    }

    setTheme(themeData as Theme);

    // 2. Fetch pairs
    const { data: pairsData } = await supabase
      .from('word_pairs')
      .select('*')
      .eq('theme_id', themeId)
      .order('word_civil', { ascending: true });

    if (pairsData) {
      setPairs(pairsData as WordPair[]);
    }
    
    setIsLoading(false);
  };

  const addPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordCivil.trim() || !wordImposter.trim()) return;

    const { data, error } = await supabase
      .from('word_pairs')
      .insert({
        theme_id: themeId,
        word_civil: wordCivil.trim(),
        word_imposter: wordImposter.trim()
      })
      .select()
      .single();

    if (error) {
      toast.error('Erreur lors de l\'ajout du mot');
    } else if (data) {
      toast.success('Paire ajoutée !');
      setPairs([data as WordPair, ...pairs]);
      setWordCivil('');
      setWordImposter('');
    }
  };

  const deletePair = async (id: string) => {
    const { error } = await supabase.from('word_pairs').delete().eq('id', id);
    if (!error) {
      setPairs(pairs.filter(p => p.id !== id));
      toast.success('Paire supprimée');
    }
  };

  if (isLoading || !theme) return null;

  return (
    <div className="w-full h-full p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Édition: {theme.name}
            </h1>
            <p className="text-zinc-400 text-sm">{pairs.length} paires de mots enregistrées</p>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Ajouter une paire */}
        <div className="md:col-span-1">
          <Card className="bg-zinc-900 border-zinc-800 sticky top-4">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-white mb-4">Nouvelle Paire</h3>
              <form onSubmit={addPair} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-blue-400 font-bold uppercase">Mot 1</label>
                  <Input 
                    placeholder="Ex: Eau" 
                    value={wordCivil}
                    onChange={e => setWordCivil(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-red-400 font-bold uppercase">Mot 2</label>
                  <Input 
                    placeholder="Ex: Sirop" 
                    value={wordImposter}
                    onChange={e => setWordImposter(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <Button type="submit" disabled={!wordCivil.trim() || !wordImposter.trim()} className="w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Liste des mots */}
        <div className="md:col-span-2 space-y-3">
          {pairs.length === 0 ? (
            <div className="text-zinc-400 text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg">
               Remplissez votre liste de mots.
            </div>
          ) : (
            pairs.map(pair => (
              <div key={pair.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-zinc-800/50 p-2 rounded text-center">
                    <span className="text-xs text-zinc-400 block">Mot 1</span>
                    <span className="font-semibold text-blue-400">{pair.word_civil}</span>
                  </div>
                  <span className="text-zinc-400 font-bold">VS</span>
                  <div className="flex-1 bg-zinc-800/50 p-2 rounded text-center">
                    <span className="text-xs text-zinc-400 block">Mot 2</span>
                    <span className="font-semibold text-red-400">{pair.word_imposter}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 shrink-0" onClick={() => deletePair(pair.id)}>
                   <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
