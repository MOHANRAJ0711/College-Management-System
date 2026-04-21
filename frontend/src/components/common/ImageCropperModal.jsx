import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiZoomIn, FiCheck, FiX } from 'react-icons/fi';
import Modal from './Modal';
import { getCroppedImgBlob } from '../../utils/cropImage';

export default function ImageCropperModal({ isOpen, onClose, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImgBlob(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Profile Picture" size="lg">
      <div className="space-y-6">
        <div className="relative h-[400px] w-full bg-slate-100 rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <FiZoomIn className="text-slate-400 h-5 w-5" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <FiX className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition"
            >
              <FiCheck className="h-4 w-4" />
              Save Crop
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
