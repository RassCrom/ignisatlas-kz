import { toast } from "react-toastify";

export const showToast = (message) => {
  toast.success(message, 
    {
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      theme: "dark",
    }
  );
};