"use client";
import React, { useRef, useState, useEffect } from "react";

export default function DrawingCanvasApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState("brush");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
    ctxRef.current = ctx;
    }
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    if (tool === "brush") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !canvasRef.current || !startPos) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = ctxRef.current;

    if (tool === "brush") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.clearRect(x - 5, y - 5, 10, 10);
    } else {
      ctx.putImageData(history[history.length - 1], 0, 0);
      ctx.beginPath();
      if (tool === "rectangle") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.closePath();
    }
  };

  const stopDrawing = () => {
    ctxRef.current?.closePath();
    setIsDrawing(false);
    setStartPos(null);
  };

  const undo = () => {
    if (!canvasRef.current || history.length === 0) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const newHistory = [...history];
    const lastState = newHistory.pop();
    setHistory(newHistory);
    if (lastState && ctx) {
      ctx.putImageData(lastState, 0, 0);
    }
  };

  const redo = () => {
    if (!canvasRef.current || redoStack.length === 0) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const nextState = redoStack.pop();
    if (nextState && ctx) {
      ctx.putImageData(nextState, 0, 0);
      setHistory((prev) => [...prev, nextState]);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory([]);
      setRedoStack([]);
    }
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-4">🎨 Let's Get Creative!</h1>
      <div className="mb-4 flex flex-wrap gap-4 justify-center">
        <label className="flex items-center gap-2">
          🖌️ Color:
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          📏 Size:
          <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} />
        </label>
        <button onClick={() => setTool("brush")} className={`px-3 py-1 rounded ${tool === "brush" ? "bg-pink-500 text-white" : "bg-pink-200"}`}>
          Brush
        </button>
        <button onClick={() => setTool("eraser")} className={`px-3 py-1 rounded ${tool === "eraser" ? "bg-yellow-500 text-white" : "bg-yellow-200"}`}>
          Eraser
        </button>
        <button onClick={() => setTool("rectangle")} className={`px-3 py-1 rounded ${tool === "rectangle" ? "bg-teal-500 text-white" : "bg-teal-200"}`}>
          Rectangle
        </button>
        <button onClick={() => setTool("circle")} className={`px-3 py-1 rounded ${tool === "circle" ? "bg-blue-500 text-white" : "bg-blue-200"}`}>
          Circle
        </button>
        <button onClick={undo} className="px-3 py-1 bg-yellow-400 rounded">Undo</button>
        <button onClick={redo} className="px-3 py-1 bg-indigo-400 text-white rounded">Redo</button>
        <button onClick={clearCanvas} className="px-3 py-1 bg-red-500 text-white rounded">Clear</button>
        <button onClick={saveImage} className="px-3 py-1 bg-green-500 text-white rounded">Save</button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-400 rounded shadow-md bg-white"
      ></canvas>
    </div>
  );
}
