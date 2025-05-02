import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clipboard, Download } from 'lucide-react';
import { toast } from 'react-toastify';

interface ResultCardProps {
  imageUrl: string;
  extractedText: string;
  confidence?: number;
}

const ResultCard: React.FC<ResultCardProps> = ({
  imageUrl,
  extractedText,
  confidence,
}) => {
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success('Text copied to clipboard!');
  };

  const handleDownloadImage = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `plate-${extractedText}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden"
    >
      <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Recognition Result
        </h3>
        {confidence !== undefined && (
          <div className="flex items-center">
            <CheckCircle size={16} className="text-success mr-1" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={imageUrl}
                alt="License plate"
                className="object-contain w-full h-full"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleDownloadImage}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary inline-flex items-center"
              >
                <Download size={16} className="mr-1" />
                Save image
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Extracted Text
              </label>
              <div className="flex">
                <div className="flex-grow min-h-[100px] p-4 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 font-mono text-xl md:text-2xl flex items-center justify-center">
                  {extractedText || 'No text detected'}
                </div>
                <button
                  onClick={handleCopyText}
                  className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded-md"
                  title="Copy to clipboard"
                >
                  <Clipboard size={20} />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tips for better results:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                <li>Ensure the license plate is clearly visible</li>
                <li>Avoid extreme angles or distorted images</li>
                <li>Good lighting improves recognition accuracy</li>
                <li>Minimize background noise or distractions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;