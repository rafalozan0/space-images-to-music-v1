// client/src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from '@tensorflow-models/mobilenet';
import axios from 'axios';
import './index.css'; // Importa los estilos globales

const analyzeImage = async (imageElement) => {
  try {
    const model = await mobilenet.load();
    const predictions = await model.classify(imageElement);
    return predictions;
  } catch (error) {
    console.error('Error loading model or classifying image:', error);
  }
};

const generateRandomData = (length) => {
  return Array.from({ length }, () => ({
    value: Math.floor(Math.random() * 100),
  }));
};

const SpaceImageToMusicApp = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageUrl, setImageUrl] = useState('/images/background.jpg'); // Ruta a la imagen de fondo
  const [audioData, setAudioData] = useState(generateRandomData(50));
  const [imageData, setImageData] = useState(generateRandomData(50));
  const [isProcessed, setIsProcessed] = useState(false);
  const [modulationDepth, setModulationDepth] = useState(50);
  const [reverbLevel, setReverbLevel] = useState(0.5);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainNodesRef = useRef([]);
  const imageRef = useRef(null);

  useEffect(() => {
    tf.setBackend('webgl')
      .then(() => {
        console.log('WebGL backend set');
      })
      .catch((error) => {
        console.error('Error setting backend:', error);
      });

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const createNoiseNode = useCallback(() => {
    const bufferSize = 4096;
    const whiteNoise = audioContextRef.current.createScriptProcessor(
      bufferSize,
      1,
      1
    );
    whiteNoise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    };
    return whiteNoise;
  }, []);

  const modulateOverTime = useCallback(
    (audioParam, baseValue, modulationAmount, modulationSpeed) => {
      const ctx = audioContextRef.current;
      const modulationOsc = ctx.createOscillator();
      const modulationGain = ctx.createGain();

      modulationOsc.frequency.setValueAtTime(modulationSpeed, ctx.currentTime);
      modulationGain.gain.setValueAtTime(modulationAmount, ctx.currentTime);

      modulationOsc.connect(modulationGain);
      modulationGain.connect(audioParam);

      audioParam.setValueAtTime(baseValue, ctx.currentTime);
      modulationOsc.start();
    },
    []
  );

  const playCosmicSound = useCallback(() => {
    const ctx = audioContextRef.current;

    // Crear ruido blanco
    noiseNodeRef.current = createNoiseNode();
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
    noiseNodeRef.current.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Crear osciladores armónicos
    const baseFreq = 55; // Nota A1
    const harmonics = [1, 2, 3, 5, 8]; // Armónicos de Fibonacci

    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Usar síntesis FM
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      modulator.frequency.setValueAtTime(
        baseFreq * harmonic * 0.5,
        ctx.currentTime
      );
      modGain.gain.setValueAtTime(modulationDepth, ctx.currentTime);
      modulator.connect(modGain);
      modGain.connect(osc.frequency);

      osc.type = index % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(baseFreq * harmonic, ctx.currentTime);

      gain.gain.setValueAtTime(0.1 / (index + 1), ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      modulator.start();
      oscillatorsRef.current.push(osc);
      gainNodesRef.current.push(gain);

      // Modular frecuencia y volumen con el tiempo
      modulateOverTime(osc.frequency, baseFreq * harmonic, 20, 5);
      modulateOverTime(gain.gain, 0.1 / (index + 1), 0.05, 8);
    });
  }, [createNoiseNode, modulateOverTime, modulationDepth]);

  const stopCosmicSound = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.disconnect();
    }
    oscillatorsRef.current.forEach((osc) => osc.stop());
    gainNodesRef.current.forEach((gain) => gain.disconnect());
    oscillatorsRef.current = [];
    gainNodesRef.current = [];
  }, []);

  useEffect(() => {
    if (isProcessed) {
      if (isPlaying) {
        playCosmicSound();
      } else {
        stopCosmicSound();
      }
    }
  }, [isPlaying, isProcessed, playCosmicSound, stopCosmicSound]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        setIsProcessed(false);
      };
      reader.readAsDataURL(file);
      await axios.post('/api/upload', formData);
    }
  };

  const processImage = async () => {
    if (imageRef.current) {
      const predictions = await analyzeImage(imageRef.current);
      console.log(predictions); // Usar las predicciones para modificar el sonido
      setImageData(generateRandomData(50));
      setAudioData(generateRandomData(50));
      setIsProcessed(true);
    }
  };

  const togglePlayback = () => {
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Overlay para mejorar la legibilidad del contenido */}
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>

      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/background.jpg" // Ruta a la imagen de fondo
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 p-4 flex flex-col items-center justify-start">
        <h1 className="text-4xl font-bold mb-8 text-center">Explorador Cósmico Musical</h1>

        <div className="mb-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            type="file"
            onChange={handleImageUpload}
            className="hidden"
            id="imageUpload"
          />
          <label
            htmlFor="imageUpload"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer transition duration-300 ease-in-out transform hover:scale-105"
          >
            Subir Imagen del Espacio
          </label>
          <button
            onClick={processImage}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
            disabled={!imageUrl || imageUrl === '/images/background.jpg'}
          >
            Procesar Imagen
          </button>
        </div>

        <img
          ref={imageRef}
          src={imageUrl}
          alt="Imagen espacial"
          className="w-full max-w-2xl rounded-lg shadow-lg mb-8 transition-transform duration-300 transform hover:scale-105"
        />

        {isProcessed && (
          <>
            <div className="w-full max-w-2xl mb-8">
              <h2 className="text-2xl font-semibold mb-4">Histograma de la Imagen</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={imageData}>
                  <XAxis dataKey="name" stroke="#ffffff" />
                  <YAxis stroke="#ffffff" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full max-w-2xl mb-8">
              <h2 className="text-2xl font-semibold mb-4">Histograma del Audio</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={audioData}>
                  <XAxis dataKey="name" stroke="#ffffff" />
                  <YAxis stroke="#ffffff" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => {}} className="text-white hover:text-cosmic-accent transition duration-300">
                <SkipBack size={24} />
              </button>
              <button onClick={togglePlayback} className="text-white hover:text-cosmic-accent transition duration-300">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={() => {}} className="text-white hover:text-cosmic-accent transition duration-300">
                <SkipForward size={24} />
              </button>
            </div>

            <div className="w-full max-w-2xl mb-8">
              <h2 className="text-2xl font-semibold mb-4">Controles de Audio</h2>
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white">Profundidad de Modulación</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={modulationDepth}
                    onChange={(e) => setModulationDepth(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">Nivel de Reverberación</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={reverbLevel}
                    onChange={(e) => setReverbLevel(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpaceImageToMusicApp;