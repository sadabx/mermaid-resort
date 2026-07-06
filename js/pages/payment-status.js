document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status");
  const bookingId = urlParams.get("id");
  const total = urlParams.get("total") || "0";
  const advance = urlParams.get("advance") || "0";
  const trxId = urlParams.get("trx") || "N/A";
  const reason = urlParams.get("reason") || "payment_failed";

  const iconBox = document.getElementById("statusIconBox");
  const icon = document.getElementById("statusIcon");
  const title = document.getElementById("statusTitle");
  const desc = document.getElementById("statusDesc");
  const receiptBox = document.getElementById("receiptBox");
  const primaryBtn = document.getElementById("primaryActionBtn");
  const secondaryBtn = document.getElementById("secondaryActionBtn");

  if (status === "success") {
    // success layout
    iconBox.className = "status-icon-box success";
    icon.setAttribute("data-lucide", "check");
    title.innerText = "Booking Confirmed!";
    desc.innerText = "Your 30% advance payment has been verified via bKash.";

    document.getElementById("receiptBookingId").innerText = `#${bookingId}`;
    document.getElementById("receiptTotal").innerText = `৳${parseInt(total).toLocaleString()}`;
    document.getElementById("receiptAdvance").innerText = `৳${parseInt(advance).toLocaleString()}`;
    document.getElementById("receiptTrxId").innerText = trxId;

    // WhatsApp Confirmation redirect
    primaryBtn.addEventListener("click", () => {
      const phoneNumber = '8801819077914';
      const message = encodeURIComponent(`Hi Mermaid Resort! I just completed my online payment for Booking ID #${bookingId}. Total: ৳${parseInt(total).toLocaleString()} (Paid 30% Advance: ৳${parseInt(advance).toLocaleString()}). TrxID: ${trxId}. Please note my booking.`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    });
  } else {
    // failure layout
    iconBox.className = "status-icon-box failed";
    icon.setAttribute("data-lucide", "x");
    title.innerText = "Payment Failed";
    
    let reasonLabel = "Your payment was cancelled or failed to process. No charges were made.";
    if (reason === "cancel") reasonLabel = "Your payment transaction was cancelled.";
    else if (reason === "bkash_auth_failed") reasonLabel = "bKash checkout authentication failed.";
    else if (reason === "insufficient_balance") reasonLabel = "Transaction failed: Insufficient Balance.";
    else if (reason === "debit_block") reasonLabel = "Transaction failed: Debit Block on wallet.";
    desc.innerText = reasonLabel;

    // Hide receipt details on failure
    receiptBox.style.display = "none";

    // Convert primary button to go back to booking
    primaryBtn.innerHTML = '<i data-lucide="arrow-left"></i> Try Booking Again';
    primaryBtn.className = "btn btn-primary btn-w-full";
    primaryBtn.addEventListener("click", () => {
      window.location.href = "/";
    });

    // Convert secondary button to WhatsApp Support
    secondaryBtn.innerHTML = '<i data-lucide="message-circle"></i> Contact Support';
    secondaryBtn.className = "btn btn-whatsapp btn-w-full";
    secondaryBtn.removeAttribute("href"); // Remove static link
    secondaryBtn.addEventListener("click", () => {
      const phoneNumber = '8801819077914';
      const message = encodeURIComponent(`Hi Mermaid Resort! I tried booking a room but my bKash payment failed. Error: ${reason}. Can you please assist me?`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    });
  }

  // refresh icons
  lucide.createIcons();
});
