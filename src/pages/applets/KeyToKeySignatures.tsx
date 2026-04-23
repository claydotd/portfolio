import { useEffect, useMemo, useRef, useState, type PointerEventHandler } from "react";
import * as Tone from "tone";

const SCALE_NOTES_WITH_OCTAVE = ["C", "D", "E", "F", "G", "A", "B", "C"];
const SCALE_PITCHES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const MAJOR_INTERVAL_PATTERN = ["W", "W", "H", "W", "W", "W", "H"];
const SCALE_BUILD_STEPS = [
  "Start on C",
  "Whole step to D",
  "Whole step to E",
  "Half step to F",
  "Whole step to G",
  "Whole step to A",
  "Whole step to B",
  "Half step to C (octave)",
];

export const KeyToKeySignatures = () => {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sliderOffset, setSliderOffset] = useState(4);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isButtonSliding, setIsButtonSliding] = useState(false);
  const [isButtonResetting, setIsButtonResetting] = useState(false);
  const [isSliderTextHidden, setIsSliderTextHidden] = useState(false);
  const [isPlayingSliderSequence, setIsPlayingSliderSequence] = useState(false);
  const [hasCompletedBuildAnimation, setHasCompletedBuildAnimation] = useState(false);
  const [dragVisualOffset, setDragVisualOffset] = useState(0);
  const [cellStepPx, setCellStepPx] = useState(24);
  const dragVisualOffsetRef = useRef(0);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const cellStepPxRef = useRef(24);
  const buttonSlideAnimationFrame = useRef<number | null>(null);
  const buttonSlideTimeout = useRef<number | null>(null);
  const shuffleAnimationFrame = useRef<number | null>(null);
  const shufflePhaseTimeout = useRef<number | null>(null);
  const sliderSequenceTimeout = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const lastMoveTime = useRef(0);
  const velocityPxPerMs = useRef(0);
  const pianoSynthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  const shouldPlayBuildAudioRef = useRef(false);
  const previousAnimationStepRef = useRef(0);
  const visibleSlots = 15;
  const sliderBufferSlots = 1;
  const renderedSlots = visibleSlots + sliderBufferSlots * 2;
  const startBetweenIndex = 1;
  const momentumProjectionMs = 190;
  const maxMomentumSteps = 8;

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAnimationStep((currentStep) => {
        if (currentStep >= SCALE_BUILD_STEPS.length - 1) {
          window.clearInterval(intervalId);
          setIsAnimating(false);
          setHasCompletedBuildAnimation(true);
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
  const intervalSlots = useMemo(
    () =>
      Array.from({ length: renderedSlots }, (_, index) => {
        const patternOffset = index - (sliderBufferSlots + startBetweenIndex + 1);
        const patternIndex = (((sliderOffset + patternOffset) % MAJOR_INTERVAL_PATTERN.length) + MAJOR_INTERVAL_PATTERN.length) % MAJOR_INTERVAL_PATTERN.length;
        return MAJOR_INTERVAL_PATTERN[patternIndex];
      }),
    [renderedSlots, sliderBufferSlots, sliderOffset, startBetweenIndex],
  );

  const resetLevel = () => {
    setAnimationStep(0);
    setIsAnimating(true);
    setSliderOffset(4);
    dragVisualOffsetRef.current = 0;
    setDragVisualOffset(0);
    setHasChecked(false);
    setIsCorrect(null);
  };

  const restartBuildWithAudio = () => {
    if (isAnimating) {
      return;
    }
    previousAnimationStepRef.current = 0;
    shouldPlayBuildAudioRef.current = true;
    resetLevel();
    void playScaleNote(0);
  };

  const playScaleNote = async (noteIndex: number) => {
    const note = SCALE_PITCHES[noteIndex];
    if (!note) {
      return;
    }

    await Tone.start();
    if (!pianoSynthRef.current) {
      pianoSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.006,
          decay: 0.24,
          sustain: 0.12,
          release: 0.55,
        },
      }).toDestination();
    }

    pianoSynthRef.current.triggerAttackRelease(note, "8n");
  };

  const playIntervalPair = async (intervalIndex: number) => {
    const leftNote = SCALE_PITCHES[intervalIndex];
    const rightNote = SCALE_PITCHES[intervalIndex + 1];
    if (!leftNote || !rightNote) {
      return;
    }

    await Tone.start();
    if (!pianoSynthRef.current) {
      pianoSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.006,
          decay: 0.24,
          sustain: 0.12,
          release: 0.55,
        },
      }).toDestination();
    }

    const now = Tone.now();
    const step = 0.52;
    const sequence = [leftNote, rightNote, leftNote, rightNote];
    sequence.forEach((note, index) => {
      pianoSynthRef.current?.triggerAttackRelease(note, "8n", now + index * step);
    });
  };

  const playSliderSequence = async () => {
    if (isAnimating || isPlayingSliderSequence) {
      return;
    }

    await Tone.start();
    if (!pianoSynthRef.current) {
      pianoSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.006,
          decay: 0.24,
          sustain: 0.12,
          release: 0.55,
        },
      }).toDestination();
    }

    if (sliderSequenceTimeout.current !== null) {
      window.clearTimeout(sliderSequenceTimeout.current);
      sliderSequenceTimeout.current = null;
    }

    const startPatternIndex = ((sliderOffset % MAJOR_INTERVAL_PATTERN.length) + MAJOR_INTERVAL_PATTERN.length) % MAJOR_INTERVAL_PATTERN.length;
    const intervalSequence = Array.from({ length: MAJOR_INTERVAL_PATTERN.length }, (_, index) => {
      return MAJOR_INTERVAL_PATTERN[(startPatternIndex + index) % MAJOR_INTERVAL_PATTERN.length];
    });

    const semitoneOffsets = [0];
    intervalSequence.forEach((interval) => {
      const semitoneStep = interval === "W" ? 2 : 1;
      semitoneOffsets.push(semitoneOffsets[semitoneOffsets.length - 1] + semitoneStep);
    });

    const notesToPlay = semitoneOffsets.map((semitoneOffset) => Tone.Frequency("C4").transpose(semitoneOffset).toNote());
    const now = Tone.now();
    const stepSeconds = 0.52;
    notesToPlay.forEach((note, index) => {
      pianoSynthRef.current?.triggerAttackRelease(note, "8n", now + index * stepSeconds);
    });

    setIsPlayingSliderSequence(true);
    sliderSequenceTimeout.current = window.setTimeout(() => {
      setIsPlayingSliderSequence(false);
      sliderSequenceTimeout.current = null;
    }, notesToPlay.length * stepSeconds * 1000 + 120);
  };

  useEffect(() => {
    const previousStep = previousAnimationStepRef.current;
    if (!isAnimating) {
      shouldPlayBuildAudioRef.current = false;
      previousAnimationStepRef.current = animationStep;
      return;
    }

    if (shouldPlayBuildAudioRef.current && animationStep > previousStep) {
      void playScaleNote(animationStep);
    }

    previousAnimationStepRef.current = animationStep;
  }, [animationStep, isAnimating]);

  const measureCellStep = () => {
    const track = sliderTrackRef.current;
    if (!track) {
      return;
    }

    const trackStyle = window.getComputedStyle(track);
    const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap || "0");
    const paddingLeft = Number.parseFloat(trackStyle.paddingLeft || "0");
    const paddingRight = Number.parseFloat(trackStyle.paddingRight || "0");
    const availableWidth = track.clientWidth - paddingLeft - paddingRight - gap * (visibleSlots - 1);
    if (availableWidth > 0) {
      const measuredStep = availableWidth / visibleSlots + gap;
      cellStepPxRef.current = measuredStep;
      setCellStepPx(measuredStep);
    }
  };

  useEffect(() => {
    measureCellStep();
    const handleResize = () => {
      measureCellStep();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slideBy = (amount: number) => {
    if (isAnimating || isDragging || isButtonSliding) {
      return;
    }

    if (buttonSlideAnimationFrame.current !== null) {
      window.cancelAnimationFrame(buttonSlideAnimationFrame.current);
      buttonSlideAnimationFrame.current = null;
    }
    if (buttonSlideTimeout.current !== null) {
      window.clearTimeout(buttonSlideTimeout.current);
      buttonSlideTimeout.current = null;
    }

    measureCellStep();
    setIsButtonResetting(false);
    setIsButtonSliding(true);
    const stepPx = cellStepPxRef.current;
    const targetDelta = amount * stepPx;
    const durationMs = 340;
    dragVisualOffsetRef.current = 0;
    setDragVisualOffset(0);
    buttonSlideAnimationFrame.current = window.requestAnimationFrame(() => {
      buttonSlideAnimationFrame.current = null;
      dragVisualOffsetRef.current = targetDelta;
      setDragVisualOffset(targetDelta);
    });
    buttonSlideTimeout.current = window.setTimeout(() => {
      setSliderOffset((currentOffset) => currentOffset - amount);
      setHasChecked(false);
      setIsCorrect(null);
      setIsButtonResetting(true);
      dragVisualOffsetRef.current = 0;
      setDragVisualOffset(0);
      buttonSlideAnimationFrame.current = window.requestAnimationFrame(() => {
        setIsButtonSliding(false);
        setIsButtonResetting(false);
        buttonSlideAnimationFrame.current = null;
      });
      buttonSlideTimeout.current = null;
    }, durationMs + 20);
  };

  const shuffleForRetry = () => {
    if (isAnimating || isDragging || isButtonSliding) {
      return;
    }

    measureCellStep();
    setIsButtonSliding(true);
    setHasChecked(false);
    setIsCorrect(null);

    if (shuffleAnimationFrame.current !== null) {
      window.cancelAnimationFrame(shuffleAnimationFrame.current);
      shuffleAnimationFrame.current = null;
    }
    if (shufflePhaseTimeout.current !== null) {
      window.clearTimeout(shufflePhaseTimeout.current);
      shufflePhaseTimeout.current = null;
    }

    const fadeOutMs = 260;
    const moveMs = 1480;
    const fadeInMs = 260;
    const baseAmplitude = cellStepPxRef.current * 1.35;
    const cycles = 3.75;

    const startMovePhase = () => {
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / moveMs);
        const envelope = 1 - progress * 0.35;
        const oscillation = Math.sin(progress * Math.PI * 2 * cycles);
        const nextOffset = oscillation * baseAmplitude * envelope;
        dragVisualOffsetRef.current = nextOffset;
        setDragVisualOffset(nextOffset);

        if (progress < 1) {
          shuffleAnimationFrame.current = window.requestAnimationFrame(animate);
          return;
        }

        const patternLength = MAJOR_INTERVAL_PATTERN.length;
        const currentWrappedOffset = ((sliderOffset % patternLength) + patternLength) % patternLength;
        let nextWrappedOffset = Math.floor(Math.random() * patternLength);
        if (nextWrappedOffset === currentWrappedOffset) {
          nextWrappedOffset = (nextWrappedOffset + 3) % patternLength;
        }

        setSliderOffset(nextWrappedOffset);
        dragVisualOffsetRef.current = 0;
        setDragVisualOffset(0);
        shuffleAnimationFrame.current = null;
        setIsSliderTextHidden(false);

        shufflePhaseTimeout.current = window.setTimeout(() => {
          setIsButtonSliding(false);
          shufflePhaseTimeout.current = null;
        }, fadeInMs);
      };

      shuffleAnimationFrame.current = window.requestAnimationFrame(animate);
    };

    setIsSliderTextHidden(true);
    shufflePhaseTimeout.current = window.setTimeout(() => {
      shufflePhaseTimeout.current = null;
      startMovePhase();
    }, fadeOutMs);
  };

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (isAnimating || isButtonSliding) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest("button")) {
      return;
    }

    if (buttonSlideAnimationFrame.current !== null) {
      window.cancelAnimationFrame(buttonSlideAnimationFrame.current);
      buttonSlideAnimationFrame.current = null;
    }
    if (buttonSlideTimeout.current !== null) {
      window.clearTimeout(buttonSlideTimeout.current);
      buttonSlideTimeout.current = null;
    }
    setIsButtonSliding(false);
    setIsButtonResetting(false);
    setIsDragging(true);
    dragStartX.current = event.clientX;
    dragVisualOffsetRef.current = 0;
    setDragVisualOffset(0);
    velocityPxPerMs.current = 0;
    lastMoveTime.current = performance.now();

    measureCellStep();

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

    const projectedOffset = dragVisualOffsetRef.current + velocityPxPerMs.current * momentumProjectionMs;
    const projectedSteps = Math.round(projectedOffset / cellStepPxRef.current);
    const snapSteps = Math.max(-maxMomentumSteps, Math.min(maxMomentumSteps, projectedSteps));
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

  useEffect(
    () => () => {
      if (buttonSlideAnimationFrame.current !== null) {
        window.cancelAnimationFrame(buttonSlideAnimationFrame.current);
      }
      if (buttonSlideTimeout.current !== null) {
        window.clearTimeout(buttonSlideTimeout.current);
      }
      if (shuffleAnimationFrame.current !== null) {
        window.cancelAnimationFrame(shuffleAnimationFrame.current);
      }
      if (shufflePhaseTimeout.current !== null) {
        window.clearTimeout(shufflePhaseTimeout.current);
      }
      if (sliderSequenceTimeout.current !== null) {
        window.clearTimeout(sliderSequenceTimeout.current);
      }
      pianoSynthRef.current?.dispose();
      pianoSynthRef.current = null;
    },
    [],
  );

  const checkAlignment = () => {
    if (isAnimating) {
      return;
    }

    const indexAtStart = ((sliderOffset % MAJOR_INTERVAL_PATTERN.length) + MAJOR_INTERVAL_PATTERN.length) % MAJOR_INTERVAL_PATTERN.length;
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
                <h3>Building a Major Scale</h3>
                <p className="k2k-muted">{SCALE_BUILD_STEPS[animationStep]}</p>
                <div className="k2k-scale-frame" aria-live="polite">
                  <div className="k2k-start-row k2k-start-row-scale">
                    <button
                      type="button"
                      className={`k2k-start-cell k2k-start-button ${!isAnimating && animationStep === 0 ? "k2k-start-button-ready" : ""}`}
                      onClick={restartBuildWithAudio}
                    >
                      START
                    </button>
                  </div>
                  <div className="k2k-scale-track">
                    {MAJOR_INTERVAL_PATTERN.map((interval, intervalIndex) => (
                      <button
                        key={`scale-interval-${intervalIndex}`}
                        type="button"
                        className={`k2k-interval-cell k2k-scale-cell k2k-interval-button ${currentScaleIntervals[intervalIndex] ? "active" : ""}`}
                        onClick={() => {
                          void playIntervalPair(intervalIndex);
                        }}
                        aria-label={`Play notes ${SCALE_PITCHES[intervalIndex]} then ${SCALE_PITCHES[intervalIndex + 1]}, twice`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                  <div className="k2k-scale-notes-row">
                    {SCALE_NOTES_WITH_OCTAVE.map((note, noteIndex) => (
                      <button
                        key={`scale-note-${noteIndex}`}
                        type="button"
                        className={`k2k-note-chip k2k-note-button ${currentScaleNotes[noteIndex] ? "active" : ""}`}
                        onClick={() => {
                          void playScaleNote(noteIndex);
                        }}
                        aria-label={`Play note ${SCALE_PITCHES[noteIndex]}`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`k2k-actions ${hasCompletedBuildAnimation ? "k2k-actions-visible" : ""}`}>
                  <button className="btn ghost" type="button" onClick={restartBuildWithAudio}>
                    Replay animation
                  </button>
                </div>
              </div>

              <div className="k2k-block k2k-carousel-slide">
                <h3>Find the sequence start</h3>
                <p className="k2k-muted">
                  {isAnimating
                    ? "Wait for the animation to finish, then use the slider controls."
                    : "Drag or use the buttons to align the sequence with the correct start point. Click the START button the hear the sequence starting from C."}
                </p>

                <div
                  className={`k2k-slider-frame ${isAnimating ? "locked" : ""} ${isDragging ? "dragging" : ""} ${isButtonSliding ? "button-sliding" : ""} ${isButtonResetting ? "button-resetting" : ""} ${
                    isSliderTextHidden ? "k2k-slider-text-hidden" : ""
                  }`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div className="k2k-start-row k2k-start-row-slider">
                    <button
                      type="button"
                      className="k2k-start-cell k2k-start-button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={playSliderSequence}
                      disabled={isAnimating || isPlayingSliderSequence}
                      aria-label="Play sequence from C4 using current interval alignment"
                    >
                      START
                    </button>
                  </div>
                  <div
                    ref={sliderTrackRef}
                    className="k2k-slider-track"
                    style={{ transform: `translateX(${dragVisualOffset - sliderBufferSlots * cellStepPx}px)` }}
                  >
                    {intervalSlots.map((interval, index) => (
                      <span
                        key={`slot-${index}`}
                        className={`k2k-interval-cell ${index === sliderBufferSlots + startBetweenIndex + 1 ? "focused" : ""}`}
                      >
                        {interval}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="k2k-slider-controls">
                  <button
                    type="button"
                    className="btn ghost k2k-control-left"
                    disabled={isAnimating || isButtonSliding}
                    onClick={() => slideBy(-1)}
                  >
                    Slide Left
                  </button>
                  <button
                    type="button"
                    className={`btn ${hasChecked && isCorrect ? "k2k-btn-again" : "primary"} k2k-control-center`}
                    disabled={isAnimating || isButtonSliding}
                    onClick={hasChecked && isCorrect ? shuffleForRetry : checkAlignment}
                  >
                    {hasChecked && isCorrect ? "Let's go again" : "Check"}
                  </button>
                  <button
                    type="button"
                    className="btn ghost k2k-control-right"
                    disabled={isAnimating || isButtonSliding}
                    onClick={() => slideBy(1)}
                  >
                    Slide Right
                  </button>
                </div>

                {hasChecked && isCorrect !== null && (
                  <p className={`k2k-feedback ${isCorrect ? "success" : "error"}`}>
                    {isCorrect
                      ? "You got it!"
                      : "Keep trying! It's not quite right yet."}
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

