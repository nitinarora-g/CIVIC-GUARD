import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  Eye, 
  Navigation, 
  Layers, 
  Route, 
  Building2, 
  Trees, 
  Zap, 
  Grid3X3, 
  Milestone, 
  Footprints
} from 'lucide-react';
import { AISimilarityResult, AISimilarityFeature } from '../types';

interface AIImageSimilarityAuditProps {
  originalImageUrl: string;
  compareImageUrl: string;
  onAuditComplete?: (result: AISimilarityResult) => void;
  title?: string;
  subtitle?: string;
}

export const AIImageSimilarityAudit: React.FC<AIImageSimilarityAuditProps> = ({
  originalImageUrl,
  compareImageUrl,
  onAuditComplete,
  title = "AI Forensic Spatial Audit",
  subtitle = "Compares road shape, buildings, trees, utilities, and landmarks via Gemini Vision"
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISimilarityResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const loadingSteps = [
    "Initializing forensic vision engine...",
    "Retrieving original complaint photo coordinates...",
    "Extracting road layout and asphalt curves...",
    "Identifying structures, windows, and storefront boundaries...",
    "Analyzing tree foliage, electric poles, and utility coordinates...",
    "Corroborating drain covers, footpaths, and landmark shapes...",
    "Computing spatial similarity matrix...",
    "Generating final cryptographic location validation..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleRunAudit = async () => {
    if (!originalImageUrl || !compareImageUrl) {
      setError("Both original and verification images are required to audit.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    try {
      const response = await fetch('/api/compare-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image1: originalImageUrl,
          image2: compareImageUrl
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze spatial similarity.");
      }

      const data: AISimilarityResult = await response.json();
      setResult(data);
      if (onAuditComplete) {
        onAuditComplete(data);
      }
    } catch (err: any) {
      console.error("Audit error:", err);
      setError(err.message || "An error occurred during AI comparison. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (key: string) => {
    switch (key) {
      case 'road_shape': return <Route className="h-4 w-4 text-sky-400" />;
      case 'buildings': return <Building2 className="h-4 w-4 text-indigo-400" />;
      case 'trees': return <Trees className="h-4 w-4 text-emerald-400" />;
      case 'electric_poles': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'drain_covers': return <Grid3X3 className="h-4 w-4 text-teal-400" />;
      case 'footpaths': return <Footprints className="h-4 w-4 text-orange-400" />;
      case 'landmarks': return <Milestone className="h-4 w-4 text-pink-400" />;
      default: return <Layers className="h-4 w-4 text-brand-text-dim" />;
    }
  };

  const getFeatureLabel = (key: string) => {
    return key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="bg-brand-dark-card border border-brand-border/40 rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-brand-border/20 pb-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-brand-cyan animate-pulse" />
          <div>
            <h4 className="text-[11px] font-bold text-brand-text-main tracking-tight">{title}</h4>
            <p className="text-[8.5px] text-brand-text-dim/80">{subtitle}</p>
          </div>
        </div>
        <Sparkles className="h-3 w-3 text-brand-cyan/60" />
      </div>

      {/* Side-by-Side Image Previews */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="relative rounded-lg overflow-hidden border border-brand-border/30 bg-brand-dark-bg/60 h-24">
          <img 
            src={originalImageUrl} 
            alt="Original Civic Report" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 text-[7.5px] font-semibold text-brand-text-dim truncate">
            Report Photo (Rise)
          </div>
        </div>
        <div className="relative rounded-lg overflow-hidden border border-brand-border/30 bg-brand-dark-bg/60 h-24">
          <img 
            src={compareImageUrl} 
            alt="Verification Proof" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 inset-x-0 bg-brand-cyan-soft/80 px-1.5 py-0.5 text-[7.5px] font-semibold text-brand-text-main truncate">
            Proof Photo (Captured)
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!loading && !result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2"
          >
            <button
              onClick={handleRunAudit}
              className="px-4 py-2 bg-gradient-to-r from-brand-cyan to-blue-600 hover:from-brand-cyan/90 hover:to-blue-500 text-brand-dark-bg font-bold text-[10px] rounded-xl transition-all shadow-lg flex items-center gap-1.5 mx-auto uppercase tracking-wider"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Run Vision Spatial Match Audit
            </button>
            <p className="text-[8px] text-brand-text-dim mt-1.5 font-light">
              Required by municipal policy to prevent spoofing and verify exact location.
            </p>
          </motion.div>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4 text-center flex flex-col items-center justify-center min-h-[140px]"
          >
            <Loader2 className="h-6 w-6 text-brand-cyan animate-spin mb-2" />
            <div className="h-1 w-24 bg-brand-border/40 rounded-full overflow-hidden mb-2">
              <motion.div 
                className="h-full bg-brand-cyan" 
                animate={{ x: [-100, 100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ width: "40%" }}
              />
            </div>
            <p className="text-[9.5px] text-brand-text-main font-semibold animate-pulse">
              Gemini Vision Comparing Sites...
            </p>
            <p className="text-[8px] text-brand-cyan/80 max-w-[180px] h-6 mt-1 leading-normal font-mono">
              {loadingSteps[loadingStep]}
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[9px] mb-3 flex items-start gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Spatial Audit Interrupted</p>
              <p className="font-light">{error}</p>
              <button 
                onClick={handleRunAudit}
                className="mt-1.5 text-[8.5px] font-bold text-brand-cyan hover:underline"
              >
                Retry Audit
              </button>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Main Score Display */}
            <div className="p-2.5 rounded-lg bg-brand-dark-bg border border-brand-border/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-bold uppercase text-brand-text-dim tracking-wider">
                  Geometric Similarity
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-bold font-mono ${result.isMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.similarityScore}%
                  </span>
                  <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    result.isMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {result.isMatch ? '✓ Likely Match' : '❌ Unlikely Match'}
                  </span>
                </div>
              </div>

              {/* Circle progress indicator */}
              <div className="relative h-10 w-10 shrink-0">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="stroke-brand-border/30"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className={result.isMatch ? "stroke-emerald-400" : "stroke-rose-400"}
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={100}
                    strokeDashoffset={100 - result.similarityScore}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold font-mono">
                  {result.similarityScore}%
                </div>
              </div>
            </div>

            {/* Feature Check-list */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-bold uppercase text-brand-text-dim tracking-wider block">
                Visual Landmark Cross-Examination
              </span>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(result.features).map(([key, fVal]) => {
                  const feature = fVal as AISimilarityFeature;
                  return (
                    <div 
                      key={key} 
                      className="p-1.5 rounded bg-brand-dark-bg/60 border border-brand-border/20 flex flex-col gap-0.5 transition-colors hover:border-brand-border/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {getFeatureIcon(key)}
                          <span className="text-[9px] font-medium text-brand-text-main">
                            {getFeatureLabel(key)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {feature.matched ? (
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 px-1 rounded flex items-center gap-0.5 border border-emerald-500/10">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Matched
                            </span>
                          ) : (
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/5 px-1 rounded flex items-center gap-0.5 border border-rose-500/10">
                              <XCircle className="h-2.5 w-2.5" /> No Match
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[8px] text-brand-text-dim/90 font-light pl-5 leading-normal">
                        {feature.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expert Reasoning Summary */}
            <div className="p-2 rounded-lg bg-brand-cyan-soft/5 border border-brand-cyan/15 text-[8.5px] text-brand-text-dim leading-relaxed font-light">
              <div className="flex items-center gap-1 mb-1 text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Gemini Spatial Auditor Verdict
              </div>
              {result.reasoning}
            </div>

            {/* Audit complete footer banner */}
            <div className="text-center">
              <span className="text-[7.5px] font-mono text-brand-cyan/60 uppercase">
                Validated Decent-AI Civic Shield v1.4
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
