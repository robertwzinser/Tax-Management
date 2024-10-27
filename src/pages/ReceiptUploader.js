import React, { useState, useEffect } from 'react';
import { storage, db, auth } from '../firebase'; // Import Firebase configuration
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, push, set, onValue, remove, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import './ReceiptUploader.css';

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [description, setDescription] = useState('');
  const [taxYear, setTaxYear] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [documents, setDocuments] = useState([]);
  const [editId, setEditId] = useState(null);
  const userId = auth.currentUser?.uid; // Get the current user's ID

  useEffect(() => {
    if (userId) {
      // Fetch documents for the logged-in user from Firebase
      const userDocumentsRef = dbRef(db, `documents/${userId}`);
      onValue(userDocumentsRef, (snapshot) => {
        const data = snapshot.val();
        const documentsList = data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [];
        setDocuments(documentsList);
      });
    }
  }, [userId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewURL(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file || !description || !taxYear || !userId) {
      setUploadStatus('Please fill in all fields before uploading.');
      return;
    }

    const uniqueFileName = `uploads/${userId}/${taxYear}/${uuidv4()}-${file.name}`;
    const fileRef = storageRef(storage, uniqueFileName);

    try {
      await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(fileRef);

      // Save file metadata to Firebase Realtime Database under the user's ID
      const userDocumentRef = push(dbRef(db, `documents/${userId}`));
      await set(userDocumentRef, {
        fileURL,
        description,
        taxYear,
        fileName: file.name,
        storagePath: uniqueFileName
      });

      setUploadStatus('File uploaded successfully!');
      setFile(null);
      setPreviewURL('');
      setDescription('');
      setTaxYear('');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('Upload failed. Please try again.');
    }
  };

  const handleDelete = async (docId, storagePath) => {
    try {
      const fileRef = storageRef(storage, storagePath);
      await deleteObject(fileRef);

      await remove(dbRef(db, `documents/${userId}/${docId}`));
      setUploadStatus('Document deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      setUploadStatus('Delete failed. Please try again.');
    }
  };

  const handleEdit = (doc) => {
    setEditId(doc.id);
    setDescription(doc.description);
    setTaxYear(doc.taxYear);
  };

  const handleUpdate = async () => {
    if (!description || !taxYear) {
      setUploadStatus('Please fill in all fields to update.');
      return;
    }

    try {
      await update(dbRef(db, `documents/${userId}/${editId}`), { description, taxYear });
      setUploadStatus('Document updated successfully!');
      setEditId(null);
      setDescription('');
      setTaxYear('');
    } catch (error) {
      console.error('Update failed:', error);
      setUploadStatus('Update failed. Please try again.');
    }
  };

  return (
    <div className="receipt-uploader">
      <h2>Receipt and Document Management</h2>

      {previewURL && <img src={previewURL} alt="Preview" className="preview-image" />}

      <div className="form-section">
        <label className="form-label">Upload File</label>
        <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
      </div>

      <div className="form-section">
        <label className="form-label">Description</label>
        <input
          type="text"
          placeholder="Enter a description for the document"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-section">
        <label className="form-label">Tax Year</label>
        <input
          type="number"
          min="2000"
          max="2099"
          placeholder="Enter tax year"
          value={taxYear}
          onChange={(e) => setTaxYear(e.target.value)}
        />
      </div>

      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

      {editId ? (
        <button onClick={handleUpdate} className="upload-button">Update Document</button>
      ) : (
        <button onClick={handleUpload} className="upload-button">Upload Document</button>
      )}

      <h3>Uploaded Documents</h3>
      <ul className="document-list">
        {documents.map((doc) => (
          <li key={doc.id}>
            <a href={doc.fileURL} target="_blank" rel="noopener noreferrer">View Document</a>
            <p>Description: {doc.description}</p>
            <p>Tax Year: {doc.taxYear}</p>
            <button onClick={() => handleEdit(doc)}>Edit</button>
            <button onClick={() => handleDelete(doc.id, doc.storagePath)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReceiptUploader;
