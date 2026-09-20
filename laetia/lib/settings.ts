import 'server-only';
import { supabaseAdmin } from './supabase/admin';

export const DEFAULT_PUBLIC = {
  storeName: 'Laetia',
  whatsapp: '',
  whatsappMessage: 'Olá! Gostaria de tirar uma dúvida sobre a Laetia.',
  homeTitle: 'Terços e artigos para a sua oração',
  homeSubtitle: 'Feitos com cuidado, para acompanhar a sua fé.',
  shippingFallback: 25,
  freeShippingAbove: 0,
};
export const DEFAULT_PRIVATE = {
  sender: { name: '', phone: '', email: '', document: '', postal_code: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
};

async function get(key: string, defaults: any) {
  const { data } = await supabaseAdmin().from('settings').select('value').eq('key', key).maybeSingle();
  return { ...defaults, ...(data?.value || {}) };
}
export const getPublicSettings = () => get('public', DEFAULT_PUBLIC) as Promise<typeof DEFAULT_PUBLIC>;
export const getPrivateSettings = () => get('private', DEFAULT_PRIVATE) as Promise<typeof DEFAULT_PRIVATE>;
