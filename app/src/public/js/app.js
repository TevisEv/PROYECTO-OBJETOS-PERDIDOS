document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "Ocultar" : "Mostrar";
    });
  });

  document.querySelectorAll("[data-numeric-only]").forEach(function (input) {
    input.addEventListener("input", function () {
      const maxDigits = parseInt(input.dataset.maxDigits || "9", 10);
      input.value = input.value.replace(/\D/g, "").slice(0, maxDigits);
    });
  });

  document.querySelectorAll('input[type="file"][name="images"]').forEach(function (input) {
    input.addEventListener("change", function () {
      const preview = document.getElementById("image-preview");
      if (!preview) return;
      preview.innerHTML = "";
      Array.from(input.files)
        .slice(0, 4)
        .forEach(function (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "w-full h-24 object-cover rounded-lg border border-brand-100";
            preview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
    });
  });
});
