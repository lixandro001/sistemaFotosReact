import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoCapture.css';

const PhotoCapture = () => {
  const [image, setImage] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [cameraMode, setCameraMode] = useState('environment'); // Estado para elegir la cámara (trasera o frontal)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Función para iniciar la cámara
  const startCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraMode } // Especificar la cámara frontal o trasera
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        } else {
          console.error("Referencia de video no disponible.");
        }
      })
      .catch(error => {
        console.error("Error al acceder a la cámara:", error);
        if (error.name === "NotAllowedError") {
          alert("Permiso de la cámara denegado. Por favor, permite el acceso a la cámara.");
        } else if (error.name === "NotFoundError") {
          alert("No se encontró una cámara disponible en este dispositivo.");
        } else {
          alert("Error inesperado al acceder a la cámara.");
        }
      });
    } else {
      alert("La API de getUserMedia no está disponible en este navegador.");
    }
  };

  // Función para capturar una foto de la cámara
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL('image/jpeg'));
  };

  // Función para cargar las fotos guardadas desde la base de datos
  const loadPhotos = async () => {
    try {
      const response = await axios.get('https://servicioswebsapisfoto-c0e7f2fyh4eyachu.canadacentral-01.azurewebsites.net/api/Photos');
      const photos = response.data.map(photo => {
        const byteString = atob(photo.fileData);
        const mimeString = photo.contentType;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const imageUrl = URL.createObjectURL(blob);
        return {
          id: photo.id,
          fileName: photo.fileName,
          imageUrl
        };
      });
      setPhotos(photos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  // Cargar fotos al montar el componente
  useEffect(() => {
    loadPhotos();
  }, []);

  // Función para subir la foto capturada
  const uploadPhoto = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('fileData', dataURLtoFile(image, 'photo.jpg'));
    formData.append('fileName', 'photo.jpg');

    try {
      await axios.post('https://servicioswebsapisfoto-c0e7f2fyh4eyachu.canadacentral-01.azurewebsites.net/api/Photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Photo uploaded successfully');
      loadPhotos();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo');
    }
  };

  // Convertir dataURL a archivo
  const dataURLtoFile = (dataURL, filename) => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new File([new Uint8Array(array)], filename, { type: mime });
  };

  // Función para eliminar una foto
  const deletePhoto = async (id) => {
    try {
      await axios.post(`https://servicioswebsapisfoto-c0e7f2fyh4eyachu.canadacentral-01.azurewebsites.net/api/Photos/delete/${id}`);
      alert('Photo deleted successfully');
      loadPhotos();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    }
  };

  return (
    <div className="photo-capture">
      <select className="select-container"  onChange={(e) => setCameraMode(e.target.value)} value={cameraMode}>
        <option value="user">Frontal</option>
        <option value="environment">Trasera</option>
      </select>

      <br /> <br />

      <button className="button" onClick={startCamera}>Iniciar Cámara</button>
      <video ref={videoRef} className="video" />
      <button className="button" onClick={capturePhoto}>Tomar Foto</button>
      <canvas ref={canvasRef} className="canvas" />
      {image && <img src={image} alt="Captured" className="captured-image" />}
      {image && <button className="button" onClick={uploadPhoto}>Guardar Foto</button>}

      <h2>Galería de Fotos</h2>
      <div className="gallery">
        {photos.map(photo => (
          <div key={photo.id} className="photo-item">
            <img src={photo.imageUrl} alt={photo.fileName} className="photo-image" />
            <p className="photo-name">{photo.fileName}</p>
            <button
              onClick={() => deletePhoto(photo.id)}
              className="delete-button"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoCapture;
