import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cuboid as Cube, Eye, RotateCcw, Play, Pause, ZoomIn, ZoomOut, X, Settings } from 'lucide-react';

interface ARLearningProps {
  concept: string;
  onClose: () => void;
  quiz?: any;
}

const ARLearning: React.FC<ARLearningProps> = ({ concept, onClose, quiz }) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [currentModel, setCurrentModel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modelTypes = [
    { id: 'molecule', name: 'Molecule View', icon: '🧪' },
    { id: 'anatomy', name: 'Anatomy Model', icon: '🫀' },
    { id: 'circuit', name: 'Circuit Diagram', icon: '⚡' },
    { id: 'math', name: 'Math Visualization', icon: '📐' },
    { id: 'geography', name: 'Geography Model', icon: '🌍' }
  ];

  useEffect(() => {
    checkARSupport();
    initializeWebGL();
  }, []);

  const checkARSupport = async () => {
    try {
      if ('xr' in navigator) {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
      } else {
        setIsARSupported(false);
      }
    } catch (error) {
      console.error('AR support check failed:', error);
      setIsARSupported(false);
    }
  };

  const initializeWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear canvas
    gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Simple rotating cube demo
    renderDemo(gl);
  };

  const renderDemo = (gl: WebGLRenderingContext) => {
    // Vertex shader source
    const vertexShaderSource = `
      attribute vec3 position;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader source
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // Use program
    gl.useProgram(program);

    // Create cube vertices
    const vertices = new Float32Array([
      // Front face
      -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
      // Back face
      -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
      // Top face
      -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
      // Bottom face
      -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
      // Right face
       1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
      // Left face
      -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
    ]);

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Get attribute location
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'modelViewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix');
    const colorLocation = gl.getUniformLocation(program, 'color');

    // Set projection matrix
    const projectionMatrix = perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    // Animation loop
    let rotation = 0;
    const animate = () => {
      if (!isAnimating) return;

      rotation += 0.02;

      // Clear canvas
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Create model-view matrix
      const modelViewMatrix = multiply(
        translate(0, 0, -6),
        multiply(rotateY(rotation), rotateX(rotation * 0.7))
      );

      gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
      
      // Set color based on concept
      const color = getConceptColor(concept);
      gl.uniform3fv(colorLocation, color);

      // Draw cube
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
      gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
      gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);
      gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
      gl.drawArrays(gl.TRIANGLE_FAN, 20, 4);

      requestAnimationFrame(animate);
    };

    setIsAnimating(true);
    animate();
  };

  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const getConceptColor = (concept: string): number[] => {
    const colors = {
      'chemistry': [0.2, 0.8, 0.2],
      'biology': [0.8, 0.2, 0.2],
      'physics': [0.2, 0.2, 0.8],
      'math': [0.8, 0.8, 0.2],
      'geography': [0.2, 0.8, 0.8],
      'default': [0.5, 0.5, 0.8]
    };
    return colors[concept.toLowerCase()] || colors.default;
  };

  // Matrix math functions
  const perspective = (fov: number, aspect: number, near: number, far: number) => {
    const f = 1.0 / Math.tan(fov / 2);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]);
  };

  const translate = (x: number, y: number, z: number) => {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  };

  const rotateX = (angle: number) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ]);
  };

  const rotateY = (angle: number) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ]);
  };

  const multiply = (a: Float32Array, b: Float32Array) => {
    const result = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    return result;
  };

  const startAR = async () => {
    if (!isARSupported) {
      alert('AR is not supported on this device');
      return;
    }

    try {
      const session = await (navigator as any).xr.requestSession('immersive-ar');
      setIsARActive(true);
      // AR session handling would go here
    } catch (error) {
      console.error('Failed to start AR session:', error);
    }
  };

  const stopAR = () => {
    setIsARActive(false);
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full border border-white/20 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
              <Cube className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">AR Learning: {concept}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AR Canvas */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-lg"
            style={{ background: 'radial-gradient(circle, #1e1b4b 0%, #0f0f23 100%)' }}
          />
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AR Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AR Controls</h3>
            
            <div className="space-y-2">
              <button
                onClick={startAR}
                disabled={!isARSupported || isARActive}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isARSupported && !isARActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>{isARActive ? 'AR Active' : 'Start AR Experience'}</span>
                </div>
              </button>

              {isARActive && (
                <button
                  onClick={stopAR}
                  className="w-full py-3 px-4 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                >
                  Stop AR
                </button>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={toggleAnimation}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isAnimating
                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isAnimating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Play</span>
                  </div>
                )}
              </button>
              <button
                onClick={() => {
                  setIsAnimating(false);
                  setTimeout(() => {
                    initializeWebGL();
                    setIsAnimating(true);
                  }, 100);
                }}
                className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </div>
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">3D Models</h3>
            
            <div className="space-y-2">
              {modelTypes.map((model, index) => (
                <button
                  key={model.id}
                  onClick={() => setCurrentModel(index)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    currentModel === index
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{model.icon}</span>
                    <span className="font-medium">{model.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-white/5 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-2">About AR Learning</h3>
          <p className="text-white/70 text-sm mb-4">
            Experience immersive 3D visualizations that help you understand complex concepts through interactive models. 
            AR learning makes abstract ideas tangible and memorable.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-white/80">
                <div className="font-medium">Interactive</div>
                <div className="text-white/60">Touch and manipulate objects</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-sm text-white/80">
                <div className="font-medium">Memorable</div>
                <div className="text-white/60">Visual learning aids retention</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🌟</div>
              <div className="text-sm text-white/80">
                <div className="font-medium">Engaging</div>
                <div className="text-white/60">Makes learning fun and exciting</div>
              </div>
            </div>
          </div>
        </div>

        {!isARSupported && (
          <div className="mt-4 p-4 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
            <p className="text-sm">
              AR features are not supported on this device. You can still view 3D models in the preview above.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ARLearning;