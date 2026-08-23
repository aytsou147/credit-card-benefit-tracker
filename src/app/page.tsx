'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CardWithBenefits } from '@/lib/types';
import { CardTemplate, benefitKey } from '@/lib/card-templates';
import { syncCardsWithTemplates } from '@/lib/template-sync';
import { CardTile } from '@/components/card-tile';
import { AddCardDialog } from '@/components/add-card-dialog';
import { ReminderBadges } from '@/components/reminder-badge';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [cards, setCards] = useState<CardWithBenefits[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchCards = useCallback(async () => {
    const query = () =>
      supabase
        .from('cards')
        .select(`
          *,
          benefits (
            *,
            usage_logs (*)
          )
        `)
        .order('created_at', { ascending: true });

    const { data, error } = await query();

    if (error) {
      toast.error('Failed to load cards');
      console.error(error);
      setLoading(false);
      return;
    }

    const fetched = (data ?? []) as CardWithBenefits[];
    // Reconcile template-backed benefits with the latest template definitions.
    const changed = await syncCardsWithTemplates(supabase, fetched);
    if (changed) {
      const { data: synced } = await query();
      setCards((synced ?? fetched) as CardWithBenefits[]);
    } else {
      setCards(fetched);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleAddTemplate(template: CardTemplate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        name: template.name,
        issuer: template.issuer,
        annual_fee: template.annual_fee,
        color: template.color,
        template_key: template.key,
      })
      .select()
      .single();

    if (cardError || !card) {
      toast.error('Failed to create card');
      return;
    }

    const benefitRows = template.benefits.map((b) => ({
      card_id: card.id,
      name: b.name,
      description: b.description,
      credit_type: b.credit_type,
      credit_amount: b.credit_amount,
      period_type: b.period_type,
      is_auto_used: b.is_auto_used,
      benefit_key: benefitKey(b),
      source: 'template',
    }));

    const { error: benefitError } = await supabase.from('benefits').insert(benefitRows);
    if (benefitError) {
      toast.error('Card created but failed to add benefits');
    } else {
      toast.success(`Added ${template.name} with ${template.benefits.length} benefits`);
    }

    fetchCards();
  }

  async function handleAddCustom(name: string, issuer: string, annualFee: number, color: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('cards').insert({
      user_id: user.id,
      name,
      issuer,
      annual_fee: annualFee,
      color,
    });

    if (error) {
      toast.error('Failed to create card');
    } else {
      toast.success(`Added ${name}`);
      fetchCards();
    }
  }

  async function handleDeleteCard(cardId: string) {
    const { error } = await supabase.from('cards').delete().eq('id', cardId);
    if (error) {
      toast.error('Failed to delete card');
    } else {
      toast.success('Card deleted');
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading cards...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Cards</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? 's' : ''} ·{' '}
            {cards.reduce((n, c) => n + c.benefits.filter((b) => !b.is_dismissed).length, 0)}{' '}
            benefits tracked
          </p>
        </div>
        <AddCardDialog onAddTemplate={handleAddTemplate} onAddCustom={handleAddCustom} />
      </div>

      <ReminderBadges cards={cards} />

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold">No cards yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add a card from a template or create a custom one.
          </p>
          <AddCardDialog onAddTemplate={handleAddTemplate} onAddCustom={handleAddCustom} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} onDelete={handleDeleteCard} />
          ))}
        </div>
      )}
    </div>
  );
}
