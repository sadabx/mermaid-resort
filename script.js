// Initialize Lucide Icons
lucide.createIcons();

let currentRoom = '';
let currentPrice = 0;
let currentGuestName = '';
let currentAdvance = 0;
let currentTotal = 0;
let isMenuOpen = false;

// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("bg-[#0a0a0a]/98", "backdrop-blur-md", "py-4");
    navbar.classList.remove("bg-transparent", "py-6");
  } else {
    if (!isMenuOpen) {
      navbar.classList.add("bg-transparent", "py-6");
      navbar.classList.remove("bg-[#0a0a0a]/98", "bg-[#0a0a0a]", "backdrop-blur-md", "py-4");
    }
  }
});

// ========== MOBILE MENU ==========
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const menuIcon = document.getElementById("menu-icon");
const mobileLinks = document.querySelectorAll(".mobile-link");
const mobileBookBtn = document.getElementById("mobileBookBtn");

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    mobileMenu.classList.remove("hidden");
    menuIcon.setAttribute("data-lucide", "x");
    navbar.classList.add("bg-[#0a0a0a]", "py-4");
    navbar.classList.remove("bg-transparent", "py-6");
  } else {
    mobileMenu.classList.add("hidden");
    menuIcon.setAttribute("data-lucide", "menu");
    if (window.scrollY <= 50) {
      navbar.classList.add("bg-transparent", "py-6");
      navbar.classList.remove("bg-[#0a0a0a]", "bg-[#0a0a0a]/98", "backdrop-blur-md", "py-4");
    }
  }
  lucide.createIcons();
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", toggleMenu);
mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (isMenuOpen) toggleMenu();
  });
});

// ========== SCROLL REVEAL ==========
const revealElements = document.querySelectorAll(".scroll-reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
revealElements.forEach((el) => revealObserver.observe(el));

setTimeout(() => {
  document.querySelectorAll(".reveal-on-load").forEach((el) => {
    el.classList.add("is-visible");
  });
}, 100);

// ========== DYNAMIC ROOM RENDERING & LOGIC ==========
const roomsContainer = document.getElementById('rooms-container');

if (roomsContainer && typeof roomsData !== 'undefined') {
  roomsContainer.innerHTML = roomsData.map((room, index) => `
    <div class="room-card group relative fade-in-up scroll-reveal cursor-pointer" style="transition-delay: 0.${index + 1}s" data-room="${room.name}" data-price="${room.price}">
      <div class="relative h-80 overflow-hidden bg-[#111] border border-[#222]">
        <div class="room-gallery absolute inset-0">
          ${room.images.map((img, i) => `<img src="${img}" class="gallery-img ${i === 0 ? 'active' : ''} absolute inset-0 w-full h-full object-cover opacity-0" alt="${room.name}" />`).join('')}
        </div>
        <button class="select-room-btn absolute bottom-0 left-0 w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          Select Room
        </button>
        <div class="absolute inset-y-0 w-full flex justify-between items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          <button class="gallery-prev w-8 h-8 bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors pointer-events-auto"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
          <button class="gallery-next w-8 h-8 bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors pointer-events-auto"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
        </div>
      </div>
      <div class="pt-5 text-center">
        <h3 class="text-lg font-medium text-gray-200 mb-1 tracking-wide">${room.name}</h3>
        <p class="text-red-500 font-semibold tracking-widest">৳${room.price.toLocaleString()}</p>
        <div class="flex justify-center flex-wrap gap-2 mt-3 opacity-60 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
          ${room.features.join(' <span class="text-gray-700">•</span> ')}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('#rooms-container .scroll-reveal').forEach(el => revealObserver.observe(el));
  lucide.createIcons();

  document.querySelectorAll('.room-card').forEach(card => {
    const gallery = card.querySelector('.room-gallery');
    if (!gallery) return;
    
    const prevBtn = card.querySelector('.gallery-prev');
    const nextBtn = card.querySelector('.gallery-next');
    const images = gallery.querySelectorAll('.gallery-img');
    let currentIndex = 0;

    function showImage(index) {
      images.forEach(img => img.classList.remove('active'));
      images[index].classList.add('active');
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); currentIndex = (currentIndex - 1 + images.length) % images.length; showImage(currentIndex); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); currentIndex = (currentIndex + 1) % images.length; showImage(currentIndex); });
  });

  document.querySelectorAll('.select-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.room-card');
      currentRoom = card.dataset.room;
      currentPrice = parseInt(card.dataset.price);
      
      const selectedRoomDisplay = document.getElementById('selectedRoomDisplay');
      const pricePerNightDisplay = document.getElementById('pricePerNightDisplay');
      
      if (selectedRoomDisplay) selectedRoomDisplay.innerText = currentRoom;
      if (pricePerNightDisplay) pricePerNightDisplay.innerText = `৳${currentPrice.toLocaleString()}/night`;
      
      if (bookingFormView) bookingFormView.classList.remove('hidden');
      if (successView) successView.classList.add('hidden');
      
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      lucide.createIcons();
      updateCalculation();
    });
  });
}

// ========== BOOKING MODAL LOGIC ==========
const modal = document.getElementById('bookingModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const bookingFormView = document.getElementById('bookingFormView');
const successView = document.getElementById('successView');
const navBookBtn = document.getElementById('navBookBtn');
const heroBookBtn = document.getElementById('heroBookBtn');
const roomsSection = document.getElementById('rooms');

function scrollToRooms() {
  roomsSection.scrollIntoView({ behavior: 'smooth' });
  if (isMenuOpen) toggleMenu();
}

if (navBookBtn) navBookBtn.addEventListener('click', scrollToRooms);
if (heroBookBtn) heroBookBtn.addEventListener('click', scrollToRooms);
if (mobileBookBtn) mobileBookBtn.addEventListener('click', scrollToRooms);

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  bookingFormView.classList.remove('hidden');
  successView.classList.add('hidden');
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });

// ========== FLATPICKR DATE PICKER ==========
const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');
let checkinPicker, checkoutPicker;

if (checkinInput) {
  checkinPicker = flatpickr(checkinInput, {
    minDate: 'today', dateFormat: 'Y-m-d',
    onChange: function(selectedDates) {
      if (selectedDates.length > 0 && checkoutPicker) checkoutPicker.set('minDate', selectedDates[0]);
      validateDates(); updateCalculation();
    }
  });
}

if (checkoutInput) {
  checkoutPicker = flatpickr(checkoutInput, {
    minDate: 'today', dateFormat: 'Y-m-d',
    onChange: function() { validateDates(); updateCalculation(); }
  });
}

// ========== DATE VALIDATION & CALCULATION ==========
const guests = document.getElementById('guests');
const nightsSpan = document.getElementById('nightsCalc');
const totalSpan = document.getElementById('totalAmount');
const advanceSpan = document.getElementById('advanceAmount');
const formError = document.getElementById('formError');

function validateDates() {
  if (!checkinPicker || !checkoutPicker) return true;
  const inDate = checkinPicker.selectedDates[0];
  const outDate = checkoutPicker.selectedDates[0];
  if (inDate && outDate && outDate <= inDate) {
    if (formError) formError.innerText = 'Check-out must be after check-in'; return false;
  } else {
    if (formError) formError.innerText = ''; return true;
  }
}

function updateCalculation() {
  if (!currentPrice || !nightsSpan || !totalSpan || !advanceSpan) return;
  const inDate = checkinPicker ? checkinPicker.selectedDates[0] : null;
  const outDate = checkoutPicker ? checkoutPicker.selectedDates[0] : null;
  if (inDate && outDate && outDate > inDate) {
    const diffTime = outDate - inDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nightsSpan.innerText = nights;
    const total = nights * currentPrice;
    currentTotal = total;
    totalSpan.innerText = `৳${total.toLocaleString()}`;
    const advance = Math.round(total * 0.3);
    currentAdvance = advance;
    advanceSpan.innerText = `৳${advance.toLocaleString()}`;
  } else {
    nightsSpan.innerText = '0'; totalSpan.innerText = '৳0'; advanceSpan.innerText = '৳0';
  }
}

if (guests) guests.addEventListener('input', updateCalculation);

// ========== GOOGLE SHEETS SUBMISSION ==========
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5wG-WQXyhkHPJgFWot3wuM2vi1fkg2XGaPXC8NPMsR3hhO3crs5ZRLp5xvdw2QbBTGg/exec';
const submitBtn = document.getElementById('submitBooking');

if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    if (formError) formError.innerText = '';
    if (!currentRoom) { if (formError) formError.innerText = 'Please select a room first.'; return; }

    const inDate = checkinPicker ? checkinPicker.selectedDates[0] : null;
    const outDate = checkoutPicker ? checkoutPicker.selectedDates[0] : null;
    if (!inDate || !outDate) { if (formError) formError.innerText = 'Please select check-in and check-out dates.'; return; }
    if (!validateDates()) return;

    const nameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    currentGuestName = name;
    
    if (!name || !phone || !email) { if (formError) formError.innerText = 'Name, phone and email are required.'; return; }

    const guestCount = guests ? parseInt(guests.value) || 1 : 1;
    if (guestCount < 1 || guestCount > 6) { if (formError) formError.innerText = 'Guests must be between 1 and 6.'; return; }

    const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const total = nights * currentPrice;
    const advance = Math.round(total * 0.3);
    currentTotal = total; currentAdvance = advance;

    let userIP = "Unknown";
    try { const r = await fetch('https://api.ipify.org?format=json'); const d = await r.json(); userIP = d.ip; } catch (err) {}

    const payload = {
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
      room: currentRoom, pricePerNight: currentPrice, checkin: checkinInput.value, checkout: checkoutInput.value,
      nights: nights, guests: guestCount, totalAmount: total, advance30: advance,
      fullName: name, phone: phone, email: email, ipAddress: userIP
    };

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-dots">Submitting</span>';
    submitBtn.disabled = true;

    try {
      await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      
      const successTotal = document.getElementById('successTotal');
      const successAdvance = document.getElementById('successAdvance');
      
      if (successTotal) successTotal.innerText = `৳${total.toLocaleString()}`;
      if (successAdvance) successAdvance.innerText = `৳${advance.toLocaleString()}`;
      
      if (bookingFormView) bookingFormView.classList.add('hidden');
      if (successView) successView.classList.remove('hidden');
      lucide.createIcons();
      
    } catch (error) {
      if (formError) formError.innerText = 'Submission failed. Please try again.';
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ========== WHATSAPP CONFIRMATION ==========
const whatsappBtn = document.getElementById('whatsappConfirmBtn');
if (whatsappBtn) {
  whatsappBtn.addEventListener('click', () => {
    const phoneNumber = '8801819077914';
    const message = encodeURIComponent(`Hi Mermaid Resort! I just submitted a booking for ${currentGuestName || 'a guest'}. I am sending the 30% advance of ৳${currentAdvance.toLocaleString()} now. Please confirm my reservation.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  });
}

// ========== DYNAMIC CONTACT FORM BUTTON STATUS ==========
const contactForm = document.getElementById('contactForm');
const contactSubmitBtn = document.getElementById('contactSubmitBtn');

if (contactForm && contactSubmitBtn) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const originalText = contactSubmitBtn.innerHTML;
    contactSubmitBtn.innerHTML = '<span class="loading-dots">Sending</span>';
    contactSubmitBtn.disabled = true;

    const formData = new FormData(contactForm);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: json
    })
    .then(async (response) => {
      let json = await response.json();
      if (response.status == 200) {
        contactSubmitBtn.innerHTML = 'Message Sent ✓';
        contactSubmitBtn.classList.replace('bg-red-600', 'bg-green-600');
        contactSubmitBtn.classList.replace('hover:bg-red-700', 'hover:bg-green-700');
      } else {
        contactSubmitBtn.innerHTML = 'Error. Try Again';
      }
    })
    .catch(error => {
      contactSubmitBtn.innerHTML = 'Error. Try Again';
    })
    .finally(() => {
      contactForm.reset();
      // Revert button back to normal after 4 seconds
      setTimeout(() => {
        contactSubmitBtn.innerHTML = originalText;
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.classList.replace('bg-green-600', 'bg-red-600');
        contactSubmitBtn.classList.replace('hover:bg-green-700', 'hover:bg-red-700');
      }, 4000);
    });
  });
}

// ========== BACK TO TOP BUTTON ==========
const backToTopBtn = document.getElementById('backToTopBtn');
if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-4');
      backToTopBtn.classList.add('opacity-100', 'visible', 'translate-y-0');
    } else {
      backToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-4');
      backToTopBtn.classList.remove('opacity-100', 'visible', 'translate-y-0');
    }
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}