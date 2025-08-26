import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function SettingsHome() {
  return (
    <>
    <h1>Settings</h1>
    <ul className="block-list">
      <li><Link to="appearance">Appearance <ChevronRight /></Link></li>
      <li><Link to="plugins">Plugins <ChevronRight /></Link></li>
    </ul>
    </>
  );
}
