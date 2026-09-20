export const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

export function isValidCPF(input: string) {
  const c = onlyDigits(input);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export const maskCPF = (c: string) => {
  const d = onlyDigits(c);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : c;
};
export const maskCEP = (c: string) => {
  const d = onlyDigits(c);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : c;
};
export const isValidCEP = (c: string) => onlyDigits(c).length === 8;
export const isValidPhone = (p: string) => [10, 11].includes(onlyDigits(p).length);
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function profileComplete(p: any) {
  return !!(p && p.full_name && p.cpf_enc && p.phone && p.postal_code && p.street && p.number && p.district && p.city && p.state);
}
