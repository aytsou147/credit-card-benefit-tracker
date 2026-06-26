import { createClient } from './supabase/client';
import { CardWithBenefits, BenefitWithUsage } from './types';
import { BenefitTemplate, benefitKey, getTemplate } from './card-templates';

type SupabaseClient = ReturnType<typeof createClient>;

// Fields owned by the template. Sync overwrites these on existing rows; everything
// else on a benefit row (is_auto_used, reminder_*, cycle_start_date) is user-owned
// and never touched after the row is first inserted.
const DEFINITION_FIELDS = ['name', 'description', 'credit_type', 'credit_amount', 'period_type'] as const;

function definitionFromTemplate(tb: BenefitTemplate) {
  return {
    name: tb.name,
    description: tb.description,
    credit_type: tb.credit_type,
    credit_amount: tb.credit_amount,
    period_type: tb.period_type,
  };
}

function definitionDiffers(existing: BenefitWithUsage, tb: BenefitTemplate): boolean {
  const def = definitionFromTemplate(tb);
  return DEFINITION_FIELDS.some((f) => {
    if (f === 'credit_amount') return Number(existing.credit_amount) !== Number(def.credit_amount);
    return (existing[f] ?? null) !== (def[f] ?? null);
  });
}

/**
 * Reconcile each template-backed card's benefit rows with the template definitions
 * in code: insert benefits added to the template, and update definition fields on
 * existing rows that have drifted. Custom benefits and user-owned fields are left
 * alone, and usage_logs are never touched (history is preserved).
 *
 * Returns true if any row was inserted or updated, so the caller can refetch.
 */
export async function syncCardsWithTemplates(
  supabase: SupabaseClient,
  cards: CardWithBenefits[],
): Promise<boolean> {
  const updates: Promise<unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];

  for (const card of cards) {
    const template = getTemplate(card.template_key);
    if (!template) continue;

    const existingByKey = new Map<string, BenefitWithUsage>();
    for (const b of card.benefits) {
      if (b.source === 'template' && b.benefit_key) existingByKey.set(b.benefit_key, b);
    }

    for (const tb of template.benefits) {
      const key = benefitKey(tb);
      const existing = existingByKey.get(key);

      if (existing) {
        if (definitionDiffers(existing, tb)) {
          updates.push(
            supabase.from('benefits').update(definitionFromTemplate(tb)).eq('id', existing.id),
          );
        }
      } else {
        inserts.push({
          card_id: card.id,
          ...definitionFromTemplate(tb),
          is_auto_used: tb.is_auto_used,
          benefit_key: key,
          source: 'template',
        });
      }
    }
  }

  if (inserts.length > 0) {
    updates.push(supabase.from('benefits').insert(inserts));
  }

  if (updates.length === 0) return false;
  await Promise.all(updates);
  return true;
}
