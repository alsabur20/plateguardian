import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { PlateResult } from "../types";
import ImageUploader from "../components/plate/ImageUploader";
import ResultCard from "../components/plate/ResultCard";
import { recognizePlate, getPlateHistory } from "../services/plateService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const HomePage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const [history, setHistory] = useState<PlateResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await getPlateHistory();
      if (response.success && response.data) {
        setHistory(response.data);
      }
    };

    fetchHistory();
  }, []);

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);

    try {
      const response = await recognizePlate(file, "123123");

      if (response.success && response.data) {
        setResult(response.data);
        setHistory((prev) => {
          if (!prev.find((item) => item.id === response.data!.id)) {
            return [response.data!, ...prev];
          }
          return prev;
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

  const handleSelectFromHistory = (item: PlateResult) => {
    setResult(item);
    setShowHistory(false);
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
          Upload an image containing a license plate, and we'll extract the text
          for you. Get accurate results in seconds.
        </motion.p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        >
          <History size={18} className="mr-1" />
          {showHistory ? "Hide History" : "View History"}
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 overflow-hidden"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Recent Scans
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectFromHistory(item)}
                className="cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors duration-200"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.imageUrl}
                    alt="License plate"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-2 text-center">
                  <div className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.extractedText}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <ImageUploader
        onImageUpload={handleImageUpload}
        isLoading={isProcessing}
      />

      {result && !isProcessing && (
        <ResultCard
          imageUrl={result.imageUrl}
          extractedText={result.extractedText}
          confidence={result.confidence}
        />
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
