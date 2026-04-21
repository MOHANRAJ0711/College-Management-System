import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';

let modelsLoaded = false;
let loadingPromise = null;

export async function loadModels() {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]).then(() => {
    modelsLoaded = true;
  });

  return loadingPromise;
}

export async function detectSingleFace(imageElement) {
  const detection = await faceapi
    .detectSingleFace(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ?? null;
}

export async function detectAllFaces(imageElement) {
  const detections = await faceapi
    .detectAllFaces(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptors();
  return detections;
}

export function matchFaces(unknownDescriptors, knownFaces, threshold = 0.6) {
  const labeledDescriptors = knownFaces
    .filter((f) => f.descriptor)
    .map(
      (f) =>
        new faceapi.LabeledFaceDescriptors(
          JSON.stringify({ id: f.studentId, name: f.name, roll: f.rollNumber }),
          [new Float32Array(f.descriptor)]
        )
    );

  if (labeledDescriptors.length === 0) return [];

  const matcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);

  return unknownDescriptors.map((detection) => {
    const best = matcher.findBestMatch(detection.descriptor);
    const matched = best.label !== 'unknown';
    let studentInfo = null;
    if (matched) {
      try {
        studentInfo = JSON.parse(best.label);
      } catch {
        studentInfo = { name: best.label };
      }
    }
    return {
      detection,
      matched,
      distance: best.distance,
      studentInfo,
      box: detection.detection.box,
    };
  });
}

export function drawDetections(canvas, imageElement, results) {
  const displaySize = {
    width: imageElement.width,
    height: imageElement.height,
  };
  faceapi.matchDimensions(canvas, displaySize);

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  results.forEach((r) => {
    const box = r.box;
    const resizedBox = faceapi.resizeResults(
      { box: new faceapi.Rect(box.x, box.y, box.width, box.height) },
      displaySize
    ).box;

    ctx.strokeStyle = r.matched ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(resizedBox.x, resizedBox.y, resizedBox.width, resizedBox.height);

    const distLabel = ` (${r.distance.toFixed(2)})`;
    const label = (r.matched ? r.studentInfo?.name ?? 'Matched' : 'Unknown') + distLabel;
    
    ctx.fillStyle = r.matched ? '#22c55e' : '#ef4444';
    const fontSize = Math.max(12, Math.min(16, resizedBox.width / 6));
    ctx.font = `bold ${fontSize}px sans-serif`;

    const textWidth = ctx.measureText(label).width;
    const textX = resizedBox.x;
    const textY = resizedBox.y - 4;

    ctx.fillRect(textX - 1, textY - fontSize - 2, textWidth + 6, fontSize + 6);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, textX + 2, textY - 1);
  });
}

export { faceapi };
