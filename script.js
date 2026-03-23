/* ============================================================
   MSDeaf Historical Timeline — script.js
   ============================================================ */

(function () {
  'use strict';

  const AUTH_SESSION_KEY = 'msdeaf-admin-authenticated';
  const ADMIN_PASSWORD_HASH = '3b30ca4667e2ae209bc206f169da59c5fdf4141f0ee079539c979894d8aae74e';
  const STORAGE_KEY = 'msdeaf-timeline-events';

  const footerYear = document.getElementById('footer-year');
  const container = document.getElementById('timeline-container');
  const yearNav = document.getElementById('timeline-year-nav');
  const adminAuthGate = document.getElementById('admin-auth-gate');
  const adminAuthForm = document.getElementById('admin-auth-form');
  const adminAuthStatus = document.getElementById('admin-auth-status');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminProtected = document.getElementById('admin-console-protected');
  const adminToggle = document.getElementById('admin-console-toggle');
  const adminLogoutButton = document.getElementById('admin-logout-button');
  const adminPanel = document.getElementById('admin-console-panel');
  const adminStatus = document.getElementById('admin-console-status');
  const adminForm = document.getElementById('admin-event-form');
  const adminFormTitle = document.getElementById('admin-form-title');
  const adminEventIdInput = document.getElementById('admin-event-id');
  const adminSaveButton = document.getElementById('admin-save-button');
  const adminCancelEditButton = document.getElementById('admin-cancel-edit-button');
  const adminNewEventButton = document.getElementById('admin-new-event-button');
  const adminExportButton = document.getElementById('admin-export-button');
  const adminResetButton = document.getElementById('admin-reset-button');
  const adminEventList = document.getElementById('admin-event-list');
  const adminEventCount = document.getElementById('admin-event-count');
  const desktopBreakpoint = window.matchMedia('(max-width: 700px)');

  const state = {
    meta: {
      title: document.querySelector('.site-title') ? document.querySelector('.site-title').textContent : 'Malaysian Deaf Sports History',
      subtitle: document.querySelector('.site-subtitle') ? document.querySelector('.site-subtitle').textContent : '',
      organization: document.querySelector('.powered-by strong') ? document.querySelector('.powered-by strong').textContent : 'MSDeaf'
    },
    defaultEvents: [],
    events: [],
    editingEventId: null,
    isAdminAuthenticated: false
  };

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event';
  }

  function getTimelineItemId(event) {
    return 'timeline-event-' + slugify(event.year) + '-' + slugify(event.id);
  }

  function normalizeEvent(event, index) {
    return {
      id: event && event.id !== undefined && event.id !== null ? String(event.id) : 'event-' + Date.now() + '-' + index,
      year: String(event && event.year ? event.year : ''),
      date: String(event && event.date ? event.date : event && event.year ? event.year : ''),
      title: String(event && event.title ? event.title : ''),
      description: String(event && event.description ? event.description : ''),
      image: String(event && event.image ? event.image : ''),
      imageAlt: String(event && event.imageAlt ? event.imageAlt : event && event.title ? event.title : '')
    };
  }

  function cloneEvents(events) {
    return events.map(function (event, index) {
      return normalizeEvent(event, index);
    });
  }

  function loadStoredEvents() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return null;
      }

      return cloneEvents(parsed);
    } catch (error) {
      console.warn('MSDeaf Timeline: could not read stored events.', error);
      return null;
    }
  }

  function loadAdminSession() {
    try {
      return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function persistAdminSession(isAuthenticated) {
    try {
      if (isAuthenticated) {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      } else {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (error) {
      console.warn('MSDeaf Timeline: could not persist admin session.', error);
    }
  }

  function setAdminAuthStatus(message, tone) {
    if (!adminAuthStatus) {
      return;
    }

    adminAuthStatus.textContent = message;
    adminAuthStatus.dataset.tone = tone || 'neutral';
  }

  function persistEvents() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
    } catch (error) {
      console.warn('MSDeaf Timeline: could not save events.', error);
      setAdminStatus('Changes could not be saved in this browser.', 'error');
    }
  }

  function clearStoredEvents() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('MSDeaf Timeline: could not clear stored events.', error);
    }
  }

  function setAdminStatus(message, tone) {
    if (!adminStatus) {
      return;
    }

    adminStatus.textContent = message;
    adminStatus.dataset.tone = tone || 'neutral';
  }

  function setAdminConsoleOpen(isOpen) {
    if (!adminToggle || !adminPanel) {
      return;
    }

    if (!state.isAdminAuthenticated) {
      adminPanel.hidden = true;
      adminToggle.setAttribute('aria-expanded', 'false');
      adminToggle.textContent = 'Open Admin Console';
      return;
    }

    adminPanel.hidden = !isOpen;
    adminToggle.setAttribute('aria-expanded', String(isOpen));
    adminToggle.textContent = isOpen ? 'Close Admin Console' : 'Open Admin Console';
  }

  function applyAdminAccessState() {
    if (adminAuthGate) {
      adminAuthGate.hidden = state.isAdminAuthenticated;
    }

    if (adminProtected) {
      adminProtected.hidden = !state.isAdminAuthenticated;
    }

    if (!state.isAdminAuthenticated) {
      setAdminConsoleOpen(false);
      resetAdminForm();
      if (adminPasswordInput) {
        adminPasswordInput.value = '';
      }
    }
  }

  async function sha256(value) {
    const encoded = new TextEncoder().encode(value);
    const buffer = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer)).map(function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function resetAdminForm() {
    if (!adminForm) {
      return;
    }

    adminForm.reset();
    adminEventIdInput.value = '';
    state.editingEventId = null;
    adminFormTitle.textContent = 'Create Event';
    adminSaveButton.textContent = 'Add Event';
    adminCancelEditButton.hidden = true;
  }

  function populateAdminForm(event) {
    if (!adminForm || !event) {
      return;
    }

    adminEventIdInput.value = event.id;
    adminForm.elements.year.value = event.year;
    adminForm.elements.date.value = event.date;
    adminForm.elements.title.value = event.title;
    adminForm.elements.description.value = event.description;
    adminForm.elements.image.value = event.image;
    adminForm.elements.imageAlt.value = event.imageAlt;

    state.editingEventId = event.id;
    adminFormTitle.textContent = 'Edit Event';
    adminSaveButton.textContent = 'Update Event';
    adminCancelEditButton.hidden = false;
    setAdminConsoleOpen(true);
  }

  function createPlaceholder(year) {
    const placeholder = document.createElement('div');
    placeholder.classList.add('card-photo-placeholder');

    const yearEl = document.createElement('div');
    yearEl.classList.add('placeholder-year');
    yearEl.textContent = year;

    const labelEl = document.createElement('div');
    labelEl.classList.add('placeholder-label');
    labelEl.textContent = 'MSDeaf';

    placeholder.appendChild(yearEl);
    placeholder.appendChild(labelEl);
    return placeholder;
  }

  function buildTimelineItem(event, side) {
    const item = document.createElement('div');
    item.classList.add('timeline-item', side);
    item.id = getTimelineItemId(event);

    const card = document.createElement('div');
    card.classList.add('timeline-card');

    if (event.image) {
      const img = document.createElement('img');
      img.classList.add('card-photo');
      img.alt = event.imageAlt || event.title;
      img.loading = 'lazy';
      img.addEventListener('load', function () {
        requestAnimationFrame(layoutTimeline);
      });
      img.onerror = function () {
        console.warn('MSDeaf Timeline: image not found — ' + event.image);
        this.replaceWith(createPlaceholder(event.year));
        requestAnimationFrame(layoutTimeline);
      };
      img.src = event.image;
      card.appendChild(img);
    } else {
      card.appendChild(createPlaceholder(event.year));
    }

    const body = document.createElement('div');
    body.classList.add('card-body');

    const dateTag = document.createElement('span');
    dateTag.classList.add('card-date');
    dateTag.textContent = event.date || event.year;

    const title = document.createElement('h2');
    title.classList.add('card-title');
    title.textContent = event.title;

    const desc = document.createElement('p');
    desc.classList.add('card-description');
    desc.textContent = event.description;

    body.appendChild(dateTag);
    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(body);
    item.appendChild(card);
    return item;
  }

  function buildYearNavigation(events) {
    if (!yearNav) {
      return;
    }

    yearNav.innerHTML = '';
    yearNav.hidden = events.length === 0;

    events.forEach(function (event) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('year-jump-button');
      button.textContent = event.year;
      button.title = event.title;
      button.setAttribute('aria-label', 'Jump to ' + event.year + ': ' + event.title);
      button.addEventListener('click', function () {
        const target = document.getElementById(getTimelineItemId(event));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      yearNav.appendChild(button);
    });
  }

  function renderAdminEventList() {
    if (!adminEventList || !adminEventCount) {
      return;
    }

    adminEventCount.textContent = state.events.length + ' event' + (state.events.length === 1 ? '' : 's');
    adminEventList.innerHTML = '';

    if (state.events.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.classList.add('admin-empty-state');
      emptyState.textContent = 'No events yet. Use the form to create the first timeline item.';
      adminEventList.appendChild(emptyState);
      return;
    }

    state.events.forEach(function (event, index) {
      const card = document.createElement('article');
      card.classList.add('admin-event-card');

      const order = document.createElement('p');
      order.classList.add('admin-event-order');
      order.textContent = 'Item ' + (index + 1);

      const meta = document.createElement('p');
      meta.classList.add('admin-event-meta');
      meta.textContent = event.year + (event.date && event.date !== event.year ? ' • ' + event.date : '');

      const title = document.createElement('h4');
      title.classList.add('admin-event-name');
      title.textContent = event.title;

      const description = document.createElement('p');
      description.classList.add('admin-event-description');
      description.textContent = event.description.length > 150 ? event.description.slice(0, 147) + '...' : event.description;

      const actions = document.createElement('div');
      actions.classList.add('admin-event-actions');

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.classList.add('admin-list-button');
      editButton.dataset.action = 'edit';
      editButton.dataset.eventId = event.id;
      editButton.textContent = 'Edit';

      const moveUpButton = document.createElement('button');
      moveUpButton.type = 'button';
      moveUpButton.classList.add('admin-list-button', 'secondary');
      moveUpButton.dataset.action = 'move-up';
      moveUpButton.dataset.eventId = event.id;
      moveUpButton.textContent = 'Move Up';
      moveUpButton.disabled = index === 0;

      const moveDownButton = document.createElement('button');
      moveDownButton.type = 'button';
      moveDownButton.classList.add('admin-list-button', 'secondary');
      moveDownButton.dataset.action = 'move-down';
      moveDownButton.dataset.eventId = event.id;
      moveDownButton.textContent = 'Move Down';
      moveDownButton.disabled = index === state.events.length - 1;

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.classList.add('admin-list-button', 'danger');
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.eventId = event.id;
      deleteButton.textContent = 'Delete';

      actions.appendChild(editButton);
      actions.appendChild(moveUpButton);
      actions.appendChild(moveDownButton);
      actions.appendChild(deleteButton);

      card.appendChild(order);
      card.appendChild(meta);
      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(actions);
      adminEventList.appendChild(card);
    });
  }

  function layoutTimeline() {
    const items = Array.from(container.querySelectorAll('.timeline-item'));

    container.style.height = '';
    items.forEach(function (item) {
      item.style.top = '';
    });

    if (desktopBreakpoint.matches || items.length === 0) {
      return;
    }

    let leftOffset = 0;
    let rightOffset = 96;
    const itemGap = 64;
    const crossColumnGap = 120;
    let lastLeftTop = null;
    let lastRightTop = null;

    items.forEach(function (item) {
      const isRight = item.classList.contains('right');
      let nextTop = isRight ? rightOffset : leftOffset;

      if (isRight && lastLeftTop !== null) {
        nextTop = Math.max(nextTop, lastLeftTop + crossColumnGap);
      }

      if (!isRight && lastRightTop !== null) {
        nextTop = Math.max(nextTop, lastRightTop + crossColumnGap);
      }

      item.style.top = nextTop + 'px';

      if (isRight) {
        lastRightTop = nextTop;
        rightOffset = nextTop + item.offsetHeight + itemGap;
      } else {
        lastLeftTop = nextTop;
        leftOffset = nextTop + item.offsetHeight + itemGap;
      }
    });

    container.style.height = Math.max(leftOffset, rightOffset) - itemGap + 'px';
  }

  function setupScrollReveal() {
    const items = container.querySelectorAll('.timeline-item');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      items.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      items.forEach(function (item) {
        item.classList.add('visible');
      });
    }
  }

  function renderTimeline() {
    container.innerHTML = '';

    if (state.events.length === 0) {
      container.style.height = '';
      container.innerHTML = '<p class="timeline-error">No events found. Add one from the admin console.</p>';
      return;
    }

    state.events.forEach(function (event, index) {
      const side = index % 2 === 0 ? 'left' : 'right';
      container.appendChild(buildTimelineItem(event, side));
    });

    setupScrollReveal();
    requestAnimationFrame(layoutTimeline);
  }

  function renderApplication() {
    buildYearNavigation(state.events);
    renderTimeline();
    renderAdminEventList();
  }

  function saveStateAndRender(message, tone) {
    persistEvents();
    renderApplication();
    setAdminStatus(message, tone || 'success');
  }

  function generateEventId() {
    return 'event-' + Date.now();
  }

  function exportTimelineData() {
    const payload = {
      title: state.meta.title,
      subtitle: state.meta.subtitle,
      organization: state.meta.organization,
      events: state.events
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = 'msdeaf-timeline-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);

    setAdminStatus('Exported the current timeline as JSON.', 'success');
  }

  function initializeAdminEvents() {
    state.isAdminAuthenticated = loadAdminSession();
    applyAdminAccessState();

    if (adminAuthForm) {
      adminAuthForm.addEventListener('submit', async function (submitEvent) {
        submitEvent.preventDefault();

        const password = adminPasswordInput ? adminPasswordInput.value : '';
        const passwordHash = await sha256(password);

        if (passwordHash !== ADMIN_PASSWORD_HASH) {
          setAdminAuthStatus('Incorrect password. Admin tools remain locked.', 'error');
          return;
        }

        state.isAdminAuthenticated = true;
        persistAdminSession(true);
        applyAdminAccessState();
        setAdminAuthStatus('Admin console unlocked for this browser session.', 'success');
        setAdminStatus('Admin console unlocked. Your timeline changes still save only in this browser.', 'success');
      });
    }

    if (adminToggle) {
      adminToggle.addEventListener('click', function () {
        setAdminConsoleOpen(adminPanel.hidden);
      });
    }

    if (adminLogoutButton) {
      adminLogoutButton.addEventListener('click', function () {
        state.isAdminAuthenticated = false;
        persistAdminSession(false);
        applyAdminAccessState();
        setAdminAuthStatus('Admin tools are locked.', 'neutral');
      });
    }

    if (adminNewEventButton) {
      adminNewEventButton.addEventListener('click', function () {
        resetAdminForm();
        setAdminConsoleOpen(true);
        setAdminStatus('Ready to create a new event.', 'neutral');
      });
    }

    if (adminCancelEditButton) {
      adminCancelEditButton.addEventListener('click', function () {
        resetAdminForm();
        setAdminStatus('Edit cancelled.', 'neutral');
      });
    }

    if (adminExportButton) {
      adminExportButton.addEventListener('click', exportTimelineData);
    }

    if (adminResetButton) {
      adminResetButton.addEventListener('click', function () {
        if (!window.confirm('Reset the timeline to the original data.json version for this browser?')) {
          return;
        }

        state.events = cloneEvents(state.defaultEvents);
        clearStoredEvents();
        resetAdminForm();
        renderApplication();
        setAdminStatus('Timeline reset to the default data.json content.', 'warning');
      });
    }

    if (adminForm) {
      adminForm.addEventListener('submit', function (submitEvent) {
        submitEvent.preventDefault();

        const formData = new FormData(adminForm);
        const eventData = normalizeEvent({
          id: adminEventIdInput.value || generateEventId(),
          year: formData.get('year'),
          date: formData.get('date') || formData.get('year'),
          title: formData.get('title'),
          description: formData.get('description'),
          image: formData.get('image'),
          imageAlt: formData.get('imageAlt') || formData.get('title')
        }, state.events.length + 1);

        if (!eventData.year || !eventData.title || !eventData.description) {
          setAdminStatus('Year, title, and description are required.', 'error');
          return;
        }

        if (state.editingEventId) {
          const existingIndex = state.events.findIndex(function (event) {
            return event.id === state.editingEventId;
          });

          if (existingIndex !== -1) {
            state.events.splice(existingIndex, 1, eventData);
            saveStateAndRender('Event updated successfully.');
          }
        } else {
          state.events.push(eventData);
          saveStateAndRender('Event added successfully.');
        }

        resetAdminForm();
      });
    }

    if (adminEventList) {
      adminEventList.addEventListener('click', function (clickEvent) {
        const button = clickEvent.target.closest('button[data-action]');
        if (!button) {
          return;
        }

        const eventId = button.dataset.eventId;
        const eventIndex = state.events.findIndex(function (event) {
          return event.id === eventId;
        });

        if (eventIndex === -1) {
          return;
        }

        if (button.dataset.action === 'edit') {
          populateAdminForm(state.events[eventIndex]);
          setAdminStatus('Editing event "' + state.events[eventIndex].title + '".', 'neutral');
          return;
        }

        if (button.dataset.action === 'delete') {
          if (!window.confirm('Delete "' + state.events[eventIndex].title + '" from the timeline?')) {
            return;
          }

          if (state.editingEventId === eventId) {
            resetAdminForm();
          }

          state.events.splice(eventIndex, 1);
          saveStateAndRender('Event deleted successfully.', 'warning');
          return;
        }

        if (button.dataset.action === 'move-up' && eventIndex > 0) {
          const movedEvent = state.events.splice(eventIndex, 1)[0];
          state.events.splice(eventIndex - 1, 0, movedEvent);
          saveStateAndRender('Event moved up.');
          return;
        }

        if (button.dataset.action === 'move-down' && eventIndex < state.events.length - 1) {
          const movedEvent = state.events.splice(eventIndex, 1)[0];
          state.events.splice(eventIndex + 1, 0, movedEvent);
          saveStateAndRender('Event moved down.');
        }
      });
    }
  }

  function initializeTimeline() {
    container.innerHTML = '<p class="timeline-loading">Loading timeline…</p>';

    fetch('data.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        state.meta.title = data.title || state.meta.title;
        state.meta.subtitle = data.subtitle || state.meta.subtitle;
        state.meta.organization = data.organization || state.meta.organization;
        state.defaultEvents = cloneEvents(Array.isArray(data.events) ? data.events : []);

        const storedEvents = loadStoredEvents();
        state.events = storedEvents && storedEvents.length ? storedEvents : cloneEvents(state.defaultEvents);

        renderApplication();
        resetAdminForm();

        if (storedEvents && storedEvents.length) {
          setAdminStatus('Loaded browser-saved timeline changes. Export JSON if you want to publish them.', 'warning');
        } else {
          setAdminStatus('Using data.json timeline. Changes you make here are saved only in this browser.', 'neutral');
        }

        if (!state.isAdminAuthenticated) {
          setAdminAuthStatus('Admin tools are locked.', 'neutral');
        } else {
          setAdminAuthStatus('Admin console unlocked for this browser session.', 'success');
        }
      })
      .catch(function (error) {
        console.error('Timeline load error:', error);

        const storedEvents = loadStoredEvents();
        state.defaultEvents = [];
        state.events = storedEvents && storedEvents.length ? storedEvents : [];

        renderApplication();
        resetAdminForm();

        if (storedEvents && storedEvents.length) {
          setAdminStatus('data.json could not be loaded. Using browser-saved timeline data instead.', 'warning');
        } else {
          setAdminStatus('data.json could not be loaded. You can still create events locally in this browser.', 'error');
        }

        if (!state.isAdminAuthenticated) {
          setAdminAuthStatus('Admin tools are locked.', 'neutral');
        } else {
          setAdminAuthStatus('Admin console unlocked for this browser session.', 'success');
        }
      });
  }

  initializeAdminEvents();

  window.addEventListener('resize', layoutTimeline);
  window.addEventListener('load', layoutTimeline);

  initializeTimeline();
})();
