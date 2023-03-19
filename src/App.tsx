import React, { useState } from 'react';
import { pipeline } from '@xenova/transformers';

function App() {
  const [predict, setPredict] = useState<Promise<any> | null>(null);
  const [inputText, setInputText] = useState('');
  const [prediction, setPrediction] = useState('');

  const loadModel = async () => {
    const model = await pipeline('text-classification');
    return model;
  }

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);

    let model = await predict;
    if (!model) {
      model = loadModel();
      setPredict(model);
      model = await model;
    }

    setPrediction(await model(event.target.value))
  };

  return (
    <div>
      <label htmlFor="input-text">Input Text:</label>
      <input id="input-text" type="text" value={inputText} onChange={handleInputChange} />
      {prediction && (
        <div>
          <h2>Prediction:</h2>
          <p>{JSON.stringify(prediction)}</p>
        </div>
      )}
    </div>
  );
}

export default App;
