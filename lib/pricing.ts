// Usado no navegador (exibição) E no servidor (valor real cobrado).
export type Selections = Record<string, string>;

export const CUSTOM_TEXT_RE = /^[\p{L}\p{M}\s'.-]+$/u;

export function priceFor(product: any, selections: Selections, customText: string) {
  let unit = Number(product.base_price) || 0;
  const details: { group: string; value: string; delta: number }[] = [];
  let text = '';
  for (const g of product.option_groups || []) {
    const vid = selections[g.id];
    const v = (g.option_values || []).find((x: any) => x.id === vid && x.active !== false);
    if (v) { unit += Number(v.price_delta) || 0; details.push({ group: g.name, value: v.label, delta: Number(v.price_delta) || 0 }); }
    if (g.text_enabled && customText && customText.trim()) {
      text = customText.trim();
      unit += Number(g.text_price) || 0;
    }
  }
  return { unit: Math.round(unit * 100) / 100, details, text };
}

export function validateSelection(product: any, selections: Selections, customText: string) {
  for (const g of product.option_groups || []) {
    const vid = selections?.[g.id];
    const activeValues = (g.option_values || []).filter((x: any) => x.active !== false);
    if (activeValues.length && g.required && !vid) return { ok: false as const, error: `Escolha: ${g.name}` };
    if (vid && !activeValues.some((x: any) => x.id === vid)) return { ok: false as const, error: `Opção inválida em ${g.name}` };
  }
  const t = (customText || '').trim();
  if (t) {
    const g = (product.option_groups || []).find((x: any) => x.text_enabled);
    if (!g) return { ok: false as const, error: 'Este item não aceita nome personalizado' };
    if (t.length > (g.text_max || 30)) return { ok: false as const, error: `Nome com no máximo ${g.text_max || 30} letras` };
    if (!CUSTOM_TEXT_RE.test(t)) return { ok: false as const, error: 'Use apenas letras no nome' };
  }
  return { ok: true as const, ...priceFor(product, selections, t) };
}
