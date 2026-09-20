'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/crypto';
import { isValidCPF, isValidCEP, isValidPhone, onlyDigits, UFS } from '@/lib/validators';

export async function saveProfile(_prev: any, fd: FormData) {
  const user = await requireUser('/conta');
  const v = (k: string) => String(fd.get(k) || '').trim();
  const admin = supabaseAdmin();
  const { data: cur } = await admin.from('profiles').select('cpf_last4, consent_at').eq('id', user.id).single();

  const name = v('full_name'), phone = onlyDigits(v('phone')), cpf = onlyDigits(v('cpf')), cep = onlyDigits(v('postal_code'));
  if (name.length < 5 || !name.includes(' ')) return { error: 'Informe nome e sobrenome.' };
  if (!isValidPhone(phone)) return { error: 'Telefone inválido (use DDD).' };
  if (cpf ? !isValidCPF(cpf) : !cur?.cpf_last4) return { error: 'CPF inválido.' };
  if (!isValidCEP(cep)) return { error: 'CEP inválido.' };
  if (!v('street') || !v('number') || !v('district') || !v('city')) return { error: 'Preencha o endereço completo.' };
  if (!UFS.includes(v('state'))) return { error: 'Estado inválido.' };
  if (!cur?.consent_at && fd.get('consent') !== 'on') return { error: 'É preciso aceitar a Política de Privacidade.' };

  const patch: any = {
    full_name: name, phone, postal_code: cep, street: v('street').slice(0, 120), number: v('number').slice(0, 20),
    complement: v('complement').slice(0, 60), district: v('district').slice(0, 80), city: v('city').slice(0, 80), state: v('state'),
    updated_at: new Date().toISOString(),
  };
  if (cpf) { patch.cpf_enc = encrypt(cpf); patch.cpf_last4 = cpf.slice(-2).padStart(2, '*'); }
  if (!cur?.consent_at) patch.consent_at = new Date().toISOString();

  const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (error) return { error: 'Não foi possível salvar. Tente novamente.' };
  const next = v('next');
  redirect(next || '/conta?salvo=1');
}

export async function changePassword(_prev: any, fd: FormData) {
  const { supabaseServer } = await import('@/lib/supabase/server');
  const pw = String(fd.get('password') || '');
  if (pw.length < 8) return { error: 'Use pelo menos 8 caracteres.' };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return { error: 'Não foi possível alterar a senha.' };
  redirect('/conta?salvo=1');
}
