import { createClient } from './supabase/client';
import { CardWithBenefits, BenefitWithUsage } from './types';
import { BenefitTemplate, benefitKey, benefitKeyAliases, getTemplate } from './card-templates';

type SupabaseClient = ReturnType<typeof createClient>;

// Fields owned by the template. Sync overwrites these on existing rows; everything
// else on a benefit row (is_auto_used, is_locked, reminder_*, cycle_start_date) is
// user-owned and never touched after the row is first inserted.
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
 * Template-sourced rows on a card whose key matches no template benefit, current or
 * historical — benefits dropped from the template, or left behind by an old rename.
 * Ones with usage are kept and flagged in the UI; sync deletes only the empty ones.
 */
export function retiredBenefitIds(card: CardWithBenefits): Set<string> {
  const template = getTemplate(card.template_key);
  if (!template) return new Set();
  const known = new Set(template.benefits.flatMap(benefitKeyAliases));
  return new Set(
    card.benefits
      .filter((b) => b.source === 'template' && !known.has(b.benefit_key ?? ''))
      .map((b) => b.id),
  );
}

/** Move every usage entry off `duplicates` onto `survivor`, then drop the empty rows. */
async function mergeInto(
  supabase: SupabaseClient,
  survivor: BenefitWithUsage,
  duplicates: BenefitWithUsage[],
) {
  for (const dup of duplicates) {
    if (dup.usage_logs.length > 0) {
      await supabase.from('usage_logs').update({ benefit_id: survivor.id }).eq('benefit_id', dup.id);
    }
  }
  await supabase.from('benefits').delete().in('id', duplicates.map((d) => d.id));
}

/**
 * Reconcile each template-backed card's benefit rows with the template definitions in
 * code: insert benefits added to the template, update definition fields that have
 * drifted, re-key rows still carrying a benefit's `previousKeys` (merging their usage
 * onto the canonical row), and delete usage-free rows the template no longer defines.
 * Custom benefits and user-owned fields are left alone, and no usage entry is ever
 * dropped — history is preserved across renames.
 *
 * Returns true if anything was written, so the caller can refetch.
 */
export async function syncCardsWithTemplates(
  supabase: SupabaseClient,
  cards: CardWithBenefits[],
): Promise<boolean> {
  let changed = false;
  const updates: Promise<unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];

  for (const card of cards) {
    const template = getTemplate(card.template_key);
    if (!template) continue;

    // Card matched on a historical key — write the current one back.
    if (card.template_key !== template.key) {
      await supabase.from('cards').update({ template_key: template.key }).eq('id', card.id);
      changed = true;
    }

    const existingByKey = new Map<string, BenefitWithUsage>();
    for (const b of card.benefits) {
      if (b.source === 'template' && b.benefit_key) existingByKey.set(b.benefit_key, b);
    }

    for (const tb of template.benefits) {
      const key = benefitKey(tb);
      const matches = benefitKeyAliases(tb)
        .map((k) => existingByKey.get(k))
        .filter((b): b is BenefitWithUsage => b !== undefined);

      if (matches.length === 0) {
        inserts.push({
          card_id: card.id,
          ...definitionFromTemplate(tb),
          is_auto_used: tb.is_auto_used,
          benefit_key: key,
          source: 'template',
        });
        changed = true;
        continue;
      }

      // Prefer the row already on the canonical key; otherwise adopt the richest
      // historical row (a card added after the rename only has the old key).
      let canonical = existingByKey.get(key);
      if (!canonical) {
        canonical = [...matches].sort((a, b) => b.usage_logs.length - a.usage_logs.length)[0];
        await supabase.from('benefits').update({ benefit_key: key }).eq('id', canonical.id);
        changed = true;
      }
      const survivor = canonical;

      const duplicates = matches.filter((b) => b.id !== survivor.id);
      if (duplicates.length > 0) {
        await mergeInto(supabase, survivor, duplicates);
        changed = true;
      }

      if (definitionDiffers(survivor, tb)) {
        updates.push(
          supabase.from('benefits').update(definitionFromTemplate(tb)).eq('id', survivor.id),
        );
        changed = true;
      }
    }

    const retired = retiredBenefitIds(card);
    const dropIds = card.benefits
      .filter((b) => retired.has(b.id) && b.usage_logs.length === 0)
      .map((b) => b.id);
    if (dropIds.length > 0) {
      updates.push(supabase.from('benefits').delete().in('id', dropIds));
      changed = true;
    }
  }

  if (inserts.length > 0) {
    updates.push(supabase.from('benefits').insert(inserts));
  }

  await Promise.all(updates);
  return changed;
}
