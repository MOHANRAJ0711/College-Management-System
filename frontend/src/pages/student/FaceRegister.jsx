import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCamera,
  FiCheckCircle,
  FiRefreshCw,
  FiUpload,
  FiUser,
} from 'react-icons/fi';
import api from '../../services/api';
import { loadModels, detectSingleFace } from '../../utils/faceApi';

const STATUS = { IDLE: 0, LOADING_MODELS: 1, READY: 2, DETECTING: 3, DETECTED: 4, SAVING: 5 };

export default function FaceRegister() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [registered, setRegistered] = useState(null);
  const [preview, setPreview] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [file, setFile] = useState(null);
  // eslint-disable-next-line
  const [faceBox, setFaceBox] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    api
      .get('/face-attendance/my-status')
      .then(({ data }) => setRegistered(data))
      .catch(() => {});
  }, []);

  const initModels = useCallback(async () => {
    if (status >= STATUS.READY) return;
    setStatus(STATUS.LOADING_MODELS);
    try {
      await loadModels();
      setStatus(STATUS.READY);
    } catch {
      toast.error('Failed to load face detection models');
      setStatus(STATUS.IDLE);
    }
  }, [status]);

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await initModels();
    setFile(f);
    setDescriptor(null);
    setFaceBox(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const startWebcam = async () => {
    await initModels();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'user' }, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
      });
      streamRef.current = stream;
      setWebcamActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera');
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
      setFile(f);
      setDescriptor(null);
      setFaceBox(null);
      setPreview(URL.createObjectURL(blob));
      stopWebcam();
    }, 'image/jpeg', 0.92);
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
  };

  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [webcamActive]);

  useEffect(() => () => stopWebcam(), []);

  const detectFace = async () => {
    if (!imgRef.current) return;
    setStatus(STATUS.DETECTING);
    try {
      const det = await detectSingleFace(imgRef.current);
      if (!det) {
        toast.error('No face detected. Please upload a clear, well-lit photo showing your face.');
        setStatus(STATUS.READY);
        return;
      }
      setDescriptor(Array.from(det.descriptor));
      setFaceBox(det.detection.box);
      setStatus(STATUS.DETECTED);
      drawBox(det.detection.box);
      toast.success('Face detected successfully!');
    } catch (err) {
      toast.error('Detection failed: ' + (err.message || 'Unknown error'));
      setStatus(STATUS.READY);
    }
  };

  const drawBox = (box) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = img.width / img.naturalWidth;
    const scaleY = img.height / img.naturalHeight;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      box.x * scaleX,
      box.y * scaleY,
      box.width * scaleX,
      box.height * scaleY
    );

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillRect(box.x * scaleX - 1, box.y * scaleY - 22, 110, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText('Face Detected ✓', box.x * scaleX + 4, box.y * scaleY - 6);
  };

  const handleRegister = async () => {
    if (!file || !descriptor) return;
    setStatus(STATUS.SAVING);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('descriptor', JSON.stringify(descriptor));

      await api.post('/face-attendance/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Face registered successfully!');
      setRegistered({ registered: true, updatedAt: new Date().toISOString() });
      setStatus(STATUS.READY);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed');
      setStatus(STATUS.DETECTED);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setDescriptor(null);
    setFaceBox(null);
    setStatus(STATUS.IDLE);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Face Registration
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register your face for automated attendance. Upload a clear photo or use your webcam.
        </p>
      </header>

      {registered?.registered && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <FiCheckCircle className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">Face Already Registered</p>
            <p className="text-sm text-emerald-700">
              Last updated: {new Date(registered.updatedAt).toLocaleDateString()}.
              You can re-register below to update your photo.
            </p>
          </div>
        </div>
      )}

      {status === STATUS.LOADING_MODELS && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-indigo-800">
            Loading face detection AI models...
          </p>
          <p className="text-xs text-indigo-600">This may take a moment on first load</p>
        </div>
      )}

      {!preview && !webcamActive && status !== STATUS.LOADING_MODELS && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 transition hover:border-indigo-300 hover:bg-indigo-50/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-200">
              <FiUpload className="h-7 w-7" />
            </div>
            <p className="font-semibold text-slate-900">Upload Photo</p>
            <p className="text-center text-xs text-slate-500">
              JPG, PNG — clear frontal face photo
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          <button
            type="button"
            onClick={startWebcam}
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 transition hover:border-indigo-300 hover:bg-indigo-50/30"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-200">
              <FiCamera className="h-7 w-7" />
            </div>
            <p className="font-semibold text-slate-900">Use Webcam</p>
            <p className="text-center text-xs text-slate-500">
              Capture a live photo from your camera
            </p>
          </button>
        </div>
      )}

      {webcamActive && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-xl bg-black"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={captureFromWebcam}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <FiCamera className="mr-2 inline h-4 w-4" />
              Capture Photo
            </button>
            <button
              type="button"
              onClick={stopWebcam}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative mx-auto" style={{ maxWidth: 480 }}>
            <img
              ref={imgRef}
              src={preview}
              alt="Your face"
              className="w-full rounded-xl"
              crossOrigin="anonymous"
              onLoad={() => {
                if (status >= STATUS.READY && !descriptor) detectFace();
              }}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute left-0 top-0 h-full w-full"
            />
          </div>

          {status === STATUS.DETECTING && (
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              Analyzing face...
            </div>
          )}

          {descriptor && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <FiUser className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                Face detected and descriptor computed (128 dimensions)
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {descriptor && (
              <button
                type="button"
                onClick={handleRegister}
                disabled={status === STATUS.SAVING}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {status === STATUS.SAVING ? (
                  <>
                    <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Registering...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2 inline h-4 w-4" />
                    {registered?.registered ? 'Update Face' : 'Register Face'}
                  </>
                )}
              </button>
            )}
            {!descriptor && status === STATUS.READY && (
              <button
                type="button"
                onClick={detectFace}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Detect Face
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className="mr-1 inline h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Tips for best results</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            Use good lighting — avoid shadows on your face
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            Face the camera directly — frontal view works best
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            Remove sunglasses or masks that cover your face
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            Only one face should be in the photo
          </li>
        </ul>
      </div>
    </div>
  );
}
