'use client';
import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

export default function BarcodeScanner({ onScan }) {
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['ean_reader', 'upc_reader', 'code_128_reader'],
        },
      },
      (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          setIsLoading(false);
          return;
        }
        Quagga.start();
        setIsLoading(false);
      }
    );

    Quagga.onDetected((data) => {
      const barcode = data.codeResult.code;
      setScannedBarcode(barcode);
      onScan(barcode);
      Quagga.stop();
    });

    return () => {
      Quagga.stop();
    };
  }, [onScan]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 rounded-lg">
          <p className="text-gray-600">Initializing scanner...</p>
        </div>
      )}
      <div ref={videoRef} className="w-full h-64 bg-black rounded-lg" />
      {scannedBarcode && (
        <p className="mt-4 text-center text-gray-700">Scanned Barcode: {scannedBarcode}</p>
      )}
    </div>
  );
}