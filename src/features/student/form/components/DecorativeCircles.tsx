/**
 * Componente de Círculos Decorativos - Sociograma
 * Círculos de fondo con gradiente UTP
 */

export const DecorativeCircles = () => {
  const circleStyle = {
    background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
  };

  const circleWithShadow = {
    ...circleStyle,
    boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)',
  };

  return (
    <>
      {/* Círculo superior izquierdo - Grande */}
      <div
        className="hidden lg:block absolute w-[300px] h-[300px] xl:w-[400px] xl:h-[400px] 2xl:w-[483px] 2xl:h-[489px] -left-[50px] -top-[200px] xl:-top-[250px] 2xl:-top-[326px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />
      
      {/* Círculo superior derecho - Grande */}
      <div
        className="hidden lg:block absolute w-[250px] h-[250px] xl:w-[280px] xl:h-[284px] 2xl:w-[329px] 2xl:h-[333px] right-[50px] xl:right-[100px] -top-[180px] xl:-top-[220px] 2xl:-top-[283px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />

      {/* Círculo derecho medio */}
      <div
        className="hidden md:block absolute w-[100px] h-[100px] lg:w-[129px] lg:h-[129px] right-[20px] lg:right-[50px] top-[400px] lg:top-[506px] rounded-full pointer-events-none"
        style={circleStyle}
      />

      {/* Círculo izquierdo medio */}
      <div
        className="hidden md:block absolute w-[120px] h-[120px] lg:w-[188px] lg:h-[188px] -left-[30px] lg:-left-[14px] top-[600px] lg:top-[848px] rounded-full pointer-events-none"
        style={circleStyle}
      />

      {/* Círculos adicionales distribuidos */}
      <div
        className="hidden xl:block absolute w-[196px] h-[199px] left-[300px] 2xl:left-[407px] top-[1200px] 2xl:top-[1580px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />

      <div
        className="hidden xl:block absolute w-[200px] h-[200px] 2xl:w-[264px] 2xl:h-[264px] right-[50px] 2xl:right-[100px] top-[1300px] 2xl:top-[1549px] rounded-full pointer-events-none"
        style={circleStyle}
      />

      <div
        className="hidden xl:block absolute w-[220px] h-[223px] 2xl:w-[268px] 2xl:h-[271px] right-[100px] 2xl:right-[150px] top-[1800px] 2xl:top-[2194px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />

      <div
        className="hidden xl:block absolute w-[220px] h-[223px] 2xl:w-[268px] 2xl:h-[271px] left-[20px] 2xl:left-[33px] top-[2400px] 2xl:top-[2908px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />

      <div
        className="hidden xl:block absolute w-[110px] h-[112px] 2xl:w-[134px] 2xl:h-[136px] left-[350px] 2xl:left-[509px] top-[3000px] 2xl:top-[3648px] rotate-[54deg] rounded-full pointer-events-none"
        style={circleWithShadow}
      />
    </>
  );
};
