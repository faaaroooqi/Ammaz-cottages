import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAdminAlerts } from "../services/admin.service";
import { showBookingAlert, showPasswordResetAlert, showReviewAlert } from "../utils/toast";

/**
 * useBookingAlerts — polls for booking, reset, and review alerts periodically.
 * Plays a looping buzzer sound until the toast is clicked or the admin
 * navigates to the relevant page.
 */
export default function useBookingAlerts(pollInterval = 15000) {
  const [newBookings, setNewBookings] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Ref that holds the looping buzzer's interval ID so we can stop it
  const buzzerIntervalRef = useRef(null);

  /**
   * Play one burst of the 3-tone buzzer.
   * Resumes the AudioContext to ensure it plays correctly post user-interaction.
   */
  const playBuzzerOnce = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const startOscillators = () => {
        const playTone = (freq, startTime, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
          gain.gain.exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime + startTime + duration
          );
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };
        playTone(880, 0, 0.15);
        playTone(1100, 0.15, 0.2);
        playTone(1320, 0.3, 0.25);
        // Close AudioContext after the tones finish to free resources
        setTimeout(() => ctx.close().catch(() => {}), 700);
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(startOscillators).catch(startOscillators);
      } else {
        startOscillators();
      }
    } catch {
      /* Silent fail — browser may block AudioContext before user gesture */
    }
  }, []);

  /**
   * Start the looping buzzer.
   * Plays immediately, then repeats every 2 seconds.
   */
  const startBuzzerLoop = useCallback(() => {
    // Don't stack multiple loops
    if (buzzerIntervalRef.current) return;

    playBuzzerOnce();
    buzzerIntervalRef.current = setInterval(() => {
      playBuzzerOnce();
    }, 2000);
  }, [playBuzzerOnce]);

  /**
   * Stop the looping buzzer.
   */
  const stopBuzzerLoop = useCallback(() => {
    if (buzzerIntervalRef.current) {
      clearInterval(buzzerIntervalRef.current);
      buzzerIntervalRef.current = null;
    }
  }, []);

  // Auto-stop buzzer when admin navigates to bookings, password-resets, or reviews page
  useEffect(() => {
    if (
      location.pathname === "/admin/bookings" ||
      location.pathname === "/admin/password-resets" ||
      location.pathname === "/admin/reviews"
    ) {
      stopBuzzerLoop();
    }
  }, [location.pathname, stopBuzzerLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopBuzzerLoop();
  }, [stopBuzzerLoop]);

  // Main polling effect
  useEffect(() => {
    let lastCheckTime = new Date().toISOString();
    let isMounted = true;
    let timerId = null;

    const pollAlerts = async () => {
      try {
        const res = await getAdminAlerts(lastCheckTime);
        if (!isMounted) return;

        const { bookings, passwordResets, reviews } = res.data;
        let hasNewAlerts = false;

        // Process bookings
        if (bookings && bookings.length > 0) {
          bookings.forEach((booking) => {
            console.log("🔔 New booking request received via polling:", booking);
            showBookingAlert(booking, navigate, stopBuzzerLoop);
            setNewBookings((prev) => [booking, ...prev]);
          });
          hasNewAlerts = true;
        }

        // Process password resets
        if (passwordResets && passwordResets.length > 0) {
          passwordResets.forEach((request) => {
            console.log("🔑 New password reset request received via polling:", request);
            showPasswordResetAlert(request, navigate, stopBuzzerLoop);
          });
          hasNewAlerts = true;
        }

        // Process reviews
        if (reviews && reviews.length > 0) {
          reviews.forEach((review) => {
            console.log("⭐ New review received via polling:", review);
            showReviewAlert(review, navigate, stopBuzzerLoop);
          });
          hasNewAlerts = true;
        }

        if (hasNewAlerts) {
          startBuzzerLoop();
        }

        // Update lastCheckTime to current time
        lastCheckTime = new Date().toISOString();
      } catch (err) {
        console.error("Failed to poll administrative alerts:", err);
      } finally {
        if (isMounted) {
          timerId = setTimeout(pollAlerts, pollInterval);
        }
      }
    };

    // Start the first polling check after pollInterval
    timerId = setTimeout(pollAlerts, pollInterval);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [pollInterval, navigate, startBuzzerLoop, stopBuzzerLoop]);

  return { newBookings };
}
