<script is:inline>
  (() => {
    const form = document.getElementById("form_application");
    if (!form) return;

    const FIELD_WRAP_ID = "frm_field_89_container";

    const dropzone = document.getElementById("file89_dropzone");
    const fileInput = document.getElementById("field_n3sjm");
    const filenameEl = document.getElementById("resume_filename");
    const removeBtn = document.getElementById("resume_remove_btn");
    const statusEl = form.querySelector("[data-form-status]");

    if (!dropzone || !fileInput || !filenameEl) return;

    // Read max size from data attr with fallback
    const maxBytes =
      Number(fileInput.getAttribute("data-max-bytes") || "0") || 20 * 1024 * 1024;

    // Accept list from input (".pdf,.doc,.docx") -> [".pdf", ".doc", ".docx"]
    const acceptList = (fileInput.getAttribute("accept") || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Own the state (Safari-safe). We'll best-effort sync to input.files.
    let selectedFile = null;

    const fieldWrap = document.getElementById(FIELD_WRAP_ID);

    const showUploadError = (msg) => {
      if (!statusEl) return;
      statusEl.style.display = "block";
      statusEl.className = "form-status form-status--error";
      statusEl.textContent = msg;
    };

    const clearStatus = () => {
      if (!statusEl) return;
      statusEl.style.display = "none";
      statusEl.textContent = "";
    };

    const formatBytes = (n) => {
      const b = Number(n || 0);
      if (b < 1024) return `${b} B`;
      const kb = b / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      const mb = kb / 1024;
      return `${mb.toFixed(1)} MB`;
    };

    // ✅ Always store the truth on the input for Safari-safe submit handling
    const syncStore = () => {
      // Global submit handler reads fileInput._mmFile and appends to FormData
      fileInput._mmFile = selectedFile || null;
    };

    // Best-effort: sync our state back into the real <input type="file">
    const syncToInput = () => {
      // Always update Safari-safe store
      syncStore();

      try {
        if (!selectedFile) {
          fileInput.value = "";
          return;
        }
        const dt = new DataTransfer();
        dt.items.add(selectedFile);
        fileInput.files = dt.files;
      } catch (_) {
        // Safari may block programmatic assignment; that's OK.
      }
    };

    const setUI = () => {
      if (!selectedFile) {
        filenameEl.textContent = "";
        if (removeBtn) removeBtn.style.display = "none";
        return;
      }

      filenameEl.textContent = `Selected: ${selectedFile.name} (${formatBytes(selectedFile.size)})`;
      if (removeBtn) removeBtn.style.display = "inline-block";
    };

    const clearFile = () => {
      selectedFile = null;
      try {
        fileInput.value = "";
      } catch (_) {}
      syncToInput(); // ✅ also updates store
      setUI();
    };

    const extOf = (name) => {
      const i = String(name || "").lastIndexOf(".");
      return i >= 0 ? String(name).slice(i).toLowerCase() : "";
    };

    const isAllowedByAccept = (file) => {
      if (!acceptList.length) return true;
      const ext = extOf(file?.name);
      return acceptList.includes(ext);
    };

    const validateFile = (file) => {
      if (!file) return { ok: false, msg: "Please choose a file." };

      if (!isAllowedByAccept(file)) {
        return {
          ok: false,
          msg: `Invalid file type. Please upload one of: ${acceptList.join(", ")}`,
        };
      }

      if (maxBytes && file.size > maxBytes) {
        return {
          ok: false,
          msg: `File is too large. Please keep it under ${Math.round(
            maxBytes / (1024 * 1024),
          )}MB.`,
        };
      }

      return { ok: true, msg: "" };
    };

    const assignFile = (file) => {
      const { ok, msg } = validateFile(file);

      if (!ok) {
        clearFile();
        fieldWrap?.classList.add("frm_blank_field");
        showUploadError(msg);
        return;
      }

      selectedFile = file;
      clearStatus();
      fieldWrap?.classList.remove("frm_blank_field");

      syncToInput(); // ✅ updates store + best-effort input.files
      setUI();
    };

    const openPicker = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      fileInput.click();
    };

    // --- Remove button ---
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearFile();
        clearStatus();
        fieldWrap?.classList.add("frm_blank_field");
      });
    }

    // --- Click handling ---
    // Only open picker when clicking the dropzone but NOT clicking buttons inside it.
    dropzone.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.closest && t.closest("#resume_remove_btn")) return;
      if (t && t.closest && t.closest("button")) return;
      openPicker(e);
    });

    // Also wire the existing buttons inside the zone
    dropzone.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", openPicker);
    });

    // --- Input change ---
    fileInput.addEventListener("change", () => {
      const f = fileInput.files?.[0] || null;
      assignFile(f);
    });

    // --- Drag/drop ---
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0] || null;
      assignFile(f);
    });

    // --- Clear error on re-pick ---
    fileInput.addEventListener("click", () => {
      clearStatus();
    });

    // Clear UI when global form script clears fields
    form.addEventListener("mm:form:cleared", () => {
      clearFile();
      fieldWrap?.classList.add("frm_blank_field");
    });

    // ✅ Initialize store + UI
    syncStore();
    setUI();
  })();
</script>