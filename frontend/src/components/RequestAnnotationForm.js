// frontend/src/components/RequestAnnotationForm.js
import React, { useState } from 'react';
import API from '../services/api';
import '../styles/RequestAnnotationForm.css';

function RequestAnnotationForm({ onClose }) {
  const [description, setDescription] = useState('');
  const [deliveryType, setDeliveryType] = useState('Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [annotationType, setAnnotationType] = useState('bounding box annotation');

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  // Handle folder/file selection
  const handleFolderChange = (e) => {
    // Convert FileList to an array with relative paths
    const filesArr = Array.from(e.target.files).map((file) => ({
      file,
      relPath: file.webkitRelativePath,
    }));
    setSelectedFiles(filesArr);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('delivery_type', deliveryType);
      formData.append('special_instructions', specialInstructions);
      formData.append('annotation_type', annotationType);

      // Append files and their relative paths
      selectedFiles.forEach(({ file, relPath }) => {
        formData.append('files', file);
        formData.append('paths', relPath);
      });

      await API.post('/auth/requests-with-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onClose(); // Close the modal/form on success
    } catch (err) {
      console.error('[RequestAnnotationForm] error:', err);
      setError(err.response?.data?.error || 'Error submitting request.');
    }
  };

  return (
    <div className="request-form-overlay" onClick={onClose}>
      <div
        className="request-form-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-annotation-title"
      >
        <h2 id="request-annotation-title">Request Annotation</h2>
        {error && <div className="error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              aria-required="true"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="deliveryType">Delivery Type:</label>
            <select
              id="deliveryType"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option value="Regular">Regular</option>
              <option value="Express">Express</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="annotationType">Annotation Type:</label>
            <select
              id="annotationType"
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
            >
              <option value="bounding box annotation">Bounding Box Annotation</option>
              <option value="polygon annotation">Polygon Annotation</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="specialInstructions">Special Instructions:</label>
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="files">Upload Folder(s):</label>
            {/* Multiple, directory, and webkitdirectory for folder selection */}
            <input
              type="file"
              multiple
              directory=""
              webkitdirectory=""
              id="files"
              onChange={handleFolderChange}
              aria-label="Upload Folder(s)"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-button">Submit Request</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestAnnotationForm;
