import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlateResult } from "../types";
import ImageUploader from "../components/plate/ImageUploader";
import ResultCard from "../components/plate/ResultCard";
import { recognizePlate } from "../services/plateService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const HomePage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const { user, sPublicKey } = useAuth();

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);

    if (!user?.apiKey || !sPublicKey) {
      toast.error("Authentication required");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await recognizePlate(file, user.apiKey, sPublicKey);

      if (response.success && response.data) {
        console.log(response);
        setResult({
          id: "5",
          imageUrl: URL.createObjectURL(file), // Create URL from uploaded file
          extractedText: response.data.extracted_text,
          timestamp: new Date(),
          userId: "",
        });
      } else {
        toast.error(response.error || "Failed to process image");
      }
    } catch (error) {
      toast.error("An error occurred while processing the image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          License Plate Recognition
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        >
          Upload an image containing a license plate to extract the text
        </motion.p>
      </div>

      <ImageUploader
        onImageUpload={handleImageUpload}
        isLoading={isProcessing}
      />

      {result && !isProcessing && (
        <div className="mt-8">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="w-full md:w-1/2">
              <img
                src={result.imageUrl}
                alt="Uploaded license plate"
                className="rounded-lg shadow-md w-full max-h-96 object-contain"
              />
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Extracted Text
              </h2>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-3xl font-mono font-bold text-center text-gray-900 dark:text-white">
                  {result.extractedText}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <div className="text-gray-500 dark:text-gray-400">
            <p className="mb-2">No images processed yet</p>
            <p className="text-sm">Upload an image to see the results</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
