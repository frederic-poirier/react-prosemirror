import { Routes, Route } from "react-router-dom";
import Editor from "./Editor/Editor";
import Home from "./Home";
import SettingsLayout from "./settings/SettingsLayout";
import SettingsHome from "./settings/SettingsHome";
import AppearanceSettings from "./settings/AppearanceSettings";
import PluginsSettings from "./settings/PluginsSettings";

export default function App() {
  return (
    
    <Routes>
      {/* Page d'accueil */}
      <Route path="/" element={<Home />} />

      {/* Route des notes */}
      <Route path="/notes/:noteId" element={<Editor />} />

      {/* Route des settings avec layout */}
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<SettingsHome />} />
        <Route path="appearance" element={<AppearanceSettings />} />
        <Route path="plugins" element={<PluginsSettings />} />
      </Route>
    </Routes>
  );
}
