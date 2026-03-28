import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            This is an unofficial fan-made character builder tool, not affiliated with or endorsed by Dyskami Publishing Company.
          </p>
          <p className="text-xs text-gray-500">
            © 2023 | BESM and Tri-Stat System are trademarks of Dyskami Publishing Company
          </p>
        </div>
      </div>
    </footer>
  );
};