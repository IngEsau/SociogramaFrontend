/**
 * Componente Header de la Encuesta - Sociograma
 * Muestra el título, logos e instrucciones según diseño Figma
 */

interface SurveyHeaderProps {
  groupName: string;
  questionnaireTitle?: string;
}

export const SurveyHeader = ({ groupName, questionnaireTitle }: SurveyHeaderProps) => {
  return (
    <div
      className="w-full p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 rounded-2xl border-l border-r border-b border-[#7A1501] border-t-[16px] flex flex-col justify-center items-center gap-2 sm:gap-4 backdrop-blur-[50px]"
      style={{
        background: 'rgba(255, 255, 255, 0.30)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
      }}
    >
      {/* Logos y Título - Siempre en fila */}
      <div className="w-full flex justify-between items-center gap-2 sm:gap-4">
        {/* Logo UTP */}
        <img
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-[100px] lg:h-[100px] xl:w-[122px] xl:h-[122px] opacity-90 object-contain flex-shrink-0"
          style={{ filter: 'drop-shadow(0px 0px 16px rgba(0, 0, 0, 0.24))' }}
          src="/Logo_UTP.png"
          alt="Logo UTP"
        />

        {/* Título */}
        <h1 className="flex-1 text-[#7A1501] text-base sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold font-lato text-center break-words">
          Encuesta - Sociograma {groupName || ''}
        </h1>

        {/* Logo Comité */}
        <img
          className="w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 lg:w-[120px] lg:h-[140px] xl:w-[154px] xl:h-[168px] object-contain flex-shrink-0"
          style={{ filter: 'drop-shadow(0px 0px 16px rgba(0, 0, 0, 0.24))' }}
          src="/Logo_Comite.png"
          alt="Logo Comité"
        />
      </div>

      {/* Título del cuestionario */}
      {questionnaireTitle && (
        <div className="w-full py-2 sm:py-3 border-t border-dashed border-[#7A1501]/30">
          <p className="text-center text-[#0F7E3C] text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold font-lato">
            Cuestionario: {questionnaireTitle}
          </p>
        </div>
      )}

      {/* Instrucciones */}
      <div className="w-full flex flex-col justify-start items-center gap-2 sm:gap-4 lg:gap-6">
        <p className="w-full text-justify text-[#245C52] text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl 2xl:text-[28px] font-medium font-lato">
          Por favor, recuerda completar todos los campos. En cada pregunta selecciona a <strong>3 compañeros</strong> ordenados según tu preferencia: primero a quien consideres que más corresponde, después a tu segunda opción y por último a tu tercera. Responde con sinceridad, no hay respuestas correctas ni incorrectas.
        </p>

        <p className="text-[#0F7E3C] text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl 2xl:text-[28px] font-bold font-lato">
          ¡Gracias por tu colaboración!
        </p>
      </div>
    </div>
  );
};
