import { showToast } from "src/shared/utils/showToast";

export const handleFullScreenChange = (mapRef) => {
    const handleChange = () => {
      if (document.fullscreenElement === mapRef.current) {
        showToast('Entered fullscreen mode!');
      } else {
        showToast('Exited fullscreen mode!');
      }
    };
  
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
  
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
};
  