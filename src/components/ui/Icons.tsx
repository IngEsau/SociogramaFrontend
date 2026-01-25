/**
 * Iconos SVG reutilizables
 * Ubicación: src/components/ui/Icons/
 */

// Icono de cuenta/usuario
export const AccountIcon = () => (
  <svg fill="currentColor" className="w-6 h-6 text-white/50" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
);

// Icono de candado
export const LockIcon = () => (
  <svg fill="currentColor" className="w-6 h-6 text-white/50" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1z"/></svg>
);

// Icono de ojo cerrado (ocultar contraseña)
interface EyeIconProps {
  onClick: () => void;
}

export const EyeOffIcon = ({ onClick }: EyeIconProps) => (
  <svg fill="none" stroke="currentColor" className="w-6 h-6 text-white/30 cursor-pointer hover:text-white/50 transition-colors" onClick={onClick} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10 10 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7A10 10 0 0 1 4.02 8.971m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.95 9.95 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.03 10.03 0 0 1-4.132 5.411m0 0L21 21" strokeWidth={2}/></svg>
);

// Icono de ojo abierto (mostrar contraseña)
export const EyeIcon = ({ onClick }: EyeIconProps) => (
  <svg fill="none" stroke="currentColor" className="w-6 h-6 text-white/30 cursor-pointer hover:text-white/50 transition-colors" onClick={onClick} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7" strokeWidth={2}/></svg>
);
