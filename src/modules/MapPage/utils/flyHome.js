import { showToast } from "src/shared/utils/showToast";
import { DEFAULT_POSITION } from "./mapConstants";

export const flyHome = (view) => {
    showToast('Карта обнулена')
    view.setCenter(DEFAULT_POSITION.center);
    view.setZoom(DEFAULT_POSITION.zoom);
}
