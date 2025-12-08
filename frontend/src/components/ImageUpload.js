import React, { useRef, useState, useEffect } from "react";

export default function ImageUpload({ images = [], onChange, maxImages = 6 }) {
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [fileObjects, setFileObjects] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Update previews when images prop changes (for editing existing services)
  useEffect(() => {
    if (images && images.length > 0) {
      // Filter out File objects, keep only URLs/strings
      const urlImages = images.filter(img => typeof img === 'string');
      setPreviews(urlImages);
    } else {
      setPreviews([]);
    }
  }, [images]);

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - previews.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    const newFiles = [];
    const newPreviews = [...previews];

    filesToAdd.forEach(file => {
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target.result);
          if (newPreviews.length === previews.length + newFiles.length) {
            setPreviews(newPreviews);
            setFileObjects(prev => {
              const updated = [...prev, ...newFiles];
              // Call onChange with File objects for FormData
              onChange(updated);
              return updated;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (index) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    const updatedFiles = fileObjects.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setFileObjects(updatedFiles);
    // Pass File objects to parent
    onChange(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Service Images (Max {maxImages})
      </label>
      
      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {previews.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
            <p className="text-xs text-gray-400">
              {previews.length} / {maxImages} images
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
