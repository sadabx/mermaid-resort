// script.js
// Initialize Lucide Icons
lucide.createIcons();

// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("bg-[#0a0a0a]/95", "backdrop-blur-md", "py-4");
    navbar.classList.remove("bg-transparent", "py-6");
  } else {
    navbar.classList.add("bg-transparent", "py-6");
    navbar.classList.remove("bg-[#0a0a0a]/95", "backdrop-blur-md", "py-4");
  }
});

// ========== MOBILE MENU ==========
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const menuIcon = document.getElementById("menu-icon");
const mobileLinks = document.querySelectorAll(".mobile-link");
let isMenuOpen = false;

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    mobileMenu.classList.remove("hidden");
    menuIcon.setAttribute("data-lucide", "x");
  } else {
    mobileMenu.classList.add("hidden");
    menuIcon.setAttribute("data-lucide", "menu");
  }
  lucide.createIcons();
}

mobileMenuBtn.addEventListener("click", toggleMenu);
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

// Initial load animation
setTimeout(() => {
  document.querySelectorAll(".reveal-on-load").forEach((el) => {
    el.classList.add("is-visible");
  });
}, 100);

// ========== GALLERY SLIDER ==========
let currentSlide = 0;
const slides = document.querySelectorAll(".gallery-slide");
const dots = document.querySelectorAll(".gallery-dot");
const totalSlides = slides.length;

function updateSlider(index) {
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.replace("opacity-0", "opacity-100");
      slide.classList.replace("z-0", "z-10");
    } else {
      slide.classList.replace("opacity-100", "opacity-0");
      slide.classList.replace("z-10", "z-0");
    }
  });

  dots.forEach((dot, i) => {
    if (i === index) {
      dot.classList.replace("w-2", "w-8");
      dot.classList.replace("bg-white/30", "bg-cyan-400");
    } else {
      dot.classList.replace("w-8", "w-2");
      dot.classList.replace("bg-cyan-400", "bg-white/30");
    }
  });
}

window.nextSlide = function() {
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider(currentSlide);
};

window.prevSlide = function() {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateSlider(currentSlide);
};

window.goToSlide = function(index) {
  currentSlide = index;
  updateSlider(currentSlide);
};

// Auto-advance slider
setInterval(nextSlide, 5000);

// ========== BOOKING MODAL ==========
const modal = document.getElementById('bookingModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const navBookBtn = document.getElementById('navBookBtn');
const heroBookBtn = document.getElementById('heroBookBtn');

// Open modal
function openModal() {
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  lucide.createIcons(); // Re-initialize icons in modal
}

// Close modal
function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = ''; // Restore scrolling
}

// Event listeners
navBookBtn.addEventListener('click', openModal);
heroBookBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// ========== ROOM SELECTION ==========
const roomCards = document.querySelectorAll('.room-card');
const selectedRoomDisplay = document.getElementById('selectedRoomDisplay');
const pricePerNightDisplay = document.getElementById('pricePerNightDisplay');
let currentRoom = '';
let currentPrice = 0;

roomCards.forEach(card => {
  const btn = card.querySelector('.select-room-btn');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    currentRoom = card.dataset.room;
    currentPrice = parseInt(card.dataset.price);
    selectedRoomDisplay.innerText = currentRoom;
    pricePerNightDisplay.innerText = `৳${currentPrice.toLocaleString()}/night`;
    openModal(); // Open modal when room is selected
    updateCalculation();
  });
});

// ========== DATE & CALCULATION ==========
const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
const guests = document.getElementById('guests');
const nightsSpan = document.getElementById('nightsCalc');
const totalSpan = document.getElementById('totalAmount');
const advanceSpan = document.getElementById('advanceAmount');

// Set min dates to today
const today = new Date().toISOString().split('T')[0];
checkin.min = today;
checkout.min = today;

function validateDates() {
  const inVal = checkin.value;
  const outVal = checkout.value;
  if (inVal && outVal) {
    const inD = new Date(inVal);
    const outD = new Date(outVal);
    if (outD <= inD) {
      document.getElementById('formError').innerText = 'Check-out must be after check-in';
      return false;
    } else {
      document.getElementById('formError').innerText = '';
      return true;
    }
  }
  return true;
}

function updateCalculation() {
  if (!currentPrice) {
    nightsSpan.innerText = '0';
    totalSpan.innerText = '৳0';
    advanceSpan.innerText = '৳0';
    return;
  }

  const inDate = checkin.value ? new Date(checkin.value) : null;
  const outDate = checkout.value ? new Date(checkout.value) : null;
  
  if (inDate && outDate && outDate > inDate) {
    const diffTime = outDate - inDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nightsSpan.innerText = nights;
    const total = nights * currentPrice;
    totalSpan.innerText = `৳${total.toLocaleString()}`;
    const advance = Math.round(total * 0.3);
    advanceSpan.innerText = `৳${advance.toLocaleString()}`;
  } else {
    nightsSpan.innerText = '0';
    totalSpan.innerText = '৳0';
    advanceSpan.innerText = '৳0';
  }
}

checkin.addEventListener('change', () => {
  validateDates();
  updateCalculation();
});
checkout.addEventListener('change', () => {
  validateDates();
  updateCalculation();
});
guests.addEventListener('input', updateCalculation);

// ========== GOOGLE SHEETS INTEGRATION ==========
// IMPORTANT: Replace with your deployed Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_placeholder/exec'; // <-- PASTE YOUR WEB APP URL HERE

const submitBtn = document.getElementById('submitBooking');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const paymentDiv = document.getElementById('paymentInstruction');

async function submitToSheets(data) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Apps Script
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true; // Assume success with no-cors
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}

submitBtn.addEventListener('click', async () => {
  // Clear previous messages
  formError.innerText = '';
  formSuccess.innerText = '';
  paymentDiv.classList.add('hidden');

  // Validation
  if (!currentRoom) {
    formError.innerText = 'Please select a room first.';
    return;
  }
  if (!checkin.value || !checkout.value) {
    formError.innerText = 'Please select check-in and check-out dates.';
    return;
  }
  if (!validateDates()) return;

  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  
  if (!name || !phone || !email) {
    formError.innerText = 'Name, phone and email are required.';
    return;
  }

  const guestCount = parseInt(guests.value) || 1;
  if (guestCount < 1 || guestCount > 6) {
    formError.innerText = 'Guests must be between 1 and 6.';
    return;
  }

  // Calculate nights and amounts
  const inDate = new Date(checkin.value);
  const outDate = new Date(checkout.value);
  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  const total = nights * currentPrice;
  const advance = Math.round(total * 0.3);

  const payload = {
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
    room: currentRoom,
    pricePerNight: currentPrice,
    checkin: checkin.value,
    checkout: checkout.value,
    nights: nights,
    guests: guestCount,
    totalAmount: total,
    advance30: advance,
    fullName: name,
    phone: phone,
    email: email,
    specialRequest: document.getElementById('request').value.trim() || ''
  };

  // Loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="loading-dots">Submitting</span>';
  submitBtn.disabled = true;

  try {
    await submitToSheets(payload);
    
    // Success
    formSuccess.innerText = '✓ Booking confirmed! Check payment instructions below.';
    paymentDiv.classList.remove('hidden');
    lucide.createIcons(); // Re-initialize icons in payment div
    
    // Reset form (optional)
    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('request').value = '';
    checkin.value = '';
    checkout.value = '';
    guests.value = '2';
    
    // Keep room selected for convenience
    updateCalculation();
    
  } catch (error) {
    formError.innerText = 'Submission failed. Please try again.';
    console.error(error);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Re-initialize icons after any dynamic changes
lucide.createIcons();