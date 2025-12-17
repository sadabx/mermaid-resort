 // Mobile menu toggle
      const mobileMenuBtn = document.getElementById("mobileMenuBtn");
      const mainNav = document.getElementById("mainNav");

      mobileMenuBtn.addEventListener("click", () => {
        mainNav.classList.toggle("active");
        mobileMenuBtn.innerHTML = mainNav.classList.contains("active")
          ? '<i class="fas fa-times"></i>'
          : '<i class="fas fa-bars"></i>';
      });

      // Close mobile menu when clicking a link
      document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
          mainNav.classList.remove("active");
          mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
      });

      // Form submission
      document
        .getElementById("reservationForm")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          // Get form values
          const checkin = document.getElementById("checkin").value;
          const checkout = document.getElementById("checkout").value;
          const guests = document.getElementById("guests").value;
          const roomType = document.getElementById("roomType");
          const roomTypeText = roomType.options[roomType.selectedIndex].text;
          const name = document.getElementById("name").value;
          const phone = document.getElementById("phone").value;

          // Show confirmation with resort details
          const confirmationMessage = `
                Thank you ${name}!
                
                Your reservation request for ${guests} guests in a ${roomTypeText} 
                from ${checkin} to ${checkout} has been received.
                
                Our team at Mermaid Resort will contact you shortly at ${phone} 
                to confirm your booking and discuss any special requests.
                
                We look forward to welcoming you to Saint Martin's Island!
            `;

          alert(confirmationMessage.replace(/\n\s+/g, "\n"));

          // Reset form
          this.reset();
        });

      // Set minimum date for check-in to today
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("checkin").setAttribute("min", today);

      // Update checkout min date when checkin changes
      document
        .getElementById("checkin")
        .addEventListener("change", function () {
          const checkinDate = new Date(this.value);
          const nextDay = new Date(checkinDate);
          nextDay.setDate(checkinDate.getDate() + 1);
          const nextDayFormatted = nextDay.toISOString().split("T")[0];
          document
            .getElementById("checkout")
            .setAttribute("min", nextDayFormatted);
        });

      // Set initial checkout min date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split("T")[0];
      document
        .getElementById("checkout")
        .setAttribute("min", tomorrowFormatted);

      // Header scroll effect
      window.addEventListener("scroll", function () {
        const header = document.querySelector("header");
        if (window.scrollY > 100) {
          header.style.padding = "12px 0";
          header.style.boxShadow = "0 10px 30px rgba(26, 95, 122, 0.15)";
        } else {
          header.style.padding = "20px 0";
          header.style.boxShadow = "0 5px 15px rgba(26, 95, 122, 0.08)";
        }
      });

      // Add wave animation to hero section
      const heroSection = document.querySelector(".hero");
      const waveInterval = setInterval(() => {
        const wave = document.createElement("div");
        wave.style.position = "absolute";
        wave.style.bottom = "0";
        wave.style.left = Math.random() * 100 + "%";
        wave.style.width = "4px";
        wave.style.height = "20px";
        wave.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        wave.style.borderRadius = "2px";
        wave.style.animation = "wave 1.5s ease-in-out forwards";
        heroSection.appendChild(wave);

        setTimeout(() => {
          wave.remove();
        }, 1500);
      }, 300);

      // Add CSS for wave animation
      const style = document.createElement("style");
      style.textContent = `
            @keyframes wave {
                0% {
                    transform: translateY(0) scaleY(1);
                    opacity: 0.5;
                }
                50% {
                    transform: translateY(-20px) scaleY(1.5);
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(-40px) scaleY(0);
                    opacity: 0;
                }
            }
        `;
      document.head.appendChild(style);