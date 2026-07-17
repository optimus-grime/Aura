import { auth } from '../firebase';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Base64 to Float32Array PCM encoding/decoding is needed
 * since the model requires audio/pcm;rate=16000 and returns the same.
 */
function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Data is 16-bit PCM. We need to convert it to Float32 for Web Audio API.
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

function float32ArrayToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useLiveAudio() {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // If the AI is speaking
  const [userIsSpeaking, setUserIsSpeaking] = useState(false); // If user is making noise (volume based)
  const [report, setReport] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const nextStartTimeRef = useRef<number>(0);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsConnected(false);
    setIsSpeaking(false);
    setUserIsSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    disconnect();
    setIsError(false);
    setReport(null);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser); // Connect to analyser to measure user volume

      // Use a larger buffer size
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = await auth.currentUser?.getIdToken();
      const wsUrl = `${protocol}//${window.location.host}/live?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64 = float32ArrayToBase64(inputData);
          ws.send(JSON.stringify({ type: 'audio', audio: base64 }));
        }
      };

      const checkVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        
        setUserIsSpeaking(average > 10);
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsError(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'connected') {
            setIsConnected(true);
          } else if (msg.type === 'error') {
            console.error('Server error:', msg.error);
            setIsError(true);
            disconnect();
          } else if (msg.type === 'interrupted') {
             nextStartTimeRef.current = audioCtx.currentTime;
             setIsSpeaking(false);
          } else if (msg.type === 'audio' && msg.audio) {
            const float32Data = base64ToFloat32Array(msg.audio);
            playAudioChunk(float32Data);
          } else if (msg.type === 'analysis_complete') {
            setReport(msg.report);
            setIsSpeaking(false);
          }
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };

      const playAudioChunk = (audioData: Float32Array) => {
        if (!audioCtxRef.current) return;
        
        const audioBuffer = audioCtxRef.current.createBuffer(1, audioData.length, 24000);
        audioBuffer.getChannelData(0).set(audioData);

        const sourceNode = audioCtxRef.current.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioCtxRef.current.destination);

        const currentTime = audioCtxRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
          nextStartTimeRef.current = currentTime;
        }

        sourceNode.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;

        setIsSpeaking(true);
        sourceNode.onended = () => {
          if (audioCtxRef.current && audioCtxRef.current.currentTime >= nextStartTimeRef.current) {
            setIsSpeaking(false);
          }
        };
      };

    } catch (err) {
      console.error('Failed to connect', err);
      setIsError(true);
      disconnect();
    }
  }, [disconnect]);

  return {
    isConnected,
    isError,
    isSpeaking,
    userIsSpeaking,
    report,
    connect,
    disconnect
  };
}
