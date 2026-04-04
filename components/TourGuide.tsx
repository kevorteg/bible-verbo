import React, { useState, useEffect } from 'react';
import { Joyride, Step, STATUS, EventData } from 'react-joyride';
import { MessageCircle, Headphones, Gamepad2, Sparkles } from 'lucide-react';

interface TourGuideProps {
  theme: string;
  startTour: boolean;
  onTourEnd: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ theme, startTour, onTourEnd }) => {
  const [run, setRun] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('verbo_tour_completed');
    if (startTour && !hasSeenTour) {
      // Small delay so the daily promise modal has time to fully close
      const timer = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  const isDark = theme === 'dark';

  const iconStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #ea580c, #c2410c)',
    marginBottom: '8px',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    color: '#ea580c',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: '13px',
    lineHeight: '1.65',
    opacity: 0.9,
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'left', fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={iconStyle}>
              <Sparkles size={16} color="#fff" />
            </div>
            <h2 style={{ ...titleStyle, marginBottom: 0 }}>¡Bienvenido a Verbo!</h2>
          </div>
          <p style={{ ...bodyStyle, fontWeight: 600, marginBottom: '6px' }}>
            La Palabra de Dios, enriquecida con el poder de la Inteligencia Artificial.
          </p>
          <p style={{ ...bodyStyle, opacity: 0.65 }}>
            Déjanos mostrarte las funciones más poderosas de la app en segundos.
          </p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '#tour-ia-assistant',
      content: (
        <div style={{ textAlign: 'left', fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={iconStyle}>
              <MessageCircle size={16} color="#fff" />
            </div>
            <h2 style={{ ...titleStyle, marginBottom: 0 }}>Asistente IA</h2>
          </div>
          <p style={bodyStyle}>
            Habla con <strong>Verbo</strong>, nuestro asistente. Pide devocionales, análisis teológicos o navega a cualquier pasaje solo escribiéndolo.
          </p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'left',
      spotlightPadding: 6,
      skipBeacon: true,
    },
    {
      target: '#tour-generador-podcast',
      content: (
        <div style={{ textAlign: 'left', fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={iconStyle}>
              <Headphones size={16} color="#fff" />
            </div>
            <h2 style={{ ...titleStyle, marginBottom: 0 }}>VerboCast</h2>
          </div>
          <p style={bodyStyle}>
            Genera un <strong>podcast narrado</strong> sobre el capítulo que lees. Elige el estilo —divertido, teológico o meditativo— y escucha la Palabra.
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightPadding: 6,
      skipBeacon: true,
    },
    {
      target: '#tour-arcade-biblico',
      content: (
        <div style={{ textAlign: 'left', fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={iconStyle}>
              <Gamepad2 size={16} color="#fff" />
            </div>
            <h2 style={{ ...titleStyle, marginBottom: 0 }}>Arcade Bíblico</h2>
          </div>
          <p style={bodyStyle}>
            Pon a prueba tu conocimiento con <strong>trivias bíblicas</strong>, gana medallas generadas por IA y sube de nivel aprendiendo la Palabra.
          </p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'right',
      spotlightPadding: 6,
      skipBeacon: true,
    },
  ];

  const handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem('verbo_tour_completed', 'true');
      onTourEnd();
    }
  };

  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const txtColor = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleEvent}
      options={{
        backgroundColor: bgColor,
        textColor: txtColor,
        primaryColor: '#ea580c',
        overlayColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 9999,
        showProgress: true,
        offset: 12,
        spotlightRadius: 10,
        arrowColor: bgColor,
        width: 320,
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: '¡Listo!',
        next: 'Siguiente →',
        nextWithProgress: 'Siguiente ({current} de {total})',
        skip: 'Saltar',
      }}
      styles={{
        tooltip: {
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          maxWidth: '320px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '0',
        },
        tooltipFooter: {
          marginTop: '16px',
        },
        buttonPrimary: {
          backgroundColor: '#ea580c',
          borderRadius: '8px',
          fontWeight: 900,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '10px 16px',
        },
        buttonBack: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontWeight: 700,
          fontSize: '11px',
          textTransform: 'uppercase',
        },
        buttonSkip: {
          color: isDark ? '#475569' : '#94a3b8',
          fontWeight: 700,
          fontSize: '11px',
          textTransform: 'uppercase',
        },
      }}
    />
  );
};
