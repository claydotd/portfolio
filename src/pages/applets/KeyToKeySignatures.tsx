import { useEffect, useMemo, useRef, useState, type PointerEventHandler } from "react";

const SCALE_NOTES_WITH_OCTAVE = ["C", "D", "E", "F", "G", "A", "B", "C"];
const MAJOR_INTERVAL_PATTERN = ["W", "W", "H", "W", "W", "W", "H"];
const SCALE_BUILD_STEPS = [
  "Start on C",
  "W to D",
  "W to E",
  "H to F",
  "W to G",
  "W to A",
  "W to B",
  "H to C (octave)",
];

export const KeyToKeySignatures = () => {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(1);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [sliderOffset, setSliderOffset] = useState(4);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragVisualOffset, setDragVisualOffset] = useState(0);
  const dragVisualOffsetRef = useRef(0);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const cellStepPxRef = useRef(24);
  const dragStartX = useRef(0);
  const lastMoveTime = useRef(0);
  const velocityPxPerMs = useRef(0);
  const visibleSlots = 15;
  const startSlotIndex = 1;

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAnimationStep((currentStep) => {
        if (currentStep >= SCALE_BUILD_STEPS.length - 1) {
          window.clearInterval(intervalId);
          setIsAnimating(false);
          return currentStep;
        }

        return currentStep + 1;
      });
    }, 700);

    return () => window.clearInterval(intervalId);
  }, [isAnimating]);

  const currentScaleNotes = useMemo(
    () => SCALE_NOTES_WITH_OCTAVE.map((_, noteIndex) => noteIndex <= animationStep),
    [animationStep],
  );
  const currentScaleIntervals = useMemo(
    () => MAJOR_INTERVAL_PATTERN.map((_, intervalIndex) => intervalIndex < animationStep),
    [animationStep],
  );

  const visibleIntervals = useMemo(
    () =>
      Array.from({ length: visibleSlots }, (_, index) => {
        const patternIndex = (((sliderOffset + index) % MAJOR_INTERVAL_PATTERN.length) + MAJOR_INTERVAL_PATTERN.length) % MAJOR_INTERVAL_PATTERN.length;
        return MAJOR_INTERVAL_PATTERN[patternIndex];
      }),
    [sliderOffset],
  );

  const resetLevel = () => {
    setAnimationStep(0);
    setIsAnimating(true);
    setSliderOffset(4);
    setHasChecked(false);
    setIsCorrect(null);
  };

  const slideBy = (amount: number) => {
    if (isAnimating) {
      return;
    }

    setSliderOffset((currentOffset) => currentOffset + amount);
    setHasChecked(false);
    setIsCorrect(null);
  };

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (isAnimating) {
      return;
    }

    setIsDragging(true);
    dragStartX.current = event.clientX;
    dragVisualOffsetRef.current = 0;
    setDragVisualOffset(0);
    velocityPxPerMs.current = 0;
    lastMoveTime.current = performance.now();

    const track = sliderTrackRef.current;
    if (track) {
      const trackStyle = window.getComputedStyle(track);
      const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap || "0");
      const paddingLeft = Number.parseFloat(trackStyle.paddingLeft || "0");
      const paddingRight = Number.parseFloat(trackStyle.paddingRight || "0");
      const availableWidth = track.clientWidth - paddingLeft - paddingRight - gap * (visibleSlots - 1);
      if (availableWidth > 0) {
        cellStepPxRef.current = availableWidth / visibleSlots + gap;
      }
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: PointerEventHandler<HTMLDivElement> = (event) => {
    if (!isDragging || isAnimating) {
      return;
    }

    const now = performance.now();
    const movementX = event.clientX - dragStartX.current;
    const elapsedMs = Math.max(1, now - lastMoveTime.current);
    const instantVelocity = movementX / elapsedMs;
    velocityPxPerMs.current = velocityPxPerMs.current * 0.7 + instantVelocity * 0.3;

    let nextVisualOffset = dragVisualOffsetRef.current + movementX;
    const steps = Math.trunc(nextVisualOffset / cellStepPxRef.current);

    if (steps !== 0) {
      setSliderOffset((currentOffset) => currentOffset - steps);
      setHasChecked(false);
      setIsCorrect(null);
      dragStartX.current = event.clientX;
      lastMoveTime.current = now;
      nextVisualOffset -= steps * cellStepPxRef.current;
    }

    setDragVisualOffset(nextVisualOffset);
    dragVisualOffsetRef.current = nextVisualOffset;
    dragStartX.current = event.clientX;
    lastMoveTime.current = now;
  };

  const handlePointerUp: PointerEventHandler<HTMLDivElement> = (event) => {
    setIsDragging(false);
    dragStartX.current = 0;
    lastMoveTime.current = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (isAnimating) {
      dragVisualOffsetRef.current = 0;
      setDragVisualOffset(0);
      return;
    }

    const projectedOffset = dragVisualOffsetRef.current + velocityPxPerMs.current * 120;
    const snapSteps = Math.round(projectedOffset / cellStepPxRef.current);
    if (snapSteps !== 0) {
      setSliderOffset((currentOffset) => currentOffset - snapSteps);
      setHasChecked(false);
      setIsCorrect(null);
    }

    const residualOffset = dragVisualOffsetRef.current - snapSteps * cellStepPxRef.current;
    dragVisualOffsetRef.current = residualOffset;
    setDragVisualOffset(residualOffset);
    window.requestAnimationFrame(() => {
      dragVisualOffsetRef.current = 0;
      setDragVisualOffset(0);
    });
  };

  const checkAlignment = () => {
    if (isAnimating) {
      return;
    }

    const indexAtStart = ((sliderOffset + startSlotIndex) % MAJOR_INTERVAL_PATTERN.length + MAJOR_INTERVAL_PATTERN.length) % MAJOR_INTERVAL_PATTERN.length;
    setHasChecked(true);
    setIsCorrect(indexAtStart === 0);
  };

  return (
    <section className="page">
      <header className="hero">
        <p className="pill">Music Practice Pal · Applet</p>
        <h1>The Key to Key Signatures</h1>
        <p className="subtitle">
          Build intuition for the major scale interval pattern before mapping it to key signatures.
        </p>
      </header>

      <section className="section">
        <h2>Level 1: Match the Major Scale Pattern</h2>
        <p className="section-subtitle">
          Watch the C major scale build from intervals, then slide the repeating pattern until START marks the true beginning of the sequence.
        </p>

        <div className="k2k-carousel">
          <div className="k2k-carousel-nav">
            <button type="button" className={`btn ghost ${activeSlide === 0 ? "k2k-nav-active" : ""}`} onClick={() => setActiveSlide(0)}>
              Scale Build
            </button>
            <button type="button" className={`btn ghost ${activeSlide === 1 ? "k2k-nav-active" : ""}`} onClick={() => setActiveSlide(1)}>
              Find Start
            </button>
          </div>
          <div className="k2k-carousel-window">
            <div className={`k2k-carousel-track ${activeSlide === 1 ? "show-second" : "show-first"}`}>
              <div className="k2k-block k2k-carousel-slide">
                <h3>Scale build animation</h3>
                <p className="k2k-muted">{SCALE_BUILD_STEPS[animationStep]}</p>
                <div className="k2k-scale-chain" aria-live="polite">
                  {SCALE_NOTES_WITH_OCTAVE.map((note, noteIndex) => {
                    const noteKey = `${note}-${noteIndex}`;
                    const isNoteActive = currentScaleNotes[noteIndex];
                    const interval = MAJOR_INTERVAL_PATTERN[noteIndex];
                    const isIntervalActive = currentScaleIntervals[noteIndex];

                    return (
                      <span className="k2k-scale-piece" key={noteKey}>
                        <span className={`k2k-note-chip ${isNoteActive ? "active" : ""}`}>
                          {note}
                        </span>
                        {interval && (
                          <span className={`k2k-between ${isIntervalActive ? "active" : ""}`}>
                            {interval}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="k2k-actions">
                  <button className="btn ghost" type="button" onClick={resetLevel}>
                    Replay animation
                  </button>
                </div>
              </div>

              <div className="k2k-block k2k-carousel-slide">
                <h3>Find the sequence start</h3>
                <p className="k2k-muted">
                  {isAnimating
                    ? "Wait for the animation to finish, then use the slider controls."
                    : "Drag or slide until START sits just before the first W in W-W-H-W-W-W-H."}
                </p>

                <div
                  className={`k2k-slider-frame ${isAnimating ? "locked" : ""} ${isDragging ? "dragging" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div className="k2k-slider-static" aria-hidden="true">
                    <span className="k2k-start-cell">START</span>
                  </div>
                  <div ref={sliderTrackRef} className="k2k-slider-track" style={{ transform: `translateX(${dragVisualOffset}px)` }}>
                    {visibleIntervals.map((interval, index) => (
                      <span key={`slot-${index}`} className={`k2k-interval-cell ${index === startSlotIndex ? "focused" : ""}`}>
                        {interval}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="k2k-slider-controls">
                  <button type="button" className="btn ghost" disabled={isAnimating} onClick={() => slideBy(-1)}>
                    Slide Left
                  </button>
                  <button type="button" className="btn ghost" disabled={isAnimating} onClick={() => slideBy(1)}>
                    Slide Right
                  </button>
                  <button type="button" className="btn primary" disabled={isAnimating} onClick={checkAlignment}>
                    Check Alignment
                  </button>
                </div>

                {hasChecked && isCorrect !== null && (
                  <p className={`k2k-feedback ${isCorrect ? "success" : "error"}`}>
                    {isCorrect
                      ? "Correct. START is aligned to the true beginning of the sequence."
                      : "Not yet. Keep dragging until START sits right before the first interval of the full pattern."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

