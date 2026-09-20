export const brl = (n: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0);

export const parseMoney = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
