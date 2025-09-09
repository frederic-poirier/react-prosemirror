import { Routes, Route } from "react-router-dom";
import Editor from "./Editor/Editor";
import Home from "./pages/Home";
import SettingsLayout from "./features/settings/SettingsLayout";
import SettingsHome from "./features/settings/SettingsHome";
import AppearanceSettings from "./features/settings/AppearanceSettings";
import PluginsSettings from "./features/settings/PluginsSettings";
import HotkeysSettings from './features/settings/HotkeysSettings'

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
        <Route path="hotkeys" element={<HotkeysSettings />} />

      </Route>
    </Routes>
  );
}
