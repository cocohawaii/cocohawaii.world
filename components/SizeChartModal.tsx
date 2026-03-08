'use client';

import { useEffect } from 'react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Average hat sizes data
  const sizeData = [
    { size: 'XS', circumference: '21" (53 cm)', uk: '6 1/2', us: '6 5/8' },
    { size: 'S', circumference: '21.5" (55 cm)', uk: '6 5/8', us: '6 3/4' },
    { size: 'M', circumference: '22" (56 cm)', uk: '6 3/4', us: '6 7/8' },
    { size: 'L', circumference: '22.5" (57 cm)', uk: '6 7/8', us: '7' },
    { size: 'XL', circumference: '23" (58 cm)', uk: '7', us: '7 1/8' },
    { size: 'XXL', circumference: '23.5" (60 cm)', uk: '7 1/8', us: '7 1/4' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Hat Size Chart</h2>
          <p className="text-gray-600 text-center mb-8">
            Find your perfect hat size by measuring around your head, just above your ears and eyebrows.
          </p>

          {/* Size Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Size</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Circumference</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">UK Size</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">US Size</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 px-4 py-3 font-semibold">{row.size}</td>
                    <td className="border border-gray-300 px-4 py-3">{row.circumference}</td>
                    <td className="border border-gray-300 px-4 py-3">{row.uk}</td>
                    <td className="border border-gray-300 px-4 py-3">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measurement Instructions */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">How to Measure</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Wrap a measuring tape around your head, positioned about 1/8 inch above your ear, across the mid-forehead, completely circling your head.</li>
              <li>Make sure the tape is level and snug, but not tight.</li>
              <li>Note the measurement in inches or centimeters.</li>
              <li>Compare your measurement to the size chart above to find your perfect fit.</li>
            </ol>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Tip:</strong> If you're between sizes, we recommend sizing up for a more comfortable fit. 
              All CocoHawaii hats are adjustable and designed to accommodate slight variations in head size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
