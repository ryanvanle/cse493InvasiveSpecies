importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose');

let model = null;
handpose.load().then(loadedModel => {
  model = loadedModel;
  self.postMessage({ status: 'modelLoaded' });
});


self.onmessage = async function(e) {
    if (!model) return;
  
    const { imageBitmap } = e.data;
  
    try {
      const predictions = await model.estimateHands(imageBitmap);
      self.postMessage({ status: 'success', predictions: predictions[0] });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  };
