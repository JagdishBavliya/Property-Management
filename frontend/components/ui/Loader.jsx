const Loader = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className={`${sizeClass} border-gray-200 rounded-full`}></div>
        <div className={`absolute top-0 left-0 ${sizeClass} border-primary-600 rounded-full border-t-transparent animate-spin`}></div>
      </div>
    </div>
  );
};

export default Loader;