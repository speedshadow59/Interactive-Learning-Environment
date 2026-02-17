/**
 * Accessibility Component
 * Implements WCAG 2.1 AA compliance features
 * 
 * Features:
 * - High contrast mode
 * - Text size adjustment
 * - Screen reader announcements
 * - Keyboard navigation
 * - Focus management
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Accessibility.css';

const AccessibilityPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(
    localStorage.getItem('a11y-high-contrast') === 'true'
  );
  const [textSize, setTextSize] = useState(
    parseInt(localStorage.getItem('a11y-text-size')) || 100
  );
  const [screenReaderMode, setScreenReaderMode] = useState(
    localStorage.getItem('a11y-screen-reader') === 'true'
  );

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (highContrast) {
      root.setAttribute('data-a11y-high-contrast', 'true');
      document.body.classList.add('a11y-high-contrast');
    } else {
      root.removeAttribute('data-a11y-high-contrast');
      document.body.classList.remove('a11y-high-contrast');
    }

    // Text size
    root.style.fontSize = `${textSize}%`;

    // Screen reader mode
    if (screenReaderMode) {
      document.body.classList.add('a11y-screen-reader');
    } else {
      document.body.classList.remove('a11y-screen-reader');
    }

    // Persist settings
    localStorage.setItem('a11y-high-contrast', highContrast);
    localStorage.setItem('a11y-text-size', textSize);
    localStorage.setItem('a11y-screen-reader', screenReaderMode);
  }, [highContrast, textSize, screenReaderMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isAltCombo = e.altKey || (e.ctrlKey && e.altKey);
      const key = e.key.toLowerCase();

      // Alt + A: Toggle accessibility panel
      if (isAltCombo && key === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Alt + H: Toggle high contrast
      if (isAltCombo && key === 'h') {
        e.preventDefault();
        setHighContrast((prev) => !prev);
      }

      // Alt + Plus/Equals: Increase text size
      if (isAltCombo && (key === '+' || key === '=' || e.code === 'Equal')) {
        e.preventDefault();
        setTextSize((prev) => Math.min(prev + 10, 200));
      }

      // Alt + Minus: Decrease text size
      if (isAltCombo && (key === '-' || e.code === 'Minus')) {
        e.preventDefault();
        setTextSize((prev) => Math.max(prev - 10, 75));
      }

      // Alt + R: Reset all settings
      if (isAltCombo && key === 'r') {
        e.preventDefault();
        resetAccessibilitySettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetAccessibilitySettings = () => {
    setHighContrast(false);
    setTextSize(100);
    setScreenReaderMode(false);
    localStorage.removeItem('a11y-high-contrast');
    localStorage.removeItem('a11y-text-size');
    localStorage.removeItem('a11y-screen-reader');
  };

  return (
    <>
      {/* Screen reader announcements container */}
      <div
        id="a11y-announcements"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Accessibility panel */}
      <div className={`a11y-panel ${isOpen ? 'open' : ''}`}>
        <button
          className="a11y-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle accessibility panel"
          aria-expanded={isOpen}
          aria-controls="a11y-menu"
          title="Alt + A: Toggle accessibility"
        >
          ♿
        </button>

        <div
          id="a11y-menu"
          className="a11y-menu"
          role="region"
          aria-label="Accessibility Settings"
        >
          <h2>Accessibility Settings</h2>

          <fieldset>
            <legend>Text Size</legend>
            <div className="a11y-control">
              <button
                onClick={() => setTextSize(Math.max(textSize - 10, 75))}
                aria-label="Decrease text size"
                title="Alt + Minus"
              >
                A−
              </button>
              <span className="text-size-value">{textSize}%</span>
              <button
                onClick={() => setTextSize(Math.min(textSize + 10, 200))}
                aria-label="Increase text size"
                title="Alt + Plus"
              >
                A+
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend>Display Options</legend>
            <label className="a11y-checkbox">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                aria-describedby="high-contrast-desc"
              />
              <span>High Contrast</span>
              <span id="high-contrast-desc" className="sr-only">
                Enables high contrast colors for better visibility
              </span>
            </label>

            <label className="a11y-checkbox">
              <input
                type="checkbox"
                checked={screenReaderMode}
                onChange={(e) => setScreenReaderMode(e.target.checked)}
                aria-describedby="sr-mode-desc"
              />
              <span>Screen Reader Mode</span>
              <span id="sr-mode-desc" className="sr-only">
                Optimizes interface for screen reader users
              </span>
            </label>
          </fieldset>

          <button
            onClick={resetAccessibilitySettings}
            className="a11y-reset"
            aria-label="Reset all accessibility settings to default"
            title="Alt + R: Reset settings"
          >
            Reset to Default
          </button>

          <div className="a11y-shortcuts">
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li>
                <kbd>Alt</kbd> + <kbd>A</kbd>: Toggle this panel
              </li>
              <li>
                <kbd>Alt</kbd> + <kbd>H</kbd>: High contrast
              </li>
              <li>
                <kbd>Alt</kbd> + <kbd>+</kbd>: Increase text
              </li>
              <li>
                <kbd>Alt</kbd> + <kbd>−</kbd>: Decrease text
              </li>
              <li>
                <kbd>Alt</kbd> + <kbd>R</kbd>: Reset settings
              </li>
              <li>
                <kbd>Tab</kbd>: Navigate interactive elements
              </li>
              <li>
                <kbd>Enter</kbd>/<kbd>Space</kbd>: Activate buttons
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Screen reader announcement utility
 */
export const announceToScreenReader = (message) => {
  const announcer = document.getElementById('a11y-announcements');
  if (announcer) {
    announcer.textContent = message;
  }
};

/**
 * ARIA Live Region Hook
 * Useful for dynamic content updates
 */
export const useLiveRegion = () => {
  const announceToRegion = useCallback((message, polite = true) => {
    announceToScreenReader(message);
  }, []);

  return { announceToRegion };
};

/**
 * Keyboard Navigation Hook
 * Manages focus for list-like components
 */
export const useKeyboardNavigation = (itemCount) => {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Home':
          e.preventDefault();
          setFocusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIndex(itemCount - 1);
          break;
        default:
          break;
      }
    },
    [itemCount]
  );

  return { focusIndex, handleKeyDown };
};

export default AccessibilityPanel;
