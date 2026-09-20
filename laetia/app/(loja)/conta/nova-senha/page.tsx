'use client';
import { useActionState } from 'react';
import { changePassword } from '../actions';

export default function NovaSenha() {
  const [state, action, pending] = useActionState(changePassword, null as any);
  return (
    <div className="narrow">
      <h1>Nova senha</h1>
      <form action={action} className="panel">
        {state?.error && <div className="notice err">{state.error}</div>}
        <div className="field"><label htmlFor="pw">Nova senha</label><input id="pw" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
        <button className="btn block" disabled={pending}>Salvar senha</button>
      </form>
    </div>
  );
}
