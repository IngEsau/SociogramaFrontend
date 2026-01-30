/**
 * Fondo decorativo para las vistas de autenticación
 * Incluye círculos decorativos y logo UTP para PC
 */

interface AuthBackgroundProps {
  /** Breakpoint personalizado para PC (por defecto 1400px) */
  breakpoint?: number;
}

export const AuthBackground = ({ breakpoint = 1400 }: AuthBackgroundProps) => {
  return (
    <>
      {/* Media Query personalizada para breakpoint en PC */}
      <style>
        {`
          @media (min-width: ${breakpoint}px) {
            .xl-custom\\:block { display: block !important; }
            .xl-custom\\:hidden { display: none !important; }
            .xl-custom\\:flex { display: flex !important; }
            .xl-custom\\:justify-end { justify-content: flex-end !important; }
            .xl-custom\\:pr-\\[300px\\] { padding-right: 400px !important; }
            .xl-custom\\:w-\\[380px\\] { width: 380px !important; }
            .xl-custom\\:w-\\[160px\\] { width: 160px !important; }
            .xl-custom\\:h-\\[160px\\] { height: 160px !important; }
            .xl-custom\\:right-\\[calc\\(50\\%-340px\\)\\] { right: calc(50% - 340px) !important; }
            .xl-custom\\:-top-\\[80px\\] { top: -80px !important; }
            .xl-custom\\:w-\\[320px\\] { width: 320px !important; }
            .xl-custom\\:h-\\[320px\\] { height: 320px !important; }
            .xl-custom\\:-right-\\[100px\\] { right: -100px !important; }
            .xl-custom\\:-bottom-\\[80px\\] { bottom: -80px !important; }
          }
        `}
      </style>

      {/* ========== CÍRCULOS DECORATIVOS ========== */}

      {/* Círculo grande izquierdo - PC */}
      <div
        className="hidden xl-custom:block absolute w-[780px] h-[780px] -left-[150px] -top-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo medio rotado - PC */}
      <div
        className="hidden xl-custom:block absolute w-[540px] h-[545px] left-[80px] top-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(54deg)',
          transformOrigin: 'top left',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo inferior derecho */}
      <div
        className="absolute rounded-full pointer-events-none
          w-[280px] h-[280px] -right-[140px] -bottom-[140px]
          md:w-[350px] md:h-[350px] md:-right-[175px] md:-bottom-[175px]
          xl-custom:w-[320px] xl-custom:h-[320px] xl-custom:-right-[100px] xl-custom:-bottom-[80px]"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(8deg)',
          transformOrigin: 'center',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo superior derecho */}
      <div
        className="absolute rounded-full pointer-events-none
          w-[130px] h-[130px] right-[calc(50%-240px)] -top-[65px]
          md:w-[145px] md:h-[145px] md:right-[calc(50%-180px)] md:-top-[72px]
          xl-custom:w-[160px] xl-custom:h-[160px] xl-custom:right-[calc(50%-340px)] xl-custom:-top-[80px]"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(12deg)',
          transformOrigin: 'center',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.20)'
        }}
      />

      {/* Círculo izquierdo - Tablet y Mobile */}
      <div
        className="block xl-custom:hidden absolute w-[500px] h-[500px] -left-[350px] top-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9' }}
      />

      {/* ========== LOGO UTP - PC ========== */}
      <div className="hidden xl-custom:block absolute w-[280px] h-[280px] left-[180px] top-[100px] pointer-events-none z-10">
        <img
          src="/Logo_UTP.png"
          alt="Universidad Tecnológica de Puebla"
          className="w-full h-full object-contain drop-shadow-[0_1px_50px_rgba(0,0,0,0.5)]"
        />
      </div>
    </>
  );
};
