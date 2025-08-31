import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl    from "leaflet/dist/images/marker-icon.png";
import shadowUrl  from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl, shadowUrl });
export default L;
