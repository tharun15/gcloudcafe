// main script
(function () {
  "use strict";

  // Dropdown Menu Toggler For Mobile
  // ----------------------------------------
  const dropdownMenuToggler = document.querySelectorAll(
    ".nav-dropdown > .nav-link",
  );

  dropdownMenuToggler.forEach((toggler) => {
    toggler?.addEventListener("click", (e) => {
      e.target.closest(".nav-item").classList.toggle("active");
    });
  });

  // Testimonial Slider
  // ----------------------------------------
  if (
    typeof Swiper !== "undefined" &&
    document.querySelector(".testimonial-slider")
  ) {
    new Swiper(".testimonial-slider", {
      spaceBetween: 24,
      loop: true,
      pagination: {
        el: ".testimonial-slider-pagination",
        type: "bullets",
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
      },
    });
  }

  // Placeholder newsletter form
  // ----------------------------------------
  const placeholderNewsletterForms = document.querySelectorAll(
    "[data-placeholder-subscribe]",
  );

  placeholderNewsletterForms.forEach((form) => {
    const status = form.querySelector("[data-newsletter-status]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (status) {
        status.textContent =
          "Thanks for your interest — email signup is still coming soon, so please follow along on social for now.";
      }
    });
  });

  // Post feedback widget
  // ----------------------------------------
  const feedbackWidgets = document.querySelectorAll("[data-post-feedback]");

  feedbackWidgets.forEach((widget) => {
    const storageKey = `gcloudcafe:post-feedback:${widget.dataset.postFeedback}`;
    const buttons = widget.querySelectorAll("[data-feedback-value]");
    const status = widget.querySelector("[data-feedback-status]");

    const updateWidget = (value) => {
      buttons.forEach((button) => {
        const isActive = button.dataset.feedbackValue === value;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      if (status) {
        status.textContent = value
          ? `Thanks — you marked this post as ${value.toLowerCase()}. Saved only in this browser.`
          : "No sign-in, no network request — just a lightweight local reaction.";
      }
    };

    let savedValue = "";

    try {
      savedValue = window.localStorage.getItem(storageKey) || "";
    } catch (error) {
      savedValue = "";
    }

    updateWidget(savedValue);

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const clickedValue = button.dataset.feedbackValue || "";
        const nextValue = clickedValue === savedValue ? "" : clickedValue;

        try {
          if (nextValue) {
            window.localStorage.setItem(storageKey, nextValue);
          } else {
            window.localStorage.removeItem(storageKey);
          }
        } catch (error) {
          // Ignore storage failures and still update the UI.
        }

        savedValue = nextValue;
        updateWidget(nextValue);
      });
    });
  });
})();
