(() => {
  'use strict';

  const ROUND1_URL = 'round1.html?from=map';
  const STORAGE_KEY = 'lwm-round1-videos-v1';
  const COUNTDOWN_SEC = 28;
  const TOUGH_QUESTIONS_AT_SEC = 20;

  const els = {
    link: document.getElementById('round1-entry-link'),
    videosDialog: document.getElementById('round1-entry-videos-dialog'),
    videosYes: document.getElementById('round1-entry-videos-yes'),
    videosNo: document.getElementById('round1-entry-videos-no'),
    videosDismiss: document.getElementById('round1-entry-videos-dismiss'),
    warningDialog: document.getElementById('round1-entry-warning-dialog'),
    toughQuestions: document.getElementById('round1-entry-tough-questions'),
    countdownEl: document.getElementById('round1-entry-countdown'),
    countdownSec: document.getElementById('round1-entry-countdown-sec'),
  };

  let countdownTimer = null;
  let countdownRemaining = COUNTDOWN_SEC;

  function hasCompletedVideoGate() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'yes';
    } catch {
      return false;
    }
  }

  function markVideoGateYes() {
    try {
      localStorage.setItem(STORAGE_KEY, 'yes');
    } catch { /* ignore */ }
  }

  function goToRound1() {
    window.location.href = ROUND1_URL;
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function showDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
  }

  function clearCountdown() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function hideToughQuestionsLink() {
    els.toughQuestions?.classList.add('hidden');
  }

  function showToughQuestionsLink() {
    els.toughQuestions?.classList.remove('hidden');
  }

  function updateCountdownDisplay() {
    if (els.countdownSec) {
      els.countdownSec.textContent = String(countdownRemaining);
    }
    if (countdownRemaining <= TOUGH_QUESTIONS_AT_SEC) {
      showToughQuestionsLink();
    }
  }

  function finishWarningCountdown() {
    clearCountdown();
    hideToughQuestionsLink();
    closeDialog(els.warningDialog);
    goToRound1();
  }

  function startWarningCountdown() {
    clearCountdown();
    countdownRemaining = COUNTDOWN_SEC;
    hideToughQuestionsLink();
    updateCountdownDisplay();
    showDialog(els.warningDialog);

    countdownTimer = window.setInterval(() => {
      countdownRemaining -= 1;
      if (countdownRemaining <= 0) {
        finishWarningCountdown();
        return;
      }
      updateCountdownDisplay();
    }, 1000);
  }

  function handleVideosYes() {
    markVideoGateYes();
    closeDialog(els.videosDialog);
    goToRound1();
  }

  function handleVideosNo() {
    closeDialog(els.videosDialog);
    startWarningCountdown();
  }

  function handleEntryClick(event) {
    event.preventDefault();
    if (hasCompletedVideoGate()) {
      goToRound1();
      return;
    }
    showDialog(els.videosDialog);
  }

  function init() {
    if (!els.link || !els.videosDialog) return;

    els.link.addEventListener('click', handleEntryClick);

    els.videosYes?.addEventListener('click', handleVideosYes);
    els.videosNo?.addEventListener('click', handleVideosNo);
    els.videosDismiss?.addEventListener('click', () => closeDialog(els.videosDialog));

    els.videosDialog.addEventListener('cancel', e => {
      e.preventDefault();
      closeDialog(els.videosDialog);
    });

    els.warningDialog?.addEventListener('cancel', e => {
      e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
