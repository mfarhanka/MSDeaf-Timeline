<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MSDeaf Timeline Admin</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body data-api-base="../api/" class="admin-page-body">

  <header class="admin-page-header">
    <div class="admin-page-header-inner">
      <a class="admin-page-home-link" href="../index.html">Back to Timeline</a>
      <p class="admin-console-kicker">Admin Workspace</p>
      <h1 class="site-title admin-page-title">MSDeaf Timeline Admin</h1>
      <p class="site-subtitle admin-page-subtitle">Manage timeline events, save directly to MySQL, and preview the public timeline below.</p>
    </div>
  </header>

  <main>
    <section class="timeline-section">
      <section class="admin-console-shell" aria-label="Timeline admin console">
        <div class="admin-auth-gate" id="admin-auth-gate">
          <div class="admin-auth-copy">
            <p class="admin-console-kicker">Admin Access</p>
            <h2 class="admin-console-title">Protected Timeline Manager</h2>
            <p class="admin-console-note">Sign in to access the timeline editor, export tools, and reset controls for this server-backed timeline.</p>
          </div>

          <form class="admin-auth-form" id="admin-auth-form">
            <div class="admin-field admin-auth-field">
              <label for="admin-password">Admin Password</label>
              <input id="admin-password" name="password" type="password" autocomplete="current-password" required />
            </div>
            <button class="admin-console-action" type="submit">Unlock Admin Console</button>
          </form>
          <p class="admin-auth-status" id="admin-auth-status" aria-live="polite">Admin tools are locked.</p>
        </div>

        <div class="admin-console-protected" id="admin-console-protected" hidden>
          <div class="admin-console-bar">
            <div>
              <p class="admin-console-kicker">Admin Console</p>
              <h2 class="admin-console-title">Manage Timeline Events</h2>
              <p class="admin-console-note">Changes on this page are saved to MySQL. Export JSON only if you want a backup copy.</p>
            </div>
            <div class="admin-console-bar-actions">
              <button class="admin-console-toggle" id="admin-console-toggle" type="button" aria-expanded="false" aria-controls="admin-console-panel">Open Admin Console</button>
              <button class="admin-console-action danger" id="admin-logout-button" type="button">Lock Console</button>
            </div>
          </div>

          <div class="admin-console-panel" id="admin-console-panel" hidden>
            <div class="admin-console-toolbar">
              <p class="admin-console-status" id="admin-console-status" aria-live="polite">Connected to the server timeline.</p>
              <div class="admin-console-actions">
                <button class="admin-console-action secondary" id="admin-new-event-button" type="button">New Event</button>
                <button class="admin-console-action" id="admin-export-button" type="button">Export JSON</button>
                <button class="admin-console-action danger" id="admin-reset-button" type="button">Reset Default</button>
              </div>
            </div>

            <div class="admin-console-grid">
              <form class="admin-form" id="admin-event-form">
                <div class="admin-form-header">
                  <h3 class="admin-form-title" id="admin-form-title">Create Event</h3>
                  <p class="admin-form-note">Add a new timeline item or edit an existing one. The display order follows the list on the right.</p>
                </div>

                <input type="hidden" id="admin-event-id" name="eventId" />

                <div class="admin-field">
                  <label for="admin-year">Year</label>
                  <input id="admin-year" name="year" type="text" required />
                </div>

                <div class="admin-field">
                  <label for="admin-date">Date Label</label>
                  <input id="admin-date" name="date" type="text" placeholder="Example: August 1977" />
                </div>

                <div class="admin-field">
                  <label for="admin-title">Title</label>
                  <input id="admin-title" name="title" type="text" required />
                </div>

                <div class="admin-field">
                  <label for="admin-description">Description</label>
                  <textarea id="admin-description" name="description" rows="6" required></textarea>
                </div>

                <div class="admin-field">
                  <label for="admin-image">Image Path</label>
                  <input id="admin-image" name="image" type="text" placeholder="images/example.jpg" />
                </div>

                <div class="admin-field">
                  <label for="admin-image-alt">Image Alt Text</label>
                  <input id="admin-image-alt" name="imageAlt" type="text" placeholder="Describe the image" />
                </div>

                <div class="admin-form-actions">
                  <button class="admin-console-action" id="admin-save-button" type="submit">Add Event</button>
                  <button class="admin-console-action secondary" id="admin-cancel-edit-button" type="button" hidden>Cancel Edit</button>
                </div>
              </form>

              <section class="admin-event-list-panel" aria-labelledby="admin-event-list-title">
                <div class="admin-event-list-header">
                  <div>
                    <h3 class="admin-event-list-title" id="admin-event-list-title">Current Events</h3>
                    <p class="admin-event-list-note">Reorder items to change how the timeline alternates left and right.</p>
                  </div>
                  <p class="admin-event-count" id="admin-event-count">0 events</p>
                </div>
                <div class="admin-event-list" id="admin-event-list"></div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <div class="timeline-year-nav" id="timeline-year-nav" aria-label="Jump to timeline year">
        <!-- Year jump buttons will be injected by script.js -->
      </div>
      <div class="timeline-container" id="timeline-container">
        <!-- Timeline items will be injected by script.js -->
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>&copy; <span id="footer-year"></span> Malaysian Deaf Sports Association (MSDeaf). All rights reserved.</p>
  </footer>

  <script src="../script.js"></script>
</body>
</html>