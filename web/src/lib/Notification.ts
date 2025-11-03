import Swal, { type SweetAlertOptions } from "sweetalert2";

export const showAlert = (options: SweetAlertOptions) => {
  return Swal.fire(options);
};

export const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  color: "black",
  background: "#CFFCDF",
  customClass: {
    container: 'swal2-top-layer'
  },
  didOpen: () => {
    // Set highest z-index for the container
    const container = document.querySelector('.swal2-container') as HTMLElement;
    if (container) {
      container.style.setProperty('z-index', '999999', 'important');
    }
  },
});

export const showSuccess = (message: string) => {
  return Toast.fire({
    icon: "success",
    title: message,
  });
};

export const showError = (message: string) => {
  return Toast.fire({
    icon: "error",
    title: message,
    background: "#FFE6E6",
  });
};

export const showWarning = (message: string) => {
  return Toast.fire({
    icon: "warning",
    title: message,
    background: "#FFF3CD",
  });
};

export const showInfo = (message: string) => {
  return Toast.fire({
    icon: "info",
    title: message,
    background: "#D1ECF1",
  });
};

// Confirm Dialog
export const showConfirm = (options: {
  title?: string;
  text?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
}) => {
  const {
    title = "Are you sure?",
    text = "",
    icon = "warning",
    confirmButtonText = "Yes, confirm!",
    cancelButtonText = "Cancel",
    confirmButtonColor = "#3085d6", // Chỉ mã màu thuần
    cancelButtonColor = "#d33", // Chỉ mã màu thuần
  } = options;

  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      container: 'swal2-top-layer'
    },
    didOpen: () => {
      // Set highest z-index for the container
      const container = document.querySelector('.swal2-container') as HTMLElement;
      if (container) {
        container.style.setProperty('z-index', '999999', 'important');
      }

      const confirmBtn = document.querySelector(
        ".swal2-confirm"
      ) as HTMLElement;
      const cancelBtn = document.querySelector(".swal2-cancel") as HTMLElement;

      if (confirmBtn) {
        confirmBtn.style.setProperty(
          "background-color",
          confirmButtonColor,
          "important"
        );
        confirmBtn.style.setProperty(
          "border-color",
          confirmButtonColor,
          "important"
        );
      }

      if (cancelBtn) {
        cancelBtn.style.setProperty(
          "background-color",
          cancelButtonColor,
          "important"
        );
        cancelBtn.style.setProperty(
          "border-color",
          cancelButtonColor,
          "important"
        );
      }
    },
  });
};

// Error Confirm (single OK button)
export const showErrorConfirm = (message: string, title = "Error") => {
  return Swal.fire({
    title,
    text: message,
    icon: "error",
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: "OK",
    cancelButtonColor: "#d33",
    buttonsStyling: true,
    focusCancel: true,
    reverseButtons: false,
    allowEscapeKey: true,
    allowOutsideClick: true,
    customClass: {
      container: 'swal2-top-layer'
    },
    didOpen: () => {
      // Set highest z-index for the container
      const container = document.querySelector('.swal2-container') as HTMLElement;
      if (container) {
        container.style.setProperty('z-index', '999999', 'important');
      }
    },
  });
};

// Delete Confirmation (pre-configured)
export const showDeleteConfirm = (itemName?: string) => {
  return showConfirm({
    title: "Delete Confirmation",
    text: `Are you sure you want to delete ${
      itemName || "this item"
    }? This action cannot be undone.`,
    icon: "warning",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  });
};

// Save Confirmation
export const showSaveConfirm = (message?: string) => {
  return showConfirm({
    title: "Save Changes",
    text: message || "Do you want to save the changes?",
    icon: "question",
    confirmButtonText: "Save",
    cancelButtonText: "Don't Save",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
  });
};

// Loading/Processing Dialog
export const showLoading = (title = "Processing...", text = "Please wait") => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    customClass: {
      container: 'swal2-top-layer'
    },
    didOpen: () => {
      // Set highest z-index for the container
      const container = document.querySelector('.swal2-container') as HTMLElement;
      if (container) {
        container.style.setProperty('z-index', '999999', 'important');
      }
      Swal.showLoading();
    },
  });
};

// Close loading
export const closeLoading = () => {
  Swal.close();
};

// Custom confirm with input
export const showInputConfirm = (options: {
  title: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputType?: "text" | "email" | "password" | "number";
  inputValue?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  inputValidator?: (value: string) => string | null;
}) => {
  const {
    title,
    inputLabel = "",
    inputPlaceholder = "",
    inputType = "text",
    inputValue = "",
    confirmButtonText = "Confirm",
    cancelButtonText = "Cancel",
    inputValidator,
  } = options;

  return Swal.fire({
    title,
    input: inputType,
    inputLabel,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      container: 'swal2-top-layer'
    },
    didOpen: () => {
      // Set highest z-index for the container
      const container = document.querySelector('.swal2-container') as HTMLElement;
      if (container) {
        container.style.setProperty('z-index', '999999', 'important');
      }
    },
    inputValidator:
      inputValidator ||
      ((value) => {
        if (!value) {
          return "This field is required!";
        }
        return null;
      }),
  });
};
