import React from 'react';

type LoadingSize = 'sm' | 'md' | 'lg';
type LoadingPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars';

interface LoadingProps {
  size?: LoadingSize;
  position?: LoadingPosition;
  label?: string;
  overlay?: boolean;
  variant?: LoadingVariant;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'lg',
  position = 'center',
  label,
  overlay = true,
  variant = 'spinner',
  fullScreen = true,
}) => {
  const sizeClasses = {
    sm: { container: 'h-5 w-5', label: 'text-xs' },
    md: { container: 'h-8 w-8', label: 'text-sm' },
    lg: { container: 'h-10 w-10', label: 'text-base' },
  };

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  const containerPadding = {
    sm: 'p-2.5',
    md: 'p-3.5',
    lg: 'p-4',
  };

  const barHeight = {
    sm: '12px',
    md: '16px',
    lg: '20px',
  };

  const SpinnerVariant = () => (
    <div
      className={`${sizeClasses[size].container} rounded-full border-[3px] border-mi-primera/20 border-t-mi-tercera animate-spin flex-shrink-0`}
    />
  );

  const DotsVariant = () => (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-mi-gradient"
          style={{
            animation: 'loadingPulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );

  const PulseVariant = () => (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size].container} rounded-full bg-mi-gradient animate-pulse`}
      />
      <div
        className={`${sizeClasses[size].container} rounded-full bg-mi-tercera absolute inset-0 animate-ping opacity-40`}
      />
    </div>
  );

  const BarsVariant = () => (
    <div className="flex items-center gap-1 flex-shrink-0">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-mi-gradient"
          style={{
            height: barHeight[size],
            animation: 'loadingPulse 0.6s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  const getVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsVariant />;
      case 'pulse':
        return <PulseVariant />;
      case 'bars':
        return <BarsVariant />;
      default:
        return <SpinnerVariant />;
    }
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 z-[999] flex items-center justify-center'
    : `fixed z-[999] pointer-events-none ${positionClasses[position]}`;

  return (
    <>
      {overlay && (
        <div className="dm-overlay fixed inset-0 z-[998] bg-mi-primera/10 backdrop-blur-[2px]" />
      )}

      <div className={containerClass}>
        <div
          className={`
            ${containerPadding[size]}
            rounded-3xl bg-white border border-mi-primera/15 shadow-xl shadow-mi-cuarta/15
            flex items-center gap-3
            transition-all duration-300
          `}
        >
          {getVariant()}
          {label && (
            <span className={`${sizeClasses[size].label} font-semibold text-mi-cuarta whitespace-nowrap`}>
              {label}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default Loading;