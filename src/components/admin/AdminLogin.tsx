import { useState, FormEvent } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { sbLogin } from '../../lib/supabase';

interface AdminLoginProps {
  onSuccess: (accessToken: string, refreshToken: string) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token, refresh_token } = await sbLogin(email, password);
      onSuccess(access_token, refresh_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white border border-slate-100 rounded-[32px] shadow-xl p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-trimmed.webp" alt="Trespa Store" className="h-10 sm:h-12 md:h-14 w-auto object-contain mb-3" />
          <h1 className="font-display font-bold text-lg text-slate-900">Panel de administración</h1>
          <p className="text-xs text-slate-400 mt-1">Acceso solo para el equipo de Trespa Store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none rounded-2xl transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none rounded-2xl transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a
          href="/"
          className="block text-center text-xs text-slate-400 hover:text-brand-blue mt-6 transition-colors"
        >
          ← Volver a la tienda
        </a>
      </motion.div>
    </div>
  );
}
