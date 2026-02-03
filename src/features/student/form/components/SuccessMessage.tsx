/**
 * Componente de Mensaje de Éxito - Sociograma
 * Se muestra cuando la encuesta se envía correctamente
 */

interface SuccessMessageProps {
  studentName: string;
}

export const SuccessMessage = ({ studentName }: SuccessMessageProps) => {
  return (
    <div className="w-full max-w-2xl p-8 sm:p-12 md:p-16 bg-white/80 shadow-[0px_8px_24px_rgba(0,0,0,0.24)] rounded-2xl border-2 border-[#0F7E3C] flex flex-col justify-center items-center gap-6 text-center">
      {/* Icono de éxito */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-[#0F7E3C]/10 flex items-center justify-center">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#0F7E3C]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* Título */}
      <h2 className="text-[#0F7E3C] text-2xl sm:text-3xl md:text-4xl font-bold font-lato">
        ¡Encuesta Enviada!
      </h2>
      
      {/* Mensaje */}
      <p className="text-[#245C52] text-lg sm:text-xl md:text-2xl font-medium font-lato">
        Gracias <span className="font-bold">{studentName}</span> por completar la encuesta del Sociograma.
      </p>
      
      <p className="text-[#245C52]/70 text-base sm:text-lg font-normal font-lato">
        Tus respuestas han sido registradas correctamente.
      </p>
      
      {/* Decoración */}
      <div className="flex gap-2 mt-4">
        <div className="w-3 h-3 rounded-full bg-[#0F7E3C]" />
        <div className="w-3 h-3 rounded-full bg-[#245C52]" />
        <div className="w-3 h-3 rounded-full bg-[#7A1501]" />
      </div>
    </div>
  );
};
