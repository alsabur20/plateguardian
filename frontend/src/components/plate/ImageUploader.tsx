import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0 && !isLoading) {
      const file = acceptedFiles[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    }
  }, [onImageUpload, isLoading]);
  
  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    disabled: isLoading,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 dark:border-gray-700 hover:border-primary/70 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        } ${isDragReject ? 'border-error bg-error/5' : ''} ${
          isLoading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        <input {...getInputProps()} disabled={isLoading} />
        
        <div className="text-center">
          {isDragActive ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              <ImageIcon size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">Drop the image here</p>
            </motion.div>
          ) : (
            <>
              <Upload size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drag and drop an image here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </>
          )}
        </div>
        
        {isDragReject && (
          <div className="absolute inset-0 bg-error/5 flex items-center justify-center rounded-lg">
            <p className="text-error font-medium">File type not supported</p>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-2"></div>
              <p className="text-primary font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ImageUploader;