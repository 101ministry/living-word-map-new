(() => {
  'use strict';

  const SURVEY_URL = 'https://s.surveyplanet.com/9cxtgo01';
  const STORAGE_KEY = 'lwm-survey-filled-v1';

  function initSurveyGate() {
    const dialog = document.getElementById('survey-gate-dialog');
    const yesBtn = document.getElementById('survey-gate-yes');
    const noBtn = document.getElementById('survey-gate-no');
    const dismissBtn = document.getElementById('survey-gate-dismiss');
    const link = document.getElementById('survey-gate-link');
    if (!dialog) return;

    if (link) link.href = SURVEY_URL;

    try {
      if (localStorage.getItem(STORAGE_KEY) === 'yes') return;
    } catch { /* ignore */ }

    function closeDialog() {
      if (dialog.open) dialog.close();
    }

    yesBtn?.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, 'yes');
      } catch { /* ignore */ }
      closeDialog();
    });

    noBtn?.addEventListener('click', () => {
      window.open(SURVEY_URL, '_blank', 'noopener,noreferrer');
    });

    dismissBtn?.addEventListener('click', closeDialog);

    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      closeDialog();
    });

    if (!dialog.open) dialog.showModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSurveyGate);
  } else {
    initSurveyGate();
  }
})();
