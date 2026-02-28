// script.js
// Initialize Lucide Icons
lucide.createIcons();

// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("bg-[#0a0a0a]/98", "backdrop-blur-md", "py-4");
    navbar.classList.remove("bg-transparent", "py-6");
  } else {
    // Only go transparent if the mobile menu is CLOSED
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
let isMenuOpen = false;

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    mobileMenu.classList.remove("hidden");
    menuIcon.setAttribute("data-lucide", "x");
    // Force solid background when open so text doesn't bleed through
    navbar.classList.add("bg-[#0a0a0a]", "py-4");
    navbar.classList.remove("bg-transparent", "py-6");
  } else {
    mobileMenu.classList.add("hidden");
    menuIcon.setAttribute("data-lucide", "menu");
    // Restore transparency if we are at the top of the page
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

// Initial load animation
setTimeout(() => {
  document.querySelectorAll(".reveal-on-load").forEach((el) => {
    el.classList.add("is-visible");
  });
}, 100);

// ========== MAIN GALLERY SLIDER ==========
let currentSlide = 0;
const slides = document.querySelectorAll(".gallery-slide");
const dots = document.querySelectorAll(".gallery-dot");
const totalSlides = slides.length;

function updateSlider(index) {
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.add("opacity-100", "z-10");
      slide.classList.remove("opacity-0", "z-0");
    } else {
      slide.classList.add("opacity-0", "z-0");
      slide.classList.remove("opacity-100", "z-10");
    }
  });

  dots.forEach((dot, i) => {
    if (i === index) {
      dot.classList.add("w-8", "bg-cyan-400");
      dot.classList.remove("w-2", "bg-white/30");
    } else {
      dot.classList.add("w-2", "bg-white/30");
      dot.classList.remove("w-8", "bg-cyan-400");
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

// Auto-advance main gallery
setInterval(nextSlide, 5000);

// ========== ROOM GALLERY ==========
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

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    });
  }
});

// ========== BOOKING MODAL ==========
const modal = document.getElementById('bookingModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const bookingFormView = document.getElementById('bookingFormView');
const successView = document.getElementById('successView');
const navBookBtn = document.getElementById('navBookBtn');
const heroBookBtn = document.getElementById('heroBookBtn');
const roomsSection = document.getElementById('rooms');

// Scroll to rooms function
function scrollToRooms() {
  roomsSection.scrollIntoView({ behavior: 'smooth' });
  if (isMenuOpen) toggleMenu(); // Close mobile menu if open
}

// Update button behaviors
if (navBookBtn) {
  navBookBtn.addEventListener('click', scrollToRooms);
}
if (heroBookBtn) {
  heroBookBtn.addEventListener('click', scrollToRooms);
}
if (mobileBookBtn) {
  mobileBookBtn.addEventListener('click', scrollToRooms);
}

// Close modal functions
function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Reset to form view for next time
  bookingFormView.classList.remove('hidden');
  successView.classList.add('hidden');
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeModal);
}
if (closeSuccessBtn) {
  closeSuccessBtn.addEventListener('click', closeModal);
}

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
let currentGuestName = '';
let currentAdvance = 0;
let currentTotal = 0;

roomCards.forEach(card => {
  const btn = card.querySelector('.select-room-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentRoom = card.dataset.room;
      currentPrice = parseInt(card.dataset.price);
      if (selectedRoomDisplay) {
        selectedRoomDisplay.innerText = currentRoom;
      }
      if (pricePerNightDisplay) {
        pricePerNightDisplay.innerText = `৳${currentPrice.toLocaleString()}/night`;
      }
      
      // Reset to form view when opening modal
      if (bookingFormView) bookingFormView.classList.remove('hidden');
      if (successView) successView.classList.add('hidden');
      
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      lucide.createIcons();
      updateCalculation();
    });
  }
});

// ========== FLATPICKR DATE PICKER ==========
const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');

let checkinPicker, checkoutPicker;

if (checkinInput) {
  checkinPicker = flatpickr(checkinInput, {
    minDate: 'today',
    dateFormat: 'Y-m-d',
    onChange: function(selectedDates) {
      if (selectedDates.length > 0 && checkoutPicker) {
        checkoutPicker.set('minDate', selectedDates[0]);
      }
      validateDates();
      updateCalculation();
    }
  });
}

if (checkoutInput) {
  checkoutPicker = flatpickr(checkoutInput, {
    minDate: 'today',
    dateFormat: 'Y-m-d',
    onChange: function() {
      validateDates();
      updateCalculation();
    }
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
  
  if (inDate && outDate) {
    if (outDate <= inDate) {
      if (formError) formError.innerText = 'Check-out must be after check-in';
      return false;
    } else {
      if (formError) formError.innerText = '';
      return true;
    }
  }
  return true;
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
    nightsSpan.innerText = '0';
    totalSpan.innerText = '৳0';
    advanceSpan.innerText = '৳0';
  }
}

if (guests) {
  guests.addEventListener('input', updateCalculation);
}

// ========== GOOGLE SHEETS INTEGRATION ==========
// IMPORTANT: Replace with your deployed Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5wG-WQXyhkHPJgFWot3wuM2vi1fkg2XGaPXC8NPMsR3hhO3crs5ZRLp5xvdw2QbBTGg/exec';

const submitBtn = document.getElementById('submitBooking');

async function submitToSheets(data) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      // DO NOT USE mode: 'no-cors' - it breaks JSON data transfer
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}

if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    if (formError) formError.innerText = '';

    if (!currentRoom) {
      if (formError) formError.innerText = 'Please select a room first.';
      return;
    }

    const inDate = checkinPicker ? checkinPicker.selectedDates[0] : null;
    const outDate = checkoutPicker ? checkoutPicker.selectedDates[0] : null;
    
    if (!inDate || !outDate) {
      if (formError) formError.innerText = 'Please select check-in and check-out dates.';
      return;
    }
    if (!validateDates()) return;

    const nameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    currentGuestName = name;
    
    if (!name || !phone || !email) {
      if (formError) formError.innerText = 'Name, phone and email are required.';
      return;
    }

    const guestCount = guests ? parseInt(guests.value) || 1 : 1;
    if (guestCount < 1 || guestCount > 6) {
      if (formError) formError.innerText = 'Guests must be between 1 and 6.';
      return;
    }

    const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const total = nights * currentPrice;
    const advance = Math.round(total * 0.3);
    
    currentTotal = total;
    currentAdvance = advance;

    // --- FETCH REAL IP ADDRESS ---
    let userIP = "Unknown";
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      userIP = ipData.ip;
    } catch (err) {
      console.log("Could not fetch IP", err);
    }

    const payload = {
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
      room: currentRoom,
      pricePerNight: currentPrice,
      checkin: checkinInput ? checkinInput.value : '',
      checkout: checkoutInput ? checkoutInput.value : '',
      nights: nights,
      guests: guestCount,
      totalAmount: total,
      advance30: advance,
      fullName: name,
      phone: phone,
      email: email,
      ipAddress: userIP
    };

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-dots">Submitting</span>';
    submitBtn.disabled = true;

    try {
      await submitToSheets(payload);
      
      const successTotal = document.getElementById('successTotal');
      const successAdvance = document.getElementById('successAdvance');
      
      if (successTotal) successTotal.innerText = `৳${total.toLocaleString()}`;
      if (successAdvance) successAdvance.innerText = `৳${advance.toLocaleString()}`;
      
      if (bookingFormView) bookingFormView.classList.add('hidden');
      if (successView) successView.classList.remove('hidden');
      lucide.createIcons();
      
    } catch (error) {
      if (formError) formError.innerText = 'Submission failed. Please try again.';
      console.error(error);
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
    const message = encodeURIComponent(
      `Hi Mermaid Resort! I just submitted a booking for ${currentGuestName || 'a guest'}. I am sending the 30% advance of ৳${currentAdvance.toLocaleString()} now. Please confirm my reservation.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  });
}

// ========== WEB3FORMS CONTACT FORM INTEGRATION ==========
const contactForm = document.getElementById('contactForm');
const contactResult = document.getElementById('contactResult');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);
    
    contactResult.innerHTML = "Sending...";
    contactResult.className = "text-sm text-center font-medium mt-4 text-cyan-400 block";
    contactResult.classList.remove("hidden");

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json
    })
    .then(async (response) => {
      let json = await response.json();
      if (response.status == 200) {
        contactResult.innerHTML = "Message sent successfully! We'll be in touch.";
        contactResult.classList.replace("text-cyan-400", "text-green-400");
      } else {
        console.log(response);
        contactResult.innerHTML = json.message;
        contactResult.classList.replace("text-cyan-400", "text-red-400");
      }
    })
    .catch(error => {
      console.log(error);
      contactResult.innerHTML = "Something went wrong! Please try again later.";
      contactResult.classList.replace("text-cyan-400", "text-red-400");
    })
    .then(function() {
      contactForm.reset();
      setTimeout(() => {
        contactResult.classList.add("hidden");
      }, 5000);
    });
  });
}

// ========== BACK TO TOP BUTTON ==========
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    // Show button after scrolling down 500px
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

// Re-initialize icons
lucide.createIcons();
