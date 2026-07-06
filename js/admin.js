// js/admin.js - Admin Portal Logic & API integrations

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const preloader = document.getElementById("pagePreloader");
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const loginForm = document.getElementById("loginForm");
  const adminUsernameInput = document.getElementById("adminUsername");
  const adminPasswordInput = document.getElementById("adminPassword");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  
  const logoutBtn = document.getElementById("logoutBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  
  const statTotalBookings = document.getElementById("statTotalBookings");
  const statTotalRevenue = document.getElementById("statTotalRevenue");
  const statTotalAdvance = document.getElementById("statTotalAdvance");
  
  const filterSearch = document.getElementById("filterSearch");
  const filterRoom = document.getElementById("filterRoom");
  const filterTimeline = document.getElementById("filterTimeline");
  
  const bookingsTableBody = document.getElementById("bookingsTableBody");
  const noBookingsMessage = document.getElementById("noBookingsMessage");
  
  const detailsDrawer = document.getElementById("detailsDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const drawerBody = document.getElementById("drawerBody");
  
  const confirmCancelModal = document.getElementById("confirmCancelModal");
  const confirmBackdrop = document.getElementById("confirmBackdrop");
  const closeConfirmBtn = document.getElementById("closeConfirmBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // State Variables
  let allBookings = [];
  let currentDeleteId = null;

  // Initialize Icons
  lucide.createIcons();

  // Hide Preloader Helper
  const hidePreloader = () => {
    if (preloader) {
      preloader.classList.add("is-hidden");
      setTimeout(() => preloader.remove(), 400);
    }
  };

  // Toggle Password Visibility
  if (togglePasswordBtn && adminPasswordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = adminPasswordInput.getAttribute("type") === "password" ? "text" : "password";
      adminPasswordInput.setAttribute("type", type);
      const icon = togglePasswordBtn.querySelector("i") || togglePasswordBtn.querySelector("svg");
      if (icon) {
        icon.setAttribute("data-lucide", type === "password" ? "eye" : "eye-off");
        lucide.createIcons();
      }
    });
  }

  // Get Auth Token from LocalStorage
  const getAuthToken = () => {
    return localStorage.getItem("adminToken");
  };

  // Check Auth State
  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      showLogin();
      hidePreloader();
      return;
    }

    // Try fetching bookings to verify token validity
    const success = await fetchBookings(token);
    if (success) {
      showDashboard();
    } else {
      localStorage.removeItem("adminToken");
      showLogin();
    }
    hidePreloader();
  };

  const showLogin = () => {
    loginContainer.classList.remove("hidden");
    dashboardContainer.classList.add("hidden");
  };

  const showDashboard = () => {
    loginContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
    renderDashboard();
  };

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loginError) loginError.innerText = "";
      
      const username = adminUsernameInput ? adminUsernameInput.value.trim() : "";
      const password = adminPasswordInput.value;
      if (!username || !password) return;

      const originalText = loginSubmitBtn.innerHTML;
      loginSubmitBtn.innerHTML = '<span class="loading-dots">Authenticating</span>';
      loginSubmitBtn.disabled = true;

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success && data.token) {
          localStorage.setItem("adminToken", data.token);
          const success = await fetchBookings(data.token);
          if (success) {
            showDashboard();
          } else {
            if (loginError) loginError.innerText = "Failed to load bookings.";
          }
        } else {
          if (loginError) loginError.innerText = data.error || "Incorrect password.";
        }
      } catch (err) {
        if (loginError) loginError.innerText = "Network error. Make sure backend server is running.";
      } finally {
        loginSubmitBtn.innerHTML = originalText;
        loginSubmitBtn.disabled = false;
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminToken");
      window.location.reload();
    });
  }

  // Handle Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      const originalHtml = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i data-lucide="refresh-cw" class="animate-spin"></i> Refreshing';
      lucide.createIcons();
      refreshBtn.disabled = true;
      
      const token = getAuthToken();
      await fetchBookings(token);
      renderDashboard();
      
      refreshBtn.innerHTML = originalHtml;
      refreshBtn.disabled = false;
      lucide.createIcons();
    });
  }

  // Fetch Bookings from API
  const fetchBookings = async (token) => {
    try {
      const response = await fetch("/api/admin/bookings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        allBookings = await response.json();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Fetch bookings error:", err);
      return false;
    }
  };

  // Render dashboard values, tables & filters
  const renderDashboard = () => {
    updateStats();
    renderTable();
  };

  // Calculate & render stats
  const updateStats = () => {
    const count = allBookings.length;
    let revenue = 0;
    let advance = 0;

    allBookings.forEach(b => {
      revenue += parseInt(b.total_amount) || 0;
      advance += parseInt(b.advance_amount) || 0;
    });

    if (statTotalBookings) statTotalBookings.innerText = count.toLocaleString();
    if (statTotalRevenue) statTotalRevenue.innerText = `৳${revenue.toLocaleString()}`;
    if (statTotalAdvance) statTotalAdvance.innerText = `৳${advance.toLocaleString()}`;
  };

  // Filter Bookings Helper
  const getFilteredBookings = () => {
    const query = filterSearch.value.trim().toLowerCase();
    const roomType = filterRoom.value;
    const timeline = filterTimeline.value;
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return allBookings.filter(b => {
      // 1. Search Query filter (name, email, phone)
      const nameMatch = b.full_name?.toLowerCase().includes(query);
      const emailMatch = b.email?.toLowerCase().includes(query);
      const phoneMatch = b.phone?.includes(query);
      const searchMatch = !query || nameMatch || emailMatch || phoneMatch;

      // 2. Room Type filter
      const roomMatch = !roomType || b.room === roomType;

      // 3. Check-in Timeline filter
      let timelineMatch = true;
      if (timeline === "upcoming") {
        // Booking checkin is today or in the future
        timelineMatch = b.checkin >= todayStr;
      } else if (timeline === "past") {
        // Booking checkin was in the past
        timelineMatch = b.checkin < todayStr;
      }

      return searchMatch && roomMatch && timelineMatch;
    });
  };

  // Helper to render beautiful payment status badge
  const getPaymentStatusBadge = (status) => {
    status = (status || 'pending').toLowerCase();
    let bgColor = 'rgba(239, 68, 68, 0.1)'; // red for failed/cancelled
    let textColor = '#ef4444';
    let label = 'Unpaid';

    if (status === 'paid') {
      bgColor = 'rgba(16, 185, 129, 0.1)'; // green for paid
      textColor = '#10b981';
      label = 'Paid';
    } else if (status === 'pending') {
      bgColor = 'rgba(245, 158, 11, 0.1)'; // amber for pending
      textColor = '#f59e0b';
      label = 'Pending';
    } else if (status === 'cancelled') {
      bgColor = 'rgba(156, 163, 175, 0.1)'; // gray for cancelled
      textColor = '#9ca3af';
      label = 'Cancelled';
    }

    return `<span class="badge" style="background-color: ${bgColor}; color: ${textColor}; border: 1px solid ${textColor}40; margin: 0; padding: 0.2rem 0.5rem; font-size: 0.6875rem;">${label}</span>`;
  };

  // Render Bookings Table
  const renderTable = () => {
    if (!bookingsTableBody) return;
    
    const filtered = getFilteredBookings();
    bookingsTableBody.innerHTML = "";

    if (filtered.length === 0) {
      if (noBookingsMessage) noBookingsMessage.classList.remove("hidden");
      return;
    }

    if (noBookingsMessage) noBookingsMessage.classList.add("hidden");

    filtered.forEach(b => {
      const tr = document.createElement("tr");
      
      // Calculate formatted dates
      const dateRange = `${b.checkin} to ${b.checkout}`;
      const createdStr = b.created_at ? b.created_at.split(" ")[0] : "N/A";

      tr.innerHTML = `
        <td><span class="font-mono">#${b.id}</span></td>
        <td><span class="text-gray-400 font-mono">${createdStr}</span></td>
        <td>
          <div class="font-medium text-white">${escapeHtml(b.full_name)}</div>
          <div class="text-xs text-gray-500 font-mono">${escapeHtml(b.phone)}</div>
        </td>
        <td><span class="badge" style="background-color: var(--border-light); color: var(--text-gray-300); margin:0;">${escapeHtml(b.room)}</span></td>
        <td>
          <div>${dateRange}</div>
          <div class="text-xs text-red-500">${b.nights} ${b.nights === 1 ? 'night' : 'nights'} (${b.guests} guests)</div>
        </td>
        <td><span class="font-mono text-white">৳${parseInt(b.total_amount).toLocaleString()}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="font-mono text-white">৳${parseInt(b.advance_amount).toLocaleString()}</span>
            ${getPaymentStatusBadge(b.payment_status)}
          </div>
        </td>
        <td class="text-right">
          <div class="booking-actions">
            <button class="btn-icon btn-view-detail" title="View Details" data-id="${b.id}">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-icon btn-delete-booking" title="Delete Booking" data-id="${b.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

      bookingsTableBody.appendChild(tr);
    });

    lucide.createIcons();
    attachTableEventListeners();
  };

  // Attach Detail Drawer and Delete events to dynamic table buttons
  const attachTableEventListeners = () => {
    document.querySelectorAll(".btn-view-detail").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        openDetailsDrawer(id);
      });
    });

    document.querySelectorAll(".btn-delete-booking").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        openDeleteModal(id);
      });
    });
  };

  // Input Listeners for Filters
  if (filterSearch) filterSearch.addEventListener("input", renderTable);
  if (filterRoom) filterRoom.addEventListener("change", renderTable);
  if (filterTimeline) filterTimeline.addEventListener("change", renderTable);

  // Open Details Drawer
  const openDetailsDrawer = (id) => {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;

    if (!drawerBody) return;
    
    // Construct drawer body HTML
    let bodyHtml = `
      <div class="detail-section">
        <h4 class="detail-section-title">Guest Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Full Name</span>
            <span class="detail-value text-white">${escapeHtml(booking.full_name)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone Number</span>
            <span class="detail-value font-mono"><a href="tel:${booking.phone}" class="text-red-500 hover:underline">${escapeHtml(booking.phone)}</a></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email Address</span>
            <span class="detail-value"><a href="mailto:${booking.email}" class="text-red-500 hover:underline">${escapeHtml(booking.email)}</a></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">IP Address</span>
            <span class="detail-value font-mono text-gray-500">${escapeHtml(booking.ip_address || "Unknown")}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Reservation Details</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Room Type</span>
            <span class="detail-value text-white">${escapeHtml(booking.room)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Price per Night</span>
            <span class="detail-value price">৳${parseInt(booking.price_per_night).toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Check-in Date</span>
            <span class="detail-value text-white">${booking.checkin}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Check-out Date</span>
            <span class="detail-value text-white">${booking.checkout}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Nights & Guests</span>
            <span class="detail-value">${booking.nights} nights, ${booking.guests} guests</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Submitted On</span>
            <span class="detail-value font-mono text-gray-500">${booking.created_at || "N/A"}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Financial Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Cost</span>
            <span class="detail-value price text-white">৳${parseInt(booking.total_amount).toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Advance Needed (30%)</span>
            <span class="detail-value price text-red-500" style="display: flex; align-items: center; gap: 0.5rem;">
              ৳${parseInt(booking.advance_amount).toLocaleString()}
              ${getPaymentStatusBadge(booking.payment_status)}
            </span>
          </div>
          ${booking.bkash_trx_id ? `
          <div class="detail-item">
            <span class="detail-label">bKash Transaction ID</span>
            <span class="detail-value font-mono text-white">${escapeHtml(booking.bkash_trx_id)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Uploaded Attachments</h4>
        <div class="detail-photos">
    `;

    const token = getAuthToken();

    // Render ID Photo
    const hasIdPhoto = !!booking.id_photo_name;
    const idPhotoUrl = `/api/admin/bookings/attachments/${booking.id}/idPhoto?token=${encodeURIComponent(token)}`;
    const idPhotoDownloadUrl = `${idPhotoUrl}&download=true`;
    const isIdPdf = booking.id_photo_mime_type === 'application/pdf';

    bodyHtml += `
      <div class="photo-preview-box">
        <div class="photo-preview-header">
          <span class="photo-title">NID / Passport (${escapeHtml(booking.id_photo_name || "No ID Card Uploaded")})</span>
          ${hasIdPhoto ? `
            <a class="btn-download-photo" href="${idPhotoDownloadUrl}" target="_blank" download="${escapeHtml(booking.id_photo_name)}">
              <i data-lucide="download"></i> Download
            </a>
          ` : ""}
        </div>
        <div class="photo-img-wrapper">
          ${hasIdPhoto ? (
            isIdPdf ? `
              <div class="photo-placeholder">
                <i data-lucide="file-text"></i>
                <span style="margin: 0.5rem 0;">PDF Document: ${escapeHtml(booking.id_photo_name)}</span>
                <a href="${idPhotoUrl}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.5rem; width:auto; text-decoration:none;">
                  <i data-lucide="external-link"></i> Open PDF
                </a>
              </div>
            ` : `
              <img src="${idPhotoUrl}" alt="NID/Passport Photo" />
            `
          ) : `
            <div class="photo-placeholder">
              <i data-lucide="file-text"></i>
              <span>No NID or Passport copy uploaded.</span>
            </div>
          `}
        </div>
      </div>
    `;

    // Render Customer Photo
    const hasCustomerPhoto = !!booking.customer_photo_name;
    const customerPhotoUrl = `/api/admin/bookings/attachments/${booking.id}/customerPhoto?token=${encodeURIComponent(token)}`;
    const customerPhotoDownloadUrl = `${customerPhotoUrl}&download=true`;

    bodyHtml += `
      <div class="photo-preview-box">
        <div class="photo-preview-header">
          <span class="photo-title">Customer Photo (${escapeHtml(booking.customer_photo_name || "No Customer Photo Uploaded")})</span>
          ${hasCustomerPhoto ? `
            <a class="btn-download-photo" href="${customerPhotoDownloadUrl}" target="_blank" download="${escapeHtml(booking.customer_photo_name)}">
              <i data-lucide="download"></i> Download
            </a>
          ` : ""}
        </div>
        <div class="photo-img-wrapper">
          ${hasCustomerPhoto ? `
            <img src="${customerPhotoUrl}" alt="Customer Selfie Photo" />
          ` : `
            <div class="photo-placeholder">
              <i data-lucide="camera"></i>
              <span>No customer photo uploaded.</span>
            </div>
          `}
        </div>
      </div>
    `;

    bodyHtml += `
        </div>
      </div>
    `;

    drawerBody.innerHTML = bodyHtml;
    detailsDrawer.classList.add("is-open");
    lucide.createIcons();
  };

  // Close Drawer
  const closeDetailsDrawer = () => {
    detailsDrawer.classList.remove("is-open");
  };

  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDetailsDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDetailsDrawer);

  // Open Delete Confirmation Modal
  const openDeleteModal = (id) => {
    currentDeleteId = id;
    confirmCancelModal.classList.add("is-open");
  };

  // Close Delete Confirmation Modal
  const closeDeleteModal = () => {
    confirmCancelModal.classList.remove("is-open");
    currentDeleteId = null;
  };

  if (closeConfirmBtn) closeConfirmBtn.addEventListener("click", closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  if (confirmBackdrop) confirmBackdrop.addEventListener("click", closeDeleteModal);

  // Confirm Delete Action
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!currentDeleteId) return;
      
      const token = getAuthToken();
      const originalText = confirmDeleteBtn.innerText;
      confirmDeleteBtn.innerText = "Deleting...";
      confirmDeleteBtn.disabled = true;

      try {
        const response = await fetch(`/api/admin/bookings/${currentDeleteId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Remove from list & re-render
          allBookings = allBookings.filter(b => b.id !== currentDeleteId);
          renderDashboard();
          closeDeleteModal();
        } else {
          alert("Failed to delete booking.");
        }
      } catch (err) {
        alert("Error connecting to server.");
      } finally {
        confirmDeleteBtn.innerText = originalText;
        confirmDeleteBtn.disabled = false;
      }
    });
  }

  // Escape HTML Helper
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Init Auth Verification
  checkAuth();
});


