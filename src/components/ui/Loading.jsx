export const Loading = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-pardos-rust rounded-full animate-spin`}
      />
    </div>
  );
};

export const LoadingOverlay = ({ message = 'Cargando...', className = '' }) => {
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <Loading size="lg" />
        <p className="font-lato font-bold text-pardos-dark">{message}</p>
      </div>
    </div>
  );
};

